import apiClient from '@/services/apiClient';

type ApiResponse<T> = { success: boolean; data: T };

interface PushSubscribeRequest {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}

export const pushService = {
  getVapidPublicKey: () =>
    apiClient.get<ApiResponse<{ key: string }>>('/push/vapid-public-key').then((r) => r.data.data.key),

  subscribe: (req: PushSubscribeRequest) =>
    apiClient.post('/push/subscribe', req),

  unsubscribe: (endpoint: string) =>
    apiClient.delete('/push/subscribe', { data: { endpoint } }),
};
