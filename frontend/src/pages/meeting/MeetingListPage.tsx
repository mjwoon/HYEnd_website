import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'motion/react';
import { meetingService } from '@/services/meetingService';
import type { MeetingRoomSummary, MeetingStatus } from '@/types/meeting';

type Filter = 'ALL' | MeetingStatus;

const STATUS_LABEL: Record<MeetingStatus, string> = {
  WAITING: '대기중',
  ACTIVE: '진행중',
  ENDED: '종료',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function MeetingListPage() {
  const navigate = useNavigate();
  const [list, setList] = useState<MeetingRoomSummary[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    meetingService.getList()
      .then((res) => setList(res.data.data))
      .catch(() => setError('회의방 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL' ? list : list.filter((m) => m.status === filter);

  return (
    <Container>
      <Header>
        <Title>회의방</Title>
        <CreateButton onClick={() => navigate('/meeting/new')}>회의방 만들기 +</CreateButton>
      </Header>

      <FilterRow>
        {(['ALL', 'ACTIVE', 'WAITING', 'ENDED'] as Filter[]).map((f) => (
          <FilterBtn key={f} $active={filter === f} onClick={() => setFilter(f)}>
            {f === 'ALL' ? '전체' : STATUS_LABEL[f as MeetingStatus]}
          </FilterBtn>
        ))}
      </FilterRow>

      {error && <ErrorMsg>{error}</ErrorMsg>}

      {loading ? (
        <EmptyState>불러오는 중...</EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState>
          <EmptyIcon>📋</EmptyIcon>
          <p>회의방이 없습니다.</p>
          <CreateButton onClick={() => navigate('/meeting/new')}>첫 회의방 만들기 →</CreateButton>
        </EmptyState>
      ) : (
        <Grid>
          {filtered.map((room, i) => (
            <Card
              key={room.id}
              onClick={() => navigate(`/meeting/${room.id}`)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
            >
              <CardTop>
                <StatusBadge $status={room.status}>
                  {room.status === 'ACTIVE' && <LiveDot />}
                  {STATUS_LABEL[room.status]}
                </StatusBadge>
              </CardTop>
              <RoomTitle>{room.title}</RoomTitle>
              <Meta>주최자 · {room.hostName}</Meta>
              <Meta>{formatDate(room.createdAt)}</Meta>
              <CardFooter>
                <JoinBtn $status={room.status}>
                  {room.status === 'ACTIVE' ? '참여하기 →'
                    : room.status === 'WAITING' ? '상세 보기 →'
                    : '회의록 보기 →'}
                </JoinBtn>
              </CardFooter>
            </Card>
          ))}
        </Grid>
      )}
    </Container>
  );
}

const Container = styled.div`
  padding: 100px 40px 60px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize.semiTitle};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const CreateButton = styled.button`
  background: ${({ theme }) => theme.colors.neonGreen};
  color: #000;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 10px 20px;
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover { opacity: 0.85; }
`;

const FilterRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
`;

const FilterBtn = styled.button<{ $active: boolean }>`
  padding: 6px 16px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 1px solid ${({ $active, theme }) =>
    $active ? theme.colors.neonGreen : theme.colors.border};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.neonGreen : 'transparent'};
  color: ${({ $active }) => $active ? '#000' : '#9CA3AF'};
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-weight: ${({ $active, theme }) =>
    $active ? theme.typography.fontWeight.bold : theme.typography.fontWeight.medium};
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: ${({ theme }) => theme.colors.neonGreen}; }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled(motion.div)`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 20px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  backdrop-filter: blur(7px);
  &:hover {
    border-color: ${({ theme }) => theme.colors.neonGreen};
    background: rgba(95, 251, 122, 0.03);
  }
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const StatusBadge = styled.span<{ $status: MeetingStatus }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
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

const RoomTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMax};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Meta = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMin};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 4px;
`;

const CardFooter = styled.div`
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
`;

const JoinBtn = styled.span<{ $status: MeetingStatus }>`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ $status }) =>
    $status === 'ACTIVE' ? '#5FFB7A'
    : $status === 'WAITING' ? '#FFAA00'
    : '#9CA3AF'};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMax};
`;

const EmptyIcon = styled.span`font-size: 48px;`;

const ErrorMsg = styled.p`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  margin-bottom: 16px;
`;
