import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { postService, type PostSummary, type BoardType } from '../services/postService';
import { announcementService, type AnnouncementSummary } from '../services/announcementService';
import { useAuthStore } from '../store/authStore';
import HomeCalendar from '../components/HomeCalendar';
import LogoutConfirmModal from '../components/modals/LogoutConfirmModal';

const Wrapper = styled.div`
  color: white;
`;

const NoticeBar = styled.div`
  display: flex;
  width: 100%;
  padding: 12px 70px;
  align-items: center;
  gap: 70px;
  background: rgba(249, 249, 249, 0.08);
  backdrop-filter: blur(5px);

  @media (max-width: 999px) {
    padding: 12px 30px;
    gap: 30px;
  }
  @media (max-width: 639px) {
    padding: 10px 16px;
    gap: 12px;
  }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const NoticeLabel = styled.span`
  color: #FFF;
  text-align: center;
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.56px;
  white-space: nowrap;
  flex-shrink: 0;
`;

const NoticeDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #5FFB7A;
  flex-shrink: 0;
  animation: pulse 2s ease-in-out infinite;
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }
`;

const NoticeTextWrap = styled.div`
  flex: 1;
  overflow: hidden;
  min-width: 0;
`;

const NoticeText = styled.span`
  display: block;
  color: #FFF;
  font-family: "Pretendard Variable";
  font-size: 13px;
  font-weight: 400;
  letter-spacing: -0.52px;
  text-decoration-line: underline;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  animation: ${fadeIn} 0.35s ease;

  &:hover { color: #5FFB7A; }

  @media (max-width: 639px) {
    font-size: 12px;
  }
`;

const NoticeEmpty = styled.span`
  color: #555;
  font-family: "Pretendard Variable";
  font-size: 13px;
`;

const NoticePager = styled.span`
  color: #555;
  font-family: "Pretendard Variable";
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
`;

/* ── 전체 레이아웃 ─────────────────────────────
   Desktop (≥1000px): [LeftCol] [CenterRight → row]
   Tablet  (640–999px): [LeftCol] [CenterRight → column]
   Mobile  (<640px): 세로 스택
───────────────────────────────────────────────── */
const MainContent = styled.div`
  display: flex;
  padding: 40px 70px 40px 41px;
  align-items: flex-start;
  gap: 30px;

  @media (max-width: 999px) {
    padding: 28px 30px;
    gap: 20px;
  }
  @media (max-width: 639px) {
    flex-direction: column;
    padding: 20px 16px;
    gap: 16px;
  }
`;

/* 좌측: 프로필 + 도서 버튼 */
const LeftCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;

  @media (max-width: 639px) {
    flex-direction: row;
    flex-wrap: wrap;
    width: 100%;
    align-items: flex-start;
  }
`;

/* 우측: 게시판 + 달력 */
const CenterRight = styled.div`
  display: flex;
  flex-direction: row;
  gap: 30px;
  flex: 1;
  min-width: 0;
  align-items: flex-start;

  @media (max-width: 999px) {
    flex-direction: column;
    gap: 20px;
  }
  @media (max-width: 639px) {
    width: 100%;
    gap: 16px;
  }
`;

const ProfileCard = styled.div`
  display: inline-flex;
  padding: 20px;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  border-radius: 14px;
  border: 1px solid #40423F;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(7px);

  @media (max-width: 639px) {
    flex: 1;
    min-width: 180px;
  }
`;

const ProfileImage = styled.div`
  width: 82px;
  height: 82px;
  border-radius: 20px;
  background: #D9D9D9;
`;

const Name = styled.p`
  color: #FFF;
  text-align: center;
  font-family: "Pretendard Variable";
  font-size: 28px;
  font-weight: 700;
  line-height: normal;
  letter-spacing: 2.24px;
  margin: 0;

  @media (max-width: 639px) {
    font-size: 22px;
  }
`;

const InfoRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #C0C2C0;
  text-align: center;
  font-family: "Pretendard Variable";
  font-size: 12px;
  font-weight: 500;
  line-height: normal;
`;

