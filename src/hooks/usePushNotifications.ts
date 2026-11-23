import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PushNotificationState {
  isSupported: boolean;
  isRegistered: boolean;
  token: string | null;
  subscriptionId: string | null;
}

const STORAGE_KEY = 'push_subscription_id';
const DEVICE_TOKEN_KEY = 'web_push_token';
const AUTO_PROMPT_KEY = 'push_auto_prompted';

function getOrCreateDeviceToken(): string {
  const existing = localStorage.getItem(DEVICE_TOKEN_KEY);
  if (existing) return existing;
  const uaHash = btoa(navigator.userAgent || 'aboki_client')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 16);
  const rand = Math.random().toString(36).substring(2, 8);
  const token = `web_${uaHash}_${Date.now()}_${rand}`;
  localStorage.setItem(DEVICE_TOKEN_KEY, token);
  return token;
}

export const usePushNotifications = () => {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: true,
    isRegistered: Boolean(localStorage.getItem(STORAGE_KEY)),
    token: localStorage.getItem(DEVICE_TOKEN_KEY),
    subscriptionId: localStorage.getItem(STORAGE_KEY),
  });

  const listenersAttached = useRef(false);

  // Ensure this client device has a valid subscription row in Firestore `push_subscriptions`
  const ensureClientSubscription = useCallback(async (authMode = 'web_push') => {
    try {
      const existingId = localStorage.getItem(STORAGE_KEY);
      const deviceToken = getOrCreateDeviceToken();

      if (existingId) {
        const { data } = await supabase
          .from('push_subscriptions')
          .select('id, endpoint, auth')
          .eq('id', existingId)
          .single();

        if (data) {
          if (authMode === 'web_push' && data.auth !== 'web_push') {
            await supabase
              .from('push_subscriptions')
              .update({ auth: 'web_push', p256dh: 'web_push' })
              .eq('id', existingId);
          }
          setState(prev => ({
            ...prev,
            isSupported: true,
            isRegistered: true,
            token: data.endpoint || deviceToken,
            subscriptionId: existingId,
          }));
          return existingId;
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      // Check if device token already exists
      const { data: existingByToken } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('endpoint', deviceToken)
        .single();

      if (existingByToken) {
        localStorage.setItem(STORAGE_KEY, existingByToken.id);
        setState(prev => ({
          ...prev,
          isSupported: true,
          isRegistered: true,
          token: deviceToken,
          subscriptionId: existingByToken.id,
        }));
        return existingByToken.id;
      }

      // Create new subscription record in Firestore
      const { data, error } = await supabase
        .from('push_subscriptions')
        .insert({
          endpoint: deviceToken,
          p256dh: authMode,
          auth: authMode,
        })
        .select()
        .single();

      if (error || !data) throw error;

      localStorage.setItem(STORAGE_KEY, data.id);
      setState(prev => ({
        ...prev,
        isSupported: true,
        isRegistered: true,
        token: deviceToken,
        subscriptionId: data.id,
      }));
      return data.id;
    } catch (error) {
      console.warn('Could not register push subscription:', error);
      return null;
    }
  }, []);

  // Web Push registration with browser permission prompt
  const registerWebPush = useCallback(async (promptBrowser = true) => {
    let browserGranted = false;

    if (promptBrowser && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') {
          browserGranted = true;
        } else if (Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission();
          browserGranted = permission === 'granted';
        }
      } catch (e) {
        console.warn('Browser notification permission prompt skipped:', e);
      }
    }

    const subId = await ensureClientSubscription(browserGranted ? 'web_push' : 'app_subscriber');
    return Boolean(subId);
  }, [ensureClientSubscription]);

  // Native Push registration (Capacitor)
  const registerNativePush = useCallback(async () => {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');

      let permResult;
      try {
        permResult = await PushNotifications.requestPermissions();
      } catch (permError) {
        console.warn('Push permission request failed, falling back to web/in-app:', permError);
        return await registerWebPush(false);
      }

      if (permResult.receive !== 'granted') {
        return await registerWebPush(false);
      }

      try {
        await LocalNotifications.requestPermissions();
      } catch (e) {
        console.warn('Local notification permission request failed:', e);
      }

      if (Capacitor.getPlatform() === 'android') {
        try {
          await LocalNotifications.createChannel({
            id: 'default',
            name: 'Default',
            description: 'General notifications',
            importance: 5,
            sound: 'default',
          });
        } catch (e) {
          console.warn('Failed to create notification channel:', e);
        }
      }

      if (!listenersAttached.current) {
        listenersAttached.current = true;

        PushNotifications.addListener('registration', async (token) => {
          await saveNativeSubscription(token.value);
        });

        PushNotifications.addListener('pushNotificationReceived', async (notification) => {
          try {
            await LocalNotifications.schedule({
              notifications: [
                {
                  id: Date.now(),
                  title: notification.title || 'Aboki BDC Alert',
                  body: notification.body || '',
                  schedule: { at: new Date(Date.now() + 100) },
                  sound: 'default',
                  channelId: 'default',
                },
              ],
            });
          } catch (e) {
            console.warn('Failed to schedule foreground local notification:', e);
          }

          toast({
            title: notification.title || 'Aboki BDC Alert',
            description: notification.body || '',
            duration: 8000,
          });
        });
      }

      try {
        await PushNotifications.register();
      } catch {
        return await registerWebPush(false);
      }

      return true;
    } catch {
      return await registerWebPush(false);
    }
  }, [registerWebPush]);

  const saveNativeSubscription = async (token: string) => {
    try {
      const existingId = localStorage.getItem(STORAGE_KEY);

      if (existingId) {
        const { data: updated, error: updateError } = await supabase
          .from('push_subscriptions')
          .update({
            endpoint: token,
            p256dh: 'capacitor',
            auth: 'capacitor',
          })
          .eq('id', existingId)
          .select('id')
          .single();

        if (!updateError && updated) {
          setState(prev => ({
            ...prev,
            isRegistered: true,
            token,
            subscriptionId: updated.id,
          }));
          return updated.id;
        }
        localStorage.removeItem(STORAGE_KEY);
      }

      const { data, error } = await supabase
        .from('push_subscriptions')
        .insert({
          endpoint: token,
          p256dh: 'capacitor',
          auth: 'capacitor',
        })
        .select()
        .single();

      if (error || !data) throw error;

      setState(prev => ({
        ...prev,
        isRegistered: true,
        token,
        subscriptionId: data.id,
      }));
      localStorage.setItem(STORAGE_KEY, data.id);

      return data.id;
    } catch (error) {
      console.error('Error saving native subscription:', error);
      return null;
    }
  };

  // Auto-register client subscription on mount so every visitor is subscribed to live push broadcasts
  useEffect(() => {
    const autoRegister = async () => {
      const isNative = Capacitor.isNativePlatform();
      if (isNative) {
        await registerNativePush();
        return;
      }

      // Immediately ensure device is registered in push_subscriptions for live broadcast delivery
      const hasGrantedBrowser =
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted';

      await ensureClientSubscription(hasGrantedBrowser ? 'web_push' : 'app_subscriber');

      // Prompt browser notification permission once after a short delay
      const alreadyPrompted = localStorage.getItem(AUTO_PROMPT_KEY);
      if (!alreadyPrompted && typeof window !== 'undefined' && 'Notification' in window) {
        setTimeout(async () => {
          localStorage.setItem(AUTO_PROMPT_KEY, 'true');
          if (Notification.permission === 'default') {
            try {
              const perm = await Notification.requestPermission();
              if (perm === 'granted') {
                await ensureClientSubscription('web_push');
              }
            } catch {
              // Ignore if blocked by iframe/browser policy
            }
          }
        }, 2500);
      }
    };

    autoRegister();
  }, [ensureClientSubscription, registerNativePush]);

  const requestPermission = useCallback(async () => {
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      return await registerNativePush();
    } else {
      const registered = await registerWebPush(true);
      if (registered) {
        toast({
          title: '🔔 Notifications Enabled',
          description: 'You will receive live rate updates and Aboki BDC broadcasts.',
          duration: 5000,
        });

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('Aboki Bureau De Change', {
              body: 'Push notifications are now active on your device!',
              icon: '/favicon.png',
            });
          } catch {
            // Ignore in restricted contexts
          }
        }
      }
      return registered;
    }
  }, [registerNativePush, registerWebPush]);

  return {
    ...state,
    requestPermission,
  };
};
