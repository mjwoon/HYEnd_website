import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { TranscriptMessage } from '@/types/meeting';
import { UseStompWSReturn } from '@/hooks/useStompWS';

interface Props {
  roomId: number;
  stomp: UseStompWSReturn;
}

export function TranscriptPanel({ roomId, stomp }: Props) {
  const [entries, setEntries] = useState<TranscriptMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = stomp.subscribe<TranscriptMessage>(
      `/topic/room/${roomId}/transcript`,
      (msg) => setEntries((prev) => [...prev, msg])
    );
    return unsub;
  }, [roomId, stomp]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  return (
    <Panel>
      <Header>실시간 자막</Header>
      <List>
        {entries.length === 0 && <Empty>음성 감지 시 자막이 표시됩니다.</Empty>}
        {entries.map((e) => (
          <Entry key={e.transcriptId}>
            <Speaker>{e.speakerName}</Speaker>
            <Text>{e.text}</Text>
          </Entry>
        ))}
        <div ref={bottomRef} />
      </List>
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

const List = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Empty = styled.p`
  font-size: 13px;
  color: #555;
  text-align: center;
  margin-top: 24px;
`;

const Entry = styled.div`
  background: #22223a;
  border-radius: 8px;
  padding: 8px 12px;
`;

const Speaker = styled.div`
  font-size: 11px;
  color: #7070b0;
  margin-bottom: 4px;
`;

const Text = styled.div`
  font-size: 14px;
  color: #e0e0f0;
  line-height: 1.5;
`;