const Email = styled.span`
  color: #C0C2C0;
  font-size: 13px;
  margin-top: -16px;
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const ButtonRow = styled.div`
  display: flex;
  width: 190px;
  align-items: flex-start;
  gap: 10px;
`;

const Button = styled.button`
  display: flex;
  padding: 8px 20px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  flex: 1 0 0;
  color: #C0C2C0;
  text-align: center;
  font-family: "Pretendard Variable";
  font-size: 12px;
  font-weight: 500;
  line-height: normal;
  justify-content: center;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.14);
  }
`;

const Bookitem = styled.div`
  display: flex;
  width: 230px;
  height: 38px;
  padding: 0 20px;
  justify-content: space-between;
  align-items: center;
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: background 0.2s ease;
  cursor: pointer;

  &:hover {
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(255, 255, 255, 0.10);
  }

  @media (max-width: 639px) {
    width: 100%;
  }
`;

/* 게시판 영역:
   Desktop: 세로 스택, 카드 326px
   Tablet: 세로 스택, 카드 100%
   Mobile: 세로 스택, 카드 100%
*/
const BoardSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-shrink: 0;
  width: 326px;

  @media (max-width: 999px) {
    width: 100%;
    flex-shrink: 1;
  }
`;

const BoardCard = styled.div`
  display: flex;
  width: 100%;
  padding: 20px;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 10px;
  border-radius: 14px;
  border: 1px solid #40423F;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(7px);
  transition: background 0.2s ease;
  box-sizing: border-box;

  &:hover {
    background: rgba(255, 255, 255, 0.10);
  }
`;

const BoardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-size: 15px;
  font-weight: 700;
  color: #FFF;
  border-bottom: 1px solid #40423F;
  padding-bottom: 10px;
  cursor: pointer;
`;

const BoardTime = styled.span`
  color: #676767;
  font-family: "Pretendard Variable";
  font-size: 12px;
  font-weight: 500;
  line-height: normal;
  transition: color 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
`;

const BoardItem = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 13px;
  color: #C0C2C0;
  transition: color 0.2s ease;
  gap: 8px;
  cursor: pointer;

  &:hover {
    color: #FFF;
    text-decoration-line: underline;
    text-decoration-skip-ink: auto;
  }
  &:hover ${BoardTime} {
    color: #FFF;
  }
`;

const BoardTitle = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SkeletonLine = styled.div`
  height: 13px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
  width: 100%;
`;

const RoleTag = styled.span<{ role: string }>`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 20px;
  background: ${({ role }) =>
    role === 'ADMIN' ? 'rgba(255, 100, 100, 0.15)' :
    role === 'STAFF' ? 'rgba(100, 180, 255, 0.15)' :
    'rgba(255, 255, 255, 0.08)'};
  color: ${({ role }) =>
    role === 'ADMIN' ? '#ff8080' :
    role === 'STAFF' ? '#80c8ff' :
    '#C0C2C0'};
`;

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

