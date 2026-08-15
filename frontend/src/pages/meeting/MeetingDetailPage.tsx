import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'motion/react';
import { meetingService } from '@/services/meetingService';
import { useAuthStore } from '@/store/authStore';
import type { MeetingRoomDetail, MeetingStatus } from '@/types/meeting';

const STATUS_LABEL: Record<MeetingStatus, string> = {
  WAITING: '대기중',
  ACTIVE: '진행중',
  ENDED: '종료',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const [detail, setDetail] = useState<MeetingRoomDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const roomId = Number(id);

  useEffect(() => {
    if (!roomId) return;
    setLoading(true);
    meetingService.getDetail(roomId)
      .then((res) => setDetail(res.data.data))
      .catch(() => setError('회의방 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [roomId]);

  if (loading) return <Container><EmptyMsg>불러오는 중...</EmptyMsg></Container>;
  if (error) return <Container><EmptyMsg style={{ color: '#EF4444' }}>{error}</EmptyMsg></Container>;
  if (!detail) return null;

  const isHost = currentUser?.id === detail.hostId;

  const handleJoin = () => navigate(`/meeting/${roomId}/lobby`);

  const handleEnd = async () => {
    if (!window.confirm('회의를 종료하시겠습니까?')) return;
    setActionLoading(true);
    try {
      await meetingService.end(roomId);
      setDetail((prev) => prev ? { ...prev, status: 'ENDED' } : prev);
    } catch {
      alert('회의 종료에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('회의방을 삭제하시겠습니까?')) return;
    setActionLoading(true);
    try {
      await meetingService.remove(roomId);
      navigate('/meeting');
    } catch {
      alert('회의방 삭제에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Container>
      <BackBtn onClick={() => navigate('/meeting')}>← 목록으로</BackBtn>

      <Card
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <TopRow>
          <StatusBadge $status={detail.status}>
            {detail.status === 'ACTIVE' && <LiveDot />}
            {STATUS_LABEL[detail.status]}
          </StatusBadge>
          {isHost && (
            <HostActions>
              {detail.status === 'ACTIVE' && (
                <DangerBtn onClick={handleEnd} disabled={actionLoading}>
                  회의 종료
                </DangerBtn>
              )}
              {detail.status === 'ENDED' && (
                <DangerBtn onClick={handleDelete} disabled={actionLoading}>
                  삭제
                </DangerBtn>
              )}
            </HostActions>
          )}
        </TopRow>

        <RoomTitle>{detail.title}</RoomTitle>
        {detail.description && <Description>{detail.description}</Description>}

        <Divider />

        <InfoGrid>
          <InfoRow>
            <InfoLabel>주최자</InfoLabel>
            <InfoValue>{detail.hostName}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>생성 시각</InfoLabel>
            <InfoValue>{formatDate(detail.createdAt)}</InfoValue>
          </InfoRow>
          {detail.endedAt && (
            <InfoRow>
              <InfoLabel>종료 시각</InfoLabel>
              <InfoValue>{formatDate(detail.endedAt)}</InfoValue>
            </InfoRow>
          )}
        </InfoGrid>

        <ActionRow>
          {detail.status === 'WAITING' && (
            <PrimaryBtn onClick={handleJoin} disabled={!isHost}>
              {isHost ? '회의 시작하기 →' : '대기 중 (호스트 입장 후 참여 가능)'}
            </PrimaryBtn>
          )}
          {detail.status === 'ACTIVE' && (
            <PrimaryBtn onClick={handleJoin}>참여하기 →</PrimaryBtn>
          )}
          {detail.status === 'ENDED' && (
            <SecondaryBtn onClick={() => navigate(`/meeting/${roomId}/minutes`)}>
              회의록 보기 →
            </SecondaryBtn>
          )}
        </ActionRow>
      </Card>
    </Container>
  );
}

const Container = styled.div`
  padding: 100px 40px 60px;
  max-width: 800px;
  margin: 0 auto;
  min-height: 100vh;
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

const Card = styled(motion.div)`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 32px;
  backdrop-filter: blur(7px);
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const StatusBadge = styled.span<{ $status: MeetingStatus }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMin};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  background: ${({ $status }) =>
    $status === 'ACTIVE' ? 'rgba(95,251,122,0.15)'
    : $status === 'WAITING' ? 'rgba(255,170,0,0.15)'
    : 'rgba(156,163,175,0.15)'};
  color: ${({ $status }) =>
    $status === 'ACTIVE' ? '#5FFB7A'
    : $status === 'WAITING' ? '#FFAA00'
    : '#9CA3AF'};
`;

const LiveDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #5FFB7A;
  animation: pulse 1.5s ease-in-out infinite;
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`;

const HostActions = styled.div`
  display: flex;
  gap: 8px;
`;

const DangerBtn = styled.button`
  background: rgba(239,68,68,0.12);
  border: 1px solid #EF4444;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: #EF4444;
  padding: 6px 14px;
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMin};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s;
  &:hover:not(:disabled) { background: rgba(239,68,68,0.22); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const RoomTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize.semiTitle};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 12px;
`;

const Description = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMax};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
  margin-bottom: 4px;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  margin: 24px 0;
`;

const InfoGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
`;

const InfoRow = styled.div`
  display: flex;
  gap: 16px;
`;

const InfoLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  min-width: 80px;
`;

const InfoValue = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const PrimaryBtn = styled.button`
  background: ${({ theme }) => theme.colors.neonGreen};
  color: #000;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 12px 28px;
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMax};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover:not(:disabled) { opacity: 0.85; }
  &:disabled {
    background: #2A2A2A;
    color: #9CA3AF;
    cursor: not-allowed;
  }
`;

const SecondaryBtn = styled.button`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.text.primary};
  padding: 12px 28px;
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMax};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.2s;
  &:hover { border-color: ${({ theme }) => theme.colors.neonGreen}; }
`;

const EmptyMsg = styled.p`
  text-align: center;
  margin-top: 120px;
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMax};
  color: ${({ theme }) => theme.colors.text.secondary};
`;
