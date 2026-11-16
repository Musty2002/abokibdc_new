import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  collection,
  query,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { branchesData } from '@/data/branchesData';

// Initialize Firebase SDK
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore as required by Firebase guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Default initial seed data for Aboki BDC
export const INITIAL_CURRENCIES = [
  { id: 'curr-usd', code: 'USD', name: 'US Dollar', flag_url: 'https://flagcdn.com/w40/us.png', is_active: true, sort_order: 1 },
  { id: 'curr-gbp', code: 'GBP', name: 'British Pound', flag_url: 'https://flagcdn.com/w40/gb.png', is_active: true, sort_order: 2 },
  { id: 'curr-eur', code: 'EUR', name: 'Euro', flag_url: 'https://flagcdn.com/w40/eu.png', is_active: true, sort_order: 3 },
  { id: 'curr-cad', code: 'CAD', name: 'Canadian Dollar', flag_url: 'https://flagcdn.com/w40/ca.png', is_active: true, sort_order: 4 },
  { id: 'curr-aed', code: 'AED', name: 'UAE Dirham', flag_url: 'https://flagcdn.com/w40/ae.png', is_active: true, sort_order: 5 },
  { id: 'curr-zar', code: 'ZAR', name: 'South African Rand', flag_url: 'https://flagcdn.com/w40/za.png', is_active: true, sort_order: 6 },
  { id: 'curr-cny', code: 'CNY', name: 'Chinese Yuan', flag_url: 'https://flagcdn.com/w40/cn.png', is_active: true, sort_order: 7 },
  { id: 'curr-chf', code: 'CHF', name: 'Swiss Franc', flag_url: 'https://flagcdn.com/w40/ch.png', is_active: true, sort_order: 8 },
];

export const INITIAL_CITIES = [
  { id: 'city-abuja', name: 'Abuja', is_active: true, sort_order: 1 },
  { id: 'city-lagos', name: 'Lagos', is_active: true, sort_order: 2 },
  { id: 'city-kano', name: 'Kano', is_active: true, sort_order: 3 },
  { id: 'city-portharcourt', name: 'Port Harcourt', is_active: true, sort_order: 4 },
  { id: 'city-kaduna', name: 'Kaduna', is_active: true, sort_order: 5 },
];

export const INITIAL_REVIEWS = [
  {
    id: 'review_r1',
    branch_id: 'abuja-wuse',
    userId: 'u1',
    userName: 'Chisom A.',
    rating: 5,
    comment: 'Excellent rates and very professional staff. Quick service!',
    date: '2025-02-18',
    helpful: 12,
  },
  {
    id: 'review_r2',
    branch_id: 'abuja-wuse',
    userId: 'u2',
    userName: 'Emeka O.',
    rating: 4,
    comment: 'Good rates but sometimes the queue is long during peak hours.',
    date: '2025-02-15',
    helpful: 8,
  },
  {
    id: 'review_r3',
    branch_id: 'lagos-vi',
    userId: 'u3',
    userName: 'Folake B.',
    rating: 5,
    comment: 'Best rates on the island! I always come here for my forex needs.',
    date: '2025-02-20',
    helpful: 15,
  },
  {
    id: 'review_r4',
    branch_id: 'abuja-maitama',
    userId: 'u4',
    userName: 'Ibrahim M.',
    rating: 5,
    comment: 'Premium service, competitive rates. Highly recommended!',
    date: '2025-02-22',
    helpful: 6,
  },
];

let seedingPromise: Promise<{ branchesCreated: number; ratesCreated: number }> | null = null;

