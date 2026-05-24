import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function usePush() {
  useEffect(() => {
    registrarPush();
  }, []);

  const registrarPush = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const permiso = await Notification.requestPermission();
      if (permiso !== 'granted') return;

      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      await fetch('/api/push', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: user.id,
          subscription: subscription.toJSON(),
        }),
      });
    } catch (err) {
      console.log('Push no disponible:', err);
    }
  };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}