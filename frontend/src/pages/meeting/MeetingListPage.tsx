import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'motion/react';
import { meetingService } from '@/services/meetingService';
import type { MeetingRoomSummary, MeetingStatus } from '@/types/meeting';

type Filter = 'ALL' | MeetingStatus;

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
  }).replace(/\. /g, '.').replace(/\.$/, '');
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'ACTIVE', label: '진행중' },
  { key: 'WAITING', label: '예정' },
  { key: 'ENDED', label: '종료' },
];

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
    <Page>
      <BgCircles />

      <Content>
        <TopSection>
          <div>
            <PageTitle>회의방</PageTitle>
            <PageSub>온라인 회의 공간입니다</PageSub>
          </div>
        </TopSection>

        <ToolRow>
          <FilterRow>
            {FILTERS.map(({ key, label }) => (
              <FilterBtn key={key} $active={filter === key} onClick={() => setFilter(key)}>
                {label}
              </FilterBtn>
            ))}
          </FilterRow>
          <CreateBtn onClick={() => navigate('/meeting/new')}>회의방 만들기 +</CreateBtn>
        </ToolRow>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        {loading ? (
          <EmptyBox><EmptyText>불러오는 중...</EmptyText></EmptyBox>
        ) : filtered.length === 0 ? (
          <EmptyBox>
            <EmptyIcon>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <rect x="8" y="16" width="48" height="36" rx="4" stroke="#4B5563" strokeWidth="2"/>
                <circle cx="22" cy="38" r="5" stroke="#4B5563" strokeWidth="2"/>
                <circle cx="32" cy="38" r="5" stroke="#4B5563" strokeWidth="2"/>
                <circle cx="42" cy="38" r="5" stroke="#4B5563" strokeWidth="2"/>
                <path d="M20 28h24" stroke="#4B5563" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </EmptyIcon>
            <EmptyTitle>아직 개설된 회의방이 없습니다</EmptyTitle>
            <EmptyDesc>새 회의방을 만들어 팀원들과 온라인으로 소통하세요</EmptyDesc>
            <EmptyDesc style={{ marginTop: 4 }}>회의방을 만들면 팀원들에게 자동으로 알림이 발송됩니다</EmptyDesc>
          </EmptyBox>
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <Tr $header>
                  <Th style={{ width: '34%' }}>회의방 이름</Th>
                  <Th style={{ width: '14%' }}>주최자</Th>
                  <Th style={{ width: '12%', textAlign: 'center' }}>참여 현황</Th>
                  <Th style={{ width: '10%', textAlign: 'center' }}>상태</Th>
                  <Th style={{ width: '18%' }}>시작 시간</Th>
                  <Th style={{ width: '12%' }} />
                </Tr>
              </thead>
              <tbody>
                {filtered.map((room, i) => (
                  <motion.tr
                    key={room.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => navigate(`/meeting/${room.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Td $muted={room.status === 'ENDED'}>
                      <RoomName $ended={room.status === 'ENDED'}>{room.title}</RoomName>
                    </Td>
                    <Td $muted={room.status === 'ENDED'}>{room.hostName}</Td>
                    <Td $muted={room.status === 'ENDED'} style={{ textAlign: 'center' }}>—</Td>
                    <Td style={{ textAlign: 'center' }}>
                      <Badge $status={room.status}>{STATUS_LABEL[room.status]}</Badge>
                    </Td>
                    <Td $muted={room.status === 'ENDED'}>{formatDate(room.createdAt)}</Td>
                    <Td>
                      {room.status !== 'ENDED' && (
                        <JoinBtn
                          onClick={(e) => { e.stopPropagation(); navigate(`/meeting/${room.id}`); }}
                        >
                          참여
                        </JoinBtn>
                      )}
                    </Td>
                  </motion.tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
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

const BgCircles = styled.div`
  position: absolute;
  right: -80px;
  top: 50px;
  width: 900px;
  height: 900px;
  pointer-events: none;
  z-index: 0;
  &::before, &::after, & > span {
    content: '';
    position: absolute;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.06);
  }
  &::before {
    inset: 100px;
  }
  &::after {
    inset: 0;
  }
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1440px;
  margin: 0 auto;
  padding: 120px 160px 80px;
`;

const TopSection = styled.div`
  margin-bottom: 28px;
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize.semiTitle};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 6px;
`;

const PageSub = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ToolRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const FilterRow = styled.div`
  display: flex;
  gap: 8px;
`;

const FilterBtn = styled.button<{ $active: boolean }>`
  padding: 6px 18px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ $active, theme }) =>
    $active ? theme.colors.neonGreen : theme.colors.border};
  background: transparent;
  color: ${({ $active, theme }) =>
    $active ? theme.colors.neonGreen : theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-weight: ${({ $active, theme }) =>
    $active ? theme.typography.fontWeight.bold : theme.typography.fontWeight.medium};
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: ${({ theme }) => theme.colors.neonGreen}; }
`;

const CreateBtn = styled.button`
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

const TableWrap = styled.div`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Tr = styled.tr<{ $header?: boolean }>`
  background: ${({ $header }) => $header ? 'rgba(255,255,255,0.03)' : 'transparent'};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  &:last-child { border-bottom: none; }
  &:not(:first-child):hover { background: rgba(255,255,255,0.02); }
`;

const Th = styled.th`
  padding: 14px 20px;
  text-align: left;
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.neonGreen};
`;

const Td = styled.td<{ $muted?: boolean }>`
  padding: 16px 20px;
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  color: ${({ $muted, theme }) => $muted ? theme.colors.text.secondary : theme.colors.text.primary};
  vertical-align: middle;
`;

const RoomName = styled.span<{ $ended: boolean }>`
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ $ended, theme }) => $ended ? theme.colors.text.secondary : theme.colors.text.primary};
`;

const Badge = styled.span<{ $status: MeetingStatus }>`
  display: inline-block;
  padding: 3px 10px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMin};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  background: ${({ $status }) => STATUS_COLOR[$status].bg};
  color: ${({ $status }) => STATUS_COLOR[$status].text};
`;

const JoinBtn = styled.button`
  padding: 6px 18px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
  &:hover {
    border-color: ${({ theme }) => theme.colors.neonGreen};
    color: ${({ theme }) => theme.colors.neonGreen};
  }
`;

const EmptyBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
  gap: 12px;
`;

const EmptyIcon = styled.div`margin-bottom: 8px;`;

const EmptyTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMax};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const EmptyDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ErrorMsg = styled.p`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  margin-bottom: 16px;
`;
