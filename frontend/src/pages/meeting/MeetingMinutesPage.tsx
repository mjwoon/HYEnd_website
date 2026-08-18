import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { meetingService } from '@/services/meetingService';
import type { MeetingRoomDetail } from '@/types/meeting';

/* ── Types ── */
interface ActionItem { assignee: string; task: string; deadline: string; done: boolean; }
interface MinutesData {
  generatedAt: string;
  summary: {
    datetime: string;
    attendees: string;
    agenda: string;
  };
  discussions: string[];
  decisions: string[];
  actionItems: ActionItem[];
}


function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ════════════════════════════════════════
   Page
   ════════════════════════════════════════ */
export default function MeetingMinutesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const roomId = Number(id);

  const [detail, setDetail] = useState<MeetingRoomDetail | null>(null);
  const [minutes, setMinutes] = useState<MinutesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  /* section refs for TOC scroll */
  const refSummary    = useRef<HTMLDivElement>(null);
  const refDiscussion = useRef<HTMLDivElement>(null);
  const refDecision   = useRef<HTMLDivElement>(null);
  const refAction     = useRef<HTMLDivElement>(null);

  const parseMinutes = (content: string, generatedAt: string): MinutesData | null => {
    try {
      const parsed = JSON.parse(content);
      return { ...parsed, generatedAt: parsed.generatedAt ?? generatedAt };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    Promise.all([
      meetingService.getDetail(roomId),
      meetingService.getMinutes(roomId).catch(() => null),
    ])
      .then(([detailRes, minutesRes]) => {
        setDetail(detailRes.data.data);
        if (minutesRes) {
          const m = minutesRes.data.data;
          setMinutes(parseMinutes(m.content, m.generatedAt));
        }
      })
      .catch(() => setError('회의방 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [roomId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await meetingService.generateMinutes(roomId);
      const m = res.data.data;
      setMinutes(parseMinutes(m.content, m.generatedAt));
    } catch {
      setError('회의록 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setGenerating(false);
    }
  };

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) return <Page><LoadMsg>불러오는 중...</LoadMsg></Page>;
  if (error)   return <Page><LoadMsg style={{ color: '#EF4444' }}>{error}</LoadMsg></Page>;
  if (!detail) return null;

  return (
    <Page>
      <BgCircle $size={900} $right={-80} $top={50} />
      <BgCircle $size={694} $right={103} $top={153} />
      <BgCircle $size={503} $right={198} $top={248} />

      <Content>
        {/* Breadcrumb */}
        <Breadcrumb>
          <BcLink onClick={() => navigate('/meeting')}>회의방</BcLink>
          <BcSep>/</BcSep>
          <BcLink onClick={() => navigate(`/meeting/${roomId}`)}>{detail.title}</BcLink>
          <BcSep>/</BcSep>
          <BcCurrent>회의록</BcCurrent>
        </Breadcrumb>

        {/* Header */}
        <HeaderRow>
          <HeaderLeft>
            <PageTitle>회의록</PageTitle>
            {minutes && (
              <Subtitle>AI 생성 · {formatTimestamp(minutes.generatedAt)}</Subtitle>
            )}
          </HeaderLeft>
          <HeaderBtns>
            {minutes && (
              <OutlineBtn onClick={handleGenerate} disabled={generating}>
                {generating ? '생성 중...' : '↺ 재생성'}
              </OutlineBtn>
            )}
            {!minutes && (
              <PrimaryBtn onClick={handleGenerate} disabled={generating}>
                {generating ? '생성 중...' : '✨ AI 회의록 생성'}
              </PrimaryBtn>
            )}
          </HeaderBtns>
        </HeaderRow>

        {!minutes ? (
          /* ── Not yet generated ── */
          <EmptyCard>
            <EmptyIcon>📝</EmptyIcon>
            <EmptyTitle>회의록이 아직 생성되지 않았습니다</EmptyTitle>
            <EmptyDesc>
              AI가 회의 중 발화된 내용을 분석하여 회의록을 자동 생성합니다.
            </EmptyDesc>
            <BackBtn onClick={() => navigate(`/meeting/${roomId}`)}>회의방으로 돌아가기</BackBtn>
          </EmptyCard>
        ) : (
          /* ── Minutes content ── */
          <TwoCol>
            <MainCard>
              {/* 회의 개요 */}
              <Section ref={refSummary}>
                <SectionTitle>회의 개요</SectionTitle>
                <SummaryGrid>
                  <SummaryLabel>일시</SummaryLabel>
                  <SummaryVal>{minutes.summary.datetime}</SummaryVal>
                  <SummaryLabel>참석자</SummaryLabel>
                  <SummaryVal>{minutes.summary.attendees}</SummaryVal>
                  <SummaryLabel>안건</SummaryLabel>
                  <SummaryVal>{minutes.summary.agenda}</SummaryVal>
                </SummaryGrid>
              </Section>

              {/* 주요 논의사항 */}
              <Section ref={refDiscussion}>
                <SectionTitle>주요 논의사항</SectionTitle>
                <BulletList>
                  {minutes.discussions.map((item, i) => (
                    <BulletItem key={i}>{item}</BulletItem>
                  ))}
                </BulletList>
              </Section>

              {/* 결정사항 */}
              <Section ref={refDecision}>
                <SectionTitle>결정사항</SectionTitle>
                <BulletList>
                  {minutes.decisions.map((item, i) => (
                    <BulletItem key={i}>{item}</BulletItem>
                  ))}
                </BulletList>
              </Section>

              {/* 액션 아이템 */}
              <Section ref={refAction} $last>
                <SectionTitle>액션 아이템</SectionTitle>
                <ActionList>
                  {minutes.actionItems.map((item, i) => (
                    <ActionRow key={i}>
                      <Checkbox $done={item.done}>{item.done ? '✓' : ''}</Checkbox>
                      <ActionText>
                        <ActionAssignee>{item.assignee}</ActionAssignee>
                        {' — '}
                        {item.task}
                        {item.deadline && (
                          <ActionDeadline> (기한: {item.deadline})</ActionDeadline>
                        )}
                      </ActionText>
                    </ActionRow>
                  ))}
                </ActionList>
              </Section>
            </MainCard>

            {/* TOC */}
            <Sidebar>
              <TocCard>
                <TocTitle>목차</TocTitle>
                <TocList>
                  <TocItem onClick={() => scrollTo(refSummary)}>회의 개요</TocItem>
                  <TocItem onClick={() => scrollTo(refDiscussion)}>주요 논의사항</TocItem>
                  <TocItem onClick={() => scrollTo(refDecision)}>결정사항</TocItem>
                  <TocItem onClick={() => scrollTo(refAction)}>액션 아이템</TocItem>
                </TocList>
              </TocCard>
            </Sidebar>
          </TwoCol>
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

const Breadcrumb = styled.nav`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMin};
`;

const BcLink = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;
  transition: color 0.2s;
  &:hover { color: ${({ theme }) => theme.colors.neonGreen}; }
`;

const BcSep = styled.span`color: ${({ theme }) => theme.colors.text.secondary};`;

const BcCurrent = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
  gap: 16px;
  flex-wrap: wrap;
`;

const HeaderLeft = styled.div``;

const PageTitle = styled.h1`
  font-size: 2rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 6px;
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMin};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const HeaderBtns = styled.div`display: flex; gap: 10px;`;

const OutlineBtn = styled.button`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 8px 18px;
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.text.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
  }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const PrimaryBtn = styled.button`
  background: #5FFB7A;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: #000;
  padding: 8px 20px;
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.15s;
  &:hover:not(:disabled) { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

/* Empty state */
const EmptyCard = styled.div`
  background: rgba(255,255,255,0.02);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 80px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
`;

const EmptyIcon = styled.div`font-size: 3rem;`;

const EmptyTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMax};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const EmptyDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  max-width: 400px;
  line-height: 1.6;
`;

const BackBtn = styled.button`
  margin-top: 8px;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.neonGreen};
  color: ${({ theme }) => theme.colors.neonGreen};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 10px 24px;
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: rgba(95,251,122,0.08); }
`;

/* Two-column layout */
const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 240px;
  gap: 24px;
  align-items: start;

  @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
  }
`;

/* Main card */
const MainCard = styled.div`
  background: rgba(255,255,255,0.02);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 40px;
`;

const Section = styled.div<{ $last?: boolean }>`
  margin-bottom: ${({ $last }) => $last ? 0 : '40px'};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMax};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  padding-bottom: 8px;
  border-bottom: 2px solid ${({ theme }) => theme.colors.neonGreen};
  margin-bottom: 16px;
  display: inline-block;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: 60px 1fr;
  gap: 10px 16px;
`;

const SummaryLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  padding-top: 2px;
`;

const SummaryVal = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.6;
`;

const BulletList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const BulletItem = styled.li`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.6;
  padding-left: 16px;
  position: relative;
  &::before {
    content: '•';
    position: absolute;
    left: 0;
    color: ${({ theme }) => theme.colors.neonGreen};
  }
`;

const ActionList = styled.div`display: flex; flex-direction: column; gap: 12px;`;

const ActionRow = styled.div`display: flex; align-items: flex-start; gap: 12px;`;

const Checkbox = styled.div<{ $done: boolean }>`
  width: 18px;
  height: 18px;
  border: 1.5px solid ${({ $done }) => $done ? '#5FFB7A' : '#40423F'};
  border-radius: 4px;
  background: ${({ $done }) => $done ? 'rgba(95,251,122,0.15)' : 'transparent'};
  color: #5FFB7A;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
`;

const ActionText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.5;
`;

const ActionAssignee = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.neonGreen};
`;

const ActionDeadline = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
`;

/* Sidebar TOC */
const Sidebar = styled.div`position: sticky; top: 100px;`;

const TocCard = styled.div`
  background: rgba(255,255,255,0.02);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 20px;
`;

const TocTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 16px;
`;

const TocList = styled.div`display: flex; flex-direction: column; gap: 10px;`;

const TocItem = styled.button`
  background: none;
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  transition: color 0.15s;
  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.neonGreen};
    flex-shrink: 0;
  }
  &:hover { color: ${({ theme }) => theme.colors.text.primary}; }
`;

const LoadMsg = styled.p`
  text-align: center;
  margin-top: 200px;
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMax};
  color: ${({ theme }) => theme.colors.text.secondary};
`;