const BOARDS: { type: BoardType; label: string; path: string }[] = [
  { type: 'CONTEST', label: '공모전 게시판', path: '/board/contest' },
  { type: 'SUBMISSION', label: '제출 게시판', path: '/board/submission' },
  { type: 'FREE', label: '자유 게시판', path: '/board/free' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [boardPosts, setBoardPosts] = useState<Record<BoardType, PostSummary[]>>({
    CONTEST: [],
    SUBMISSION: [],
    FREE: [],
  });
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [pinnedNotices, setPinnedNotices] = useState<AnnouncementSummary[]>([]);
  const [noticeIdx, setNoticeIdx] = useState(0);

  // 핀된 공지 로드
  useEffect(() => {
    announcementService.getPinned().then((list) => {
      setPinnedNotices(list);
      setNoticeIdx(0);
    });
  }, []);

  // 여러 공지 자동 슬라이드 (4초 간격)
  useEffect(() => {
    if (pinnedNotices.length <= 1) return;
    const timer = setInterval(() => {
      setNoticeIdx((i) => (i + 1) % pinnedNotices.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [pinnedNotices]);

  useEffect(() => {
    Promise.all(
      BOARDS.map(({ type }) =>
        postService.getList({ boardType: type, size: 5 })
          .then((res) => ({ type, posts: res.content ?? [] }))
          .catch(() => ({ type, posts: [] }))
      )
    ).then((results) => {
      const next = { CONTEST: [], SUBMISSION: [], FREE: [] } as Record<BoardType, PostSummary[]>;
      results.forEach(({ type, posts }) => { next[type] = posts; });
      setBoardPosts(next);
    }).finally(() => setLoadingBoards(false));
  }, []);

  return (
    <Wrapper>
      <NoticeBar>
        <NoticeLabel>공지사항</NoticeLabel>
        <NoticeDot />
        <NoticeTextWrap>
          {pinnedNotices.length === 0 ? (
            <NoticeEmpty>등록된 공지사항이 없습니다</NoticeEmpty>
          ) : (
            <NoticeText
              key={noticeIdx}
              onClick={() => navigate(`/board/notice/${pinnedNotices[noticeIdx]?.id}`)}
            >
              📌 {pinnedNotices[noticeIdx]?.title}
            </NoticeText>
          )}
        </NoticeTextWrap>
        {pinnedNotices.length > 1 && (
          <NoticePager>{noticeIdx + 1} / {pinnedNotices.length}</NoticePager>
        )}
      </NoticeBar>

      <MainContent>
        {/* ── 좌측: 프로필 + 도서 버튼 ── */}
        <LeftCol>
          <ProfileCard>
            <ProfileImage />
            <Name>{user?.fullName || user?.username || '-'}</Name>
            <InfoSection>
              <InfoRow>
                {user?.role && (
                  <RoleTag role={user.role.toUpperCase()}>
                    {user.role.toUpperCase()}
                  </RoleTag>
                )}
              </InfoRow>
            </InfoSection>
            <Email>{user?.username ?? '-'}</Email>
            <ButtonRow>
              <Button onClick={() => navigate('/my/profile')}>내 정보</Button>
              <Button onClick={() => setLogoutModalOpen(true)}>로그아웃</Button>
            </ButtonRow>
          </ProfileCard>
          <Bookitem onClick={() => navigate('/books')}>
            📚 도서 대여하러 가기
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="11" viewBox="0 0 13 11" fill="none">
              <path d="M0.699219 5.19922H11.6992M7.29922 9.69922L11.6992 5.19922L7.29922 0.699219" stroke="#C0C2C0" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Bookitem>
        </LeftCol>

        {/* ── 우측: 게시판 + 달력 ── */}
        <CenterRight>
          <BoardSection>
            {BOARDS.map(({ type, label, path }) => (
              <BoardCard key={type}>
                <BoardHeader onClick={() => navigate(path)}>
                  <span>{label}</span>
                  <span>›</span>
                </BoardHeader>
                {loadingBoards ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonLine key={i} />)
                ) : boardPosts[type].length === 0 ? (
                  <BoardItem style={{ cursor: 'default' }}>
                    <BoardTitle style={{ color: '#676767' }}>게시글이 없습니다</BoardTitle>
                  </BoardItem>
                ) : (
                  boardPosts[type].map((post) => (
                    <BoardItem key={post.id} onClick={() => navigate(path)}>
                      <BoardTitle>{post.title}</BoardTitle>
                      <BoardTime>{formatRelativeTime(post.createdAt)}</BoardTime>
                    </BoardItem>
                  ))
                )}
              </BoardCard>
            ))}
          </BoardSection>

          <HomeCalendar />
        </CenterRight>
      </MainContent>
      {logoutModalOpen && (
        <LogoutConfirmModal
          onClose={() => setLogoutModalOpen(false)}
          onConfirm={logout}
        />
      )}
    </Wrapper>
  );
}
