import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import firebaseAppletConfig from '../firebase-applet-config.json';

interface ServiceAccountInput {
  project_id?: string;
  projectId?: string;
  client_email?: string;
  clientEmail?: string;
  private_key?: string;
  privateKey?: string;
}

const SUPER_ADMIN_EMAIL = 'mustaphashehuyana@gmail.com';
const ALLOWED_ORIGINS = new Set([
  'https://abokibdc.com.ng',
  'https://www.abokibdc.com.ng',
  'https://admin.abokibdc.com.ng',
  'https://app.abokibdc.com.ng',
]);

function loadServiceAccountFromEnv(): {
  projectId: string;
  clientEmail: string;
  privateKey: string;
} | null {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (rawJson) {
    try {
      const decoded = rawJson.startsWith('{')
        ? rawJson
        : Buffer.from(rawJson, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded) as ServiceAccountInput;
      const projectId = parsed.project_id || parsed.projectId || firebaseAppletConfig.projectId;
      const clientEmail = parsed.client_email || parsed.clientEmail;
      const privateKey = (parsed.private_key || parsed.privateKey || '').replace(/\\n/g, '\n');

      if (projectId && clientEmail && privateKey) {
        return { projectId, clientEmail, privateKey };
      }
    } catch {
      return null;
    }
  }

  const projectId = (process.env.FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId || '').trim();
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').trim();
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n').trim();

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }

  return null;
}

function getFirebaseAdminApp(): App | null {
  if (getApps().length > 0) {
    return getApp();
  }

  const serviceAccount = loadServiceAccountFromEnv();
  if (!serviceAccount) {
    return null;
  }

  return initializeApp({
    credential: cert({
      projectId: serviceAccount.projectId,
      clientEmail: serviceAccount.clientEmail,
      privateKey: serviceAccount.privateKey,
    }),
    projectId: serviceAccount.projectId,
  });
}

function applyCorsHeaders(req: any, res: any) {
  const origin = typeof req.headers?.origin === 'string' ? req.headers.origin : '';
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
}

export default async function handler(req: any, res: any) {
  applyCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  const adminApp = getFirebaseAdminApp();
  if (!adminApp) {
    res.status(503).json({
      success: false,
      configured: false,
      error:
        'Firebase Service Account is not configured on the server yet. Add FIREBASE_SERVICE_ACCOUNT_JSON in Vercel Environment Variables.',
    });
    return;
  }

  // 1. Verify Firebase Auth ID token from Authorization: Bearer <token>
  const authHeader =
    typeof req.headers?.authorization === 'string' ? req.headers.authorization : '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!idToken) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  let decodedToken: { uid: string; email?: string; email_verified?: boolean };
  try {
    decodedToken = await getAuth(adminApp).verifyIdToken(idToken);
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired authentication token' });
    return;
  }

  // 2. Enforce Admin authorization server-side
  let isAuthorizedAdmin =
    decodedToken.email === SUPER_ADMIN_EMAIL && decodedToken.email_verified === true;

  if (!isAuthorizedAdmin) {
    try {
      const adminDb = getFirestore(adminApp, firebaseAppletConfig.firestoreDatabaseId);
      const roleDoc = await adminDb.collection('user_roles').doc(decodedToken.uid).get();
      const role = roleDoc.exists ? roleDoc.data()?.role : null;
      isAuthorizedAdmin = role === 'super_admin' || role === 'branch_admin';
    } catch {
      isAuthorizedAdmin = false;
    }
  }

  if (!isAuthorizedAdmin) {
    res.status(403).json({ success: false, error: 'Admin access required to send push notifications' });
    return;
  }

  // 3. Validate payload strictly
  let bodyObj: Record<string, unknown> = {};
  if (typeof req.body === 'string') {
    try {
      bodyObj = JSON.parse(req.body || '{}');
    } catch {
      res.status(400).json({ success: false, error: 'Invalid JSON request body' });
      return;
    }
  } else if (req.body && typeof req.body === 'object') {
    bodyObj = req.body;
  }
  const token = typeof bodyObj.token === 'string' ? bodyObj.token.trim() : '';
  const title = typeof bodyObj.title === 'string' ? bodyObj.title.trim() : '';
  const messageBody = typeof bodyObj.body === 'string' ? bodyObj.body.trim() : '';

  if (!token || token.length > 500) {
    res.status(400).json({ success: false, error: 'Valid device FCM token is required' });
    return;
  }

  if (!title || title.length > 120 || !messageBody || messageBody.length > 500) {
    res.status(400).json({ success: false, error: 'Valid title and message body are required' });
    return;
  }

  // 4. Send push notification via Firebase Cloud Messaging HTTP v1 API
  try {
    const messageId = await getMessaging(adminApp).send({
      token,
      notification: {
        title,
        body: messageBody,
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'default',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    });

    res.status(200).json({ success: true, messageId });
  } catch (err: any) {
    const code = String(err?.code || '');
    if (
      code === 'messaging/registration-token-not-registered' ||
      code === 'messaging/invalid-registration-token'
    ) {
      res.status(200).json({
        success: false,
        errorCode: 'UNREGISTERED',
        error: 'Device token is no longer registered',
      });
      return;
    }

    res.status(502).json({
      success: false,
      errorCode: code || 'FCM_SEND_FAILED',
      error: 'Failed to deliver FCM push notification',
    });
  }
}
