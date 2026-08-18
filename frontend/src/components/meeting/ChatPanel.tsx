import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import styled from 'styled-components';
import { ChatMessage } from '@/types/meeting';
import { UseStompWSReturn } from '@/hooks/useStompWS';
import { meetingService } from '@/services/meetingService';
import { useAuthStore } from '@/store/authStore';

interface Props {
  roomId: number;
  stomp: UseStompWSReturn;
}

export function ChatPanel({ roomId, stomp }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    meetingService.getChatHistory(roomId).then((res) => {
      setMessages(res.data.data ?? []);
    });
  }, [roomId]);

  useEffect(() => {
    const unsub = stomp.subscribe<ChatMessage>(
      `/topic/room/${roomId}/chat`,
      (msg) => setMessages((prev) => [...prev, msg])
    );
    return unsub;
  }, [roomId, stomp]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    stomp.send(`/app/chat/${roomId}`, { content: text });
    setInput('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <Panel>
      <Header>채팅</Header>
      <MessageList>
        {messages.map((m) => (
          <MessageRow key={m.id} $mine={m.userId === user?.id}>
            {m.userId !== user?.id && <SenderName>{m.senderName}</SenderName>}
            <Bubble $mine={m.userId === user?.id}>{m.content}</Bubble>
          </MessageRow>
        ))}
        <div ref={bottomRef} />
      </MessageList>
      <InputRow>
        <ChatInput
          placeholder="메시지 입력..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <SendBtn onClick={send} disabled={!input.trim()}>전송</SendBtn>
      </InputRow>
    </Panel>
  );
}

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a2e;
  border-left: 1px solid #2a2a4a;
`;

const Header = styled.div`
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #a0a0c0;
  border-bottom: 1px solid #2a2a4a;
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MessageRow = styled.div<{ $mine: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${({ $mine }) => ($mine ? 'flex-end' : 'flex-start')};
`;

const SenderName = styled.div`
  font-size: 11px;
  color: #7070b0;
  margin-bottom: 2px;
  margin-left: 4px;
`;

const Bubble = styled.div<{ $mine: boolean }>`
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
  background: ${({ $mine }) => ($mine ? '#4361ee' : '#2a2a4a')};
  color: ${({ $mine }) => ($mine ? '#fff' : '#e0e0f0')};
`;

const InputRow = styled.div`
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid #2a2a4a;
`;

const ChatInput = styled.input`
  flex: 1;
  background: #22223a;
  border: 1px solid #3a3a5a;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  color: #e0e0f0;
  outline: none;

  &::placeholder {
    color: #555;
  }

  &:focus {
    border-color: #4361ee;
  }
`;

const SendBtn = styled.button`
  padding: 8px 16px;
  background: #4361ee;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }

  &:hover:not(:disabled) {
    background: #3451de;
  }
`;
