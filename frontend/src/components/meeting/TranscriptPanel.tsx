import styled from 'styled-components';

interface Props {
  roomId?: number;
  stomp?: unknown;
  isCapturing?: boolean;
}

export function TranscriptPanel(_props: Props) {
  return (
    <Panel>
      <Header>실시간 자막</Header>
      <Body>
        <Icon>🚧</Icon>
        <Message>추후 업데이트 예정</Message>
      </Body>
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

const Body = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

const Icon = styled.div`
  font-size: 32px;
`;

const Message = styled.p`
  font-size: 14px;
  color: #555;
`;
