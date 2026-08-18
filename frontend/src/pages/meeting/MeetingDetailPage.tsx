import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { meetingService } from '@/services/meetingService';
import { useAuthStore } from '@/store/authStore';
import type { MeetingRoomDetail, MeetingStatus } from '@/types/meeting';
import { InviteModal } from '@/components/meeting/InviteModal';

const STATUS_LABEL: Record<MeetingStatus, string> = {
  WAITING: '예정',
  ACTIVE: '진행중',
  ENDED: '종료',
};

const STATUS_COLOR: Record<MeetingStatus, { bg: string; text: string }> = {
  ACTIVE:  { bg: '#5FFB7A', text: '#000' },
  WAITING: { bg: '#3B82F6', text: '#fff' },
  ENDED:   { bg: '#374151', text: '#9CA3AF' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function getInitial(name: string) {
  return name.charAt(0);
}

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const [detail, setDetail] = useState<MeetingRoomDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const roomId = Number(id);

  useEffect(() => {
    setLoading(true);
    meetingService.getDetail(roomId)
      .then((res) => setDetail(res.data.data))
      .catch(() => setError('회의방 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [roomId]);

  if (loading) return <Page><LoadMsg>불러오는 중...</LoadMsg></Page>;
  if (error) return <Page><LoadMsg style={{ color: '#EF4444' }}>{error}</LoadMsg></Page>;
  if (!detail) return null;

  const isHost = currentUser?.id === detail.hostId;

  const handleJoin = () => navigate(`/meeting/${roomId}/lobby`);

  const handleEnd = async () => {
    if (!window.confirm('회의를 종료하시겠습니까?')) return;
    setActionLoading(true);
    try {
      await meetingService.end(roomId);
      setDetail((p) => p ? { ...p, status: 'ENDED' } : p);
    } catch { alert('회의 종료에 실패했습니다.'); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('회의방을 삭제하시겠습니까?')) return;
    setActionLoading(true);
    try {
      await meetingService.remove(roomId);
      navigate('/meeting');
    } catch { alert('삭제에 실패했습니다.'); }
    finally { setActionLoading(false); }
  };

  return (
    <Page>
      {showInviteModal && (
        <InviteModal roomId={roomId} onClose={() => setShowInviteModal(false)} />
      )}

      <BgCircle $size={900} $right={-80} $top={50} />
      <BgCircle $size={694} $right={103} $top={153} />
      <BgCircle $size={503} $right={198} $top={248} />

      <Content>
        <BackBtn onClick={() => navigate('/meeting')}>← 회의 목록</BackBtn>

        <Columns>
          {/* ── Left column ── */}
          <Left>
            <StatusBadge $status={detail.status}>{STATUS_LABEL[detail.status]}</StatusBadge>
            <RoomTitle>{detail.title}</RoomTitle>
            <MetaRow>
              <MetaItem>주최자: {detail.hostName}</MetaItem>
              <MetaDot>·</MetaDot>
              <MetaItem>{formatDate(detail.createdAt)} 시작</MetaItem>
            </MetaRow>

            <Section>
              <SectionTitle>회의 정보</SectionTitle>
              {detail.description ? (
                <Description>{detail.description}</Description>
              ) : (
                <Description style={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                  설명이 없습니다.
                </Description>
              )}
            </Section>

            <Section>
              <SectionTitle>참여자</SectionTitle>
              <AvatarGrid>
                <AvatarItem>
                  <Avatar $host>{getInitial(detail.hostName)}</Avatar>
                  <AvatarName>{detail.hostName}</AvatarName>
                  <HostBadge>주최자</HostBadge>
                </AvatarItem>
              </AvatarGrid>
            </Section>
          </Left>

          {/* ── Right column ── */}
          <Right>
            {/* 참여 카드 */}
            <Panel>
              <PanelTitle>회의 참여</PanelTitle>
              <PanelDesc>지금 회의에 참여하려면 아래 버튼을 클릭하세요</PanelDesc>
              {detail.status !== 'ENDED' && (
                <GreenBtn onClick={handleJoin}>
                  {detail.status === 'ACTIVE' ? '회의 참여하기' : '회의 시작하기'}
                </GreenBtn>
              )}
              {isHost && detail.status === 'ACTIVE' && (
                <RedOutlineBtn onClick={handleEnd} disabled={actionLoading}>
                  회의의 종료 (주최자 전용)
                </RedOutlineBtn>
              )}
              {isHost && detail.status === 'ENDED' && (
                <RedOutlineBtn onClick={handleDelete} disabled={actionLoading}>
                  회의방 삭제
                </RedOutlineBtn>
              )}
              {detail.status === 'ENDED' && (
                <GreenBtn onClick={() => navigate(`/meeting/${roomId}/minutes`)}>
                  회의록 보기
                </GreenBtn>
              )}
            </Panel>

            {/* 초대 링크 카드 */}
            <Panel>
              <PanelTitle>초대 링크</PanelTitle>
              <PanelDesc>링크를 공유해 외부 참여자를 초대할 수 있습니다</PanelDesc>
              <GreenOutlineBtn onClick={() => setShowInviteModal(true)}>
                초대 링크 생성
              </GreenOutlineBtn>
            </Panel>

            {/* 회의록 카드 */}
            <Panel>
              <PanelTitle>회의록</PanelTitle>
              {detail.status === 'ENDED' ? (
                <GreenOutlineBtn onClick={() => navigate(`/meeting/${roomId}/minutes`)}>
                  회의록 보기
                </GreenOutlineBtn>
              ) : (
                <PanelEmpty>아직 회의록이 생성되지 않았습니다</PanelEmpty>
              )}
            </Panel>
          </Right>
        </Columns>
      </Content>
    </Page>
  );
}

/* ── Styled Components ── */

const Page = styled.div`
  min-height: 100vh;
  position: relative;
  overflow: hidden;
`;

const BgCircle = styled.div<{ $size: number; $right: number; $top: number }>`
  position: absolute;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  right: ${({ $right }) => $right}px;
  top: ${({ $top }) => $top}px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.06);
  pointer-events: none;
  z-index: 0;
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px 40px 80px;
`;

const BackBtn = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-family: inherit;
  cursor: pointer;
  padding: 0;
  margin-bottom: 24px;
  display: block;
  transition: color 0.2s;
  &:hover { color: ${({ theme }) => theme.colors.neonGreen}; }
`;

const Columns = styled.div`
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 32px;
  align-items: start;

  @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
  }
`;

const Left = styled.div`display: flex; flex-direction: column; gap: 0;`;

const StatusBadge = styled.span<{ $status: MeetingStatus }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMin};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  background: ${({ $status }) => STATUS_COLOR[$status].bg};
  color: ${({ $status }) => STATUS_COLOR[$status].text};
  margin-bottom: 12px;
`;

const RoomTitle = styled.h1`
  font-size: 2rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 12px;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 32px;
`;

const MetaItem = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const MetaDot = styled.span`color: ${({ theme }) => theme.colors.text.secondary};`;

const Section = styled.div`margin-bottom: 28px;`;

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMax};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.neonGreen};
  margin-bottom: 12px;
`;

const Description = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMax};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.7;
  white-space: pre-wrap;
`;

const AvatarGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`;

const AvatarItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  position: relative;
`;

const Avatar = styled.div<{ $host?: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${({ $host }) => $host ? '#5FFB7A' : '#2A2A2A'};
  color: ${({ $host }) => $host ? '#000' : '#fff'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 700;
`;

const AvatarName = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMin};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const HostBadge = styled.span`
  font-size: 10px;
  background: ${({ theme }) => theme.colors.neonGreen};
  color: #000;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 700;
`;

const Right = styled.div`display: flex; flex-direction: column; gap: 16px;`;

const Panel = styled.div`
  background: rgba(255,255,255,0.02);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PanelTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMax};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const PanelDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const PanelEmpty = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  padding: 8px 0;
`;

const GreenBtn = styled.button`
  width: 100%;
  background: ${({ theme }) => theme.colors.neonGreen};
  color: #000;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 13px;
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover { opacity: 0.85; }
`;

const GreenOutlineBtn = styled.button`
  width: 100%;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.neonGreen};
  color: ${({ theme }) => theme.colors.neonGreen};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 13px;
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: rgba(95,251,122,0.08); }
`;

const RedOutlineBtn = styled.button`
  width: 100%;
  background: transparent;
  border: 1px solid #EF4444;
  color: #EF4444;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 13px;
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s;
  &:hover:not(:disabled) { background: rgba(239,68,68,0.1); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const LoadMsg = styled.p`
  text-align: center;
  margin-top: 200px;
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMax};
  color: ${({ theme }) => theme.colors.text.secondary};
`;
