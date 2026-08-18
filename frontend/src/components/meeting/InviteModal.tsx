import { useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { meetingService } from '@/services/meetingService';
import type { InviteResponse } from '@/types/meeting';

const EXPIRE_OPTIONS = [
  { label: '1시간', hours: 1 },
  { label: '24시간', hours: 24 },
  { label: '3일', hours: 72 },
  { label: '7일', hours: 168 },
];

function formatExpiry(isoStr: string) {
  const d = new Date(isoStr);
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

interface Props {
  roomId: number;
  onClose: () => void;
}

export function InviteModal({ roomId, onClose }: Props) {
  const [selectedHours, setSelectedHours] = useState(24);
  const [invite, setInvite] = useState<InviteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await meetingService.createInvite(roomId, selectedHours);
      setInvite(res.data.data);
    } catch {
      setError('초대 링크 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!invite) return;
    navigator.clipboard.writeText(invite.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const modal = (
    <Overlay onClick={onClose}>
      <Card onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>초대 링크 생성</Title>
          <CloseBtn onClick={onClose}>✕</CloseBtn>
        </Header>

        <Label>만료 시간</Label>
        <TabRow>
          {EXPIRE_OPTIONS.map((opt) => (
            <Tab
              key={opt.hours}
              $active={selectedHours === opt.hours}
              onClick={() => { setSelectedHours(opt.hours); setInvite(null); setCopied(false); }}
            >
              {opt.label}
            </Tab>
          ))}
        </TabRow>

        {!invite ? (
          <GenerateBtn onClick={handleGenerate} disabled={loading}>
            {loading ? '생성 중...' : '링크 생성하기'}
          </GenerateBtn>
        ) : (
          <>
            <UrlRow>
              <UrlText title={invite.inviteUrl}>{invite.inviteUrl}</UrlText>
              <CopyBtn onClick={handleCopy}>{copied ? '✓' : '복사'}</CopyBtn>
            </UrlRow>
            <ExpiryNote>
              링크는 {formatExpiry(invite.expiresAt)}에 만료됩니다
            </ExpiryNote>
          </>
        )}

        {error && <ErrorMsg>{error}</ErrorMsg>}

        <InfoBox>
          💡 링크를 받은 구성원은 로그인 후 자동으로 회의방에 입장합니다.
        </InfoBox>

        <Footer>
          <CloseFooterBtn onClick={onClose}>닫기</CloseFooterBtn>
        </Footer>
      </Card>
    </Overlay>
  );

  return createPortal(modal, document.body);
}

/* ── Styled Components ── */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Card = styled.div`
  width: 440px;
  background: #181818;
  border: 1px solid #40423F;
  border-radius: 14px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h2`
  font-family: "Pretendard Variable";
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin: 0;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: #9CA3AF;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  &:hover { color: #fff; }
`;

const Label = styled.p`
  font-family: "Pretendard Variable";
  font-size: 13px;
  color: #9CA3AF;
  margin: 0;
`;

const TabRow = styled.div`
  display: flex;
  gap: 8px;
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 8px 0;
  border-radius: 8px;
  border: 1px solid ${({ $active }) => $active ? 'transparent' : '#40423F'};
  background: ${({ $active }) => $active ? '#2A2A2A' : 'transparent'};
  color: ${({ $active }) => $active ? '#fff' : '#6B7280'};
  font-family: "Pretendard Variable";
  font-size: 13px;
  font-weight: ${({ $active }) => $active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: #6B7280; color: #fff; }
`;

const GenerateBtn = styled.button`
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  background: #5FFB7A;
  color: #000;
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover:not(:disabled) { opacity: 0.85; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const UrlRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255,255,255,0.05);
  border: 1px solid #40423F;
  border-radius: 8px;
  padding: 10px 14px;
`;

const UrlText = styled.span`
  flex: 1;
  font-family: "Pretendard Variable";
  font-size: 12px;
  color: #CCC;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CopyBtn = styled.button`
  flex-shrink: 0;
  padding: 5px 12px;
  border-radius: 6px;
  background: #2A6AEE;
  color: #fff;
  font-family: "Pretendard Variable";
  font-size: 12px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
  min-width: 44px;
  &:hover { opacity: 0.85; }
`;

const ExpiryNote = styled.p`
  font-family: "Pretendard Variable";
  font-size: 12px;
  color: #9CA3AF;
  margin: -4px 0 0;
`;

const ErrorMsg = styled.p`
  font-family: "Pretendard Variable";
  font-size: 13px;
  color: #EF4444;
  margin: 0;
`;

const InfoBox = styled.div`
  background: rgba(42, 106, 238, 0.12);
  border: 1px solid rgba(42, 106, 238, 0.3);
  border-radius: 8px;
  padding: 12px 14px;
  font-family: "Pretendard Variable";
  font-size: 13px;
  color: #93C5FD;
  line-height: 1.5;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const CloseFooterBtn = styled.button`
  padding: 9px 24px;
  border-radius: 8px;
  border: 1px solid #5D625E;
  background: rgba(255,255,255,0.08);
  color: #fff;
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: rgba(255,255,255,0.14); }
`;
