import { useEffect, useRef, useCallback } from 'react';
import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const getWsUrl = (): string => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  // Vite dev server (port 5173) — WS는 백엔드 직접 연결
  if (window.location.port === '5173') return 'http://localhost:8080/ws';
  // 운영(nginx port 80) — nginx가 /ws/를 백엔드로 프록시
  return window.location.origin + '/ws';
};
const WS_URL = getWsUrl();

type MessageHandler<T> = (data: T) => void;

export interface UseStompWSReturn {
  subscribe: <T>(destination: string, handler: MessageHandler<T>) => () => void;
  send: (destination: string, body: unknown) => void;
  connected: boolean;
}

export function useStompWS(): UseStompWSReturn {
  const clientRef = useRef<Client | null>(null);
  const pendingSubscriptions = useRef<Array<{ destination: string; handler: MessageHandler<unknown> }>>([]);
  const subscriptionRefs = useRef<Map<string, StompSubscription>>(new Map());
  const connectedRef = useRef(false);
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 3000,
      onConnect: () => {
        connectedRef.current = true;
        pendingSubscriptions.current.forEach(({ destination, handler }) => {
          const sub = client.subscribe(destination, (msg) => {
            try {
              handler(JSON.parse(msg.body));
            } catch {
              /* ignore */
            }
          });
          subscriptionRefs.current.set(destination, sub);
        });
        pendingSubscriptions.current = [];
      },
      onDisconnect: () => {
        connectedRef.current = false;
        subscriptionRefs.current.clear();
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      connectedRef.current = false;
      subscriptionRefs.current.clear();
    };
  }, [token]);

  const subscribe = useCallback(<T>(destination: string, handler: MessageHandler<T>) => {
    const client = clientRef.current;
    if (client?.connected) {
      const sub = client.subscribe(destination, (msg) => {
        try {
          handler(JSON.parse(msg.body) as T);
        } catch {
          /* ignore */
        }
      });
      subscriptionRefs.current.set(destination, sub);
      return () => {
        sub.unsubscribe();
        subscriptionRefs.current.delete(destination);
      };
    }
    // Queue until connected
    const entry = { destination, handler: handler as MessageHandler<unknown> };
    pendingSubscriptions.current.push(entry);
    return () => {
      pendingSubscriptions.current = pendingSubscriptions.current.filter((e) => e !== entry);
      subscriptionRefs.current.get(destination)?.unsubscribe();
      subscriptionRefs.current.delete(destination);
    };
  }, []);

  const send = useCallback((destination: string, body: unknown) => {
    clientRef.current?.publish({
      destination,
      body: JSON.stringify(body),
    });
  }, []);

  return { subscribe, send, connected: connectedRef.current };
}
