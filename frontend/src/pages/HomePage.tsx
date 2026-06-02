import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { postService, type PostSummary, type BoardType } from '../services/postService';
import { useAuthStore } from '../store/authStore';
import HomeCalendar from '../components/HomeCalendar';

const Wrapper = styled.div`
  color: white;
`;

const NoticeBar = styled.div`
  display:  flex;
  width: 100%;
  padding: 12px 70px;
  align-items: center;
  gap: 70px;
  background: rgba(249, 249, 249, 0.08);
  backdrop-filter: blur(5px);
`;

const NoticeLabel = styled.span`
  color: #FFF;
  text-align: center;
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
  letter-spacing: -0.56px;
`;

const NoticeText = styled.span`
  color: #FFF;
  text-align: center;
  font-family: "Pretendard Variable";
  font-size: 13px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  letter-spacing: -0.52px;
  text-decoration-line: underline;
  text-decoration-style: solid;
  text-decoration-skip-ink: auto;
  text-decoration-thickness: auto;
  text-underline-offset: auto;
  text-underline-position: from-font;
  cursor: pointer;
`;

const MainContent = styled.div`
  display: flex;
  padding: 40px 70px 40px 41px;
  align-items: flex-start;
  gap: 41px;
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
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  justify-content: center;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.14);
  }
`;

// const MenuItem = styled.div`
//   display: flex;
//   width: 230px;
//   height: 38px;
//   padding: 15px 20px;
//   align-items: center;
//   gap: 10px;
//   border-radius: 8px;
//   background: rgba(255, 255, 255, 0.04);
//   transition: background 0.2s ease;
//   cursor: pointer;
//
//   &:hover {
//     background: rgba(255, 255, 255, 0.14);
//   }
// `;

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
    border-radius: 50px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(255, 255, 255, 0.10);
  }
`;

const BoardSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const BoardCard = styled.div`
  display: flex;
  width: 326px;
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
  padding: 0;
  transition: color 0.2s ease;
  gap: 8px;
  cursor: pointer;

  &:hover {
    color: #FFF;
    text-decoration-line: underline;
    text-decoration-style: solid;
    text-decoration-skip-ink: auto;
    text-decoration-thickness: auto;
    text-underline-offset: auto;
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
        <NoticeText>📢 재학생 프로젝트 2차 과제 마감일 공지</NoticeText>
      </NoticeBar>
      <MainContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <ProfileCard>
            <ProfileImage />
            <>
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
            </>
            <ButtonRow>
              <Button onClick={() => navigate('/my/profile')}>내 정보</Button>
              <Button onClick={logout}>로그아웃</Button>
            </ButtonRow>
          </ProfileCard>
          {/*<MenuItem onClick={() => navigate('/my/posts')}>✍🏻 내가 쓴 글</MenuItem>*/}
          {/*<MenuItem onClick={() => navigate('/my/assignments')}>📝 내 과제</MenuItem>*/}
          {/*<MenuItem onClick={() => navigate('/my/scraps')}>⭐ 내 스크랩</MenuItem>*/}
          <Bookitem onClick={() => navigate('/books')}>
            📚 도서 대여하러 가기
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="11" viewBox="0 0 13 11" fill="none">
              <path d="M0.699219 5.19922H11.6992M7.29922 9.69922L11.6992 5.19922L7.29922 0.699219" stroke="#C0C2C0" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Bookitem>
        </div>
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
      </MainContent>
    </Wrapper>
  );
}