export async function seedFirestoreIfEmpty(force = false): Promise<{ branchesCreated: number; ratesCreated: number }> {
  if (seedingPromise && !force) {
    return seedingPromise;
  }

  seedingPromise = (async () => {
    try {
      const existingBranchesSnap = await getDocs(query(collection(db, 'branches'), limit(5)));
      if (!existingBranchesSnap.empty && !force) {
        return { branchesCreated: 0, ratesCreated: 0 };
      }

      const now = new Date().toISOString();

      // 1. Seed Cities
      const cityIdByName: Record<string, string> = {};
      for (const city of INITIAL_CITIES) {
        cityIdByName[city.name.toLowerCase()] = city.id;
        const cityRef = doc(db, 'cities', city.id);
        const snap = await getDoc(cityRef);
        if (!snap.exists()) {
          await setDoc(cityRef, {
            id: city.id,
            name: city.name,
            is_active: city.is_active,
            sort_order: city.sort_order,
            created_at: now,
            updated_at: now,
          });
        }
      }

      // 2. Seed Currencies
      const currencyIdByCode: Record<string, string> = {};
      for (const curr of INITIAL_CURRENCIES) {
        currencyIdByCode[curr.code.toUpperCase()] = curr.id;
        const currRef = doc(db, 'currencies', curr.id);
        const snap = await getDoc(currRef);
        if (!snap.exists()) {
          await setDoc(currRef, {
            id: curr.id,
            code: curr.code,
            name: curr.name,
            flag_url: curr.flag_url,
            is_active: curr.is_active,
            sort_order: curr.sort_order,
            created_at: now,
            updated_at: now,
          });
        }
      }

      // 3. Seed Branches & Branch Rates
      let branchesCreated = 0;
      let ratesCreated = 0;

      for (const cityGroup of branchesData) {
        const cityId = cityIdByName[cityGroup.city.toLowerCase()] || 'city-abuja';
        for (const b of cityGroup.branches) {
          const branchRef = doc(db, 'branches', b.id);
          const branchSnap = await getDoc(branchRef);
          if (!branchSnap.exists()) {
            await setDoc(branchRef, {
              id: b.id,
              name: b.name,
              address: b.address,
              city_id: cityId,
              operating_hours: b.operatingHours,
              whatsapp_number: b.whatsappNumber || null,
              rating: b.rating,
              review_count: b.reviewCount,
              latitude: typeof b.latitude === 'number' ? b.latitude : null,
              longitude: typeof b.longitude === 'number' ? b.longitude : null,
              is_active: true,
              created_at: now,
              updated_at: now,
            });
            branchesCreated++;
          }

          for (let idx = 0; idx < b.currencies.length; idx++) {
            const r = b.currencies[idx];
            const currencyId = currencyIdByCode[r.code.toUpperCase()] || 'curr-usd';
            const rateId = `rate-${b.id}-${r.code.toLowerCase()}-${idx}`;
            const rateRef = doc(db, 'branch_rates', rateId);
            const rateSnap = await getDoc(rateRef);
            if (!rateSnap.exists()) {
              await setDoc(rateRef, {
                id: rateId,
                branch_id: b.id,
                currency_id: currencyId,
                denomination: r.denomination || null,
                buy_rate: r.buyRate,
                sell_rate: r.sellRate,
                updated_by: auth.currentUser?.uid || null,
                created_at: now,
                updated_at: now,
              });
              ratesCreated++;
            }
          }
        }
      }

      // 4. Seed initial Reviews
      for (const rev of INITIAL_REVIEWS) {
        const revRef = doc(db, 'reviews', rev.id);
        const revSnap = await getDoc(revRef);
        if (!revSnap.exists()) {
          await setDoc(revRef, {
            ...rev,
            created_at: now,
            updated_at: now,
          });
        }
      }

      return { branchesCreated, ratesCreated };
    } catch (error) {
      console.warn('Initial Firestore seed warning:', error);
      return { branchesCreated: 0, ratesCreated: 0 };
    }
  })();

  return seedingPromise;
}

export async function ensureSuperAdminRole(user: FirebaseUser): Promise<boolean> {
  if (!user) return false;
  const now = new Date().toISOString();

  try {
    // Ensure user profile exists in Firestore
    const profileRef = doc(db, 'profiles', user.uid);
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists() && user.email) {
      await setDoc(profileRef, {
        id: user.uid,
        email: user.email,
        full_name: user.displayName || 'Administrator',
        created_at: now,
        updated_at: now,
      });
    }

    // Check if user already has a role document
    const roleRef = doc(db, 'user_roles', user.uid);
    const roleSnap = await getDoc(roleRef);
    if (roleSnap.exists()) {
      return roleSnap.data()?.role === 'super_admin';
    }

    // Bootstrap super_admin role for the project owner or initial admin
    if (user.email === 'mustaphashehuyana@gmail.com' || !roleSnap.exists()) {
      await setDoc(roleRef, {
        id: user.uid,
        user_id: user.uid,
        role: 'super_admin',
        created_at: now,
        updated_at: now,
      });
      return true;
    }
  } catch (error) {
    console.warn('Could not bootstrap admin role document:', error);
  }

  return user.email === 'mustaphashehuyana@gmail.com';
}

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  onAuthStateChanged,
};
export type { FirebaseUser };
