import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { pushService } from '@/services/pushService';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushNotification() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const setup = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const vapidPublicKey = await pushService.getVapidPublicKey();

        const existing = await registration.pushManager.getSubscription();
        if (existing) return; // 이미 구독 중

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        const sub = subscription.toJSON();
        if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return;

        await pushService.subscribe({
          endpoint: sub.endpoint,
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
          userAgent: navigator.userAgent,
        });
      } catch (e) {
        console.warn('[Push] 설정 실패:', e);
      }
    };

    setup();
  }, [user?.id]);
}
