import { useEffect, useRef, useCallback } from 'react';
import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const getWsUrl = (): string => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  if (window.location.port === '5173') return 'http://localhost:8080/ws';
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
  const connectedRef = useRef(false);
  const token = localStorage.getItem('accessToken');

  // Source of truth: all handlers that should be subscribed at any given time
  const handlersRef = useRef<Map<string, MessageHandler<unknown>>>(new Map());
  // Active STOMP subscriptions (cleared on disconnect, rebuilt on reconnect)
  const subscriptionRefs = useRef<Map<string, StompSubscription>>(new Map());

  useEffect(() => {
    const subscribeAll = (client: Client) => {
      handlersRef.current.forEach((handler, destination) => {
        if (!subscriptionRefs.current.has(destination)) {
          const sub = client.subscribe(destination, (msg) => {
            try { handler(JSON.parse(msg.body)); } catch { /* ignore */ }
          });
          subscriptionRefs.current.set(destination, sub);
        }
      });
    };

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 3000,
      onConnect: () => {
        connectedRef.current = true;
        subscribeAll(client);
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
    handlersRef.current.set(destination, handler as MessageHandler<unknown>);

    const client = clientRef.current;
    if (client?.connected && !subscriptionRefs.current.has(destination)) {
      const sub = client.subscribe(destination, (msg) => {
        try { (handlersRef.current.get(destination) as MessageHandler<T> | undefined)?.(JSON.parse(msg.body)); } catch { /* ignore */ }
      });
      subscriptionRefs.current.set(destination, sub);
    }

    return () => {
      handlersRef.current.delete(destination);
      subscriptionRefs.current.get(destination)?.unsubscribe();
      subscriptionRefs.current.delete(destination);
    };
  }, []);

  const send = useCallback((destination: string, body: unknown) => {
    clientRef.current?.publish({ destination, body: JSON.stringify(body) });
  }, []);

  return { subscribe, send, connected: connectedRef.current };
}
