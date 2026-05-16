import styled from 'styled-components';

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
`;

const MainContent = styled.div`
  display: flex;
  padding: 40px 70px;
  align-items: flex-start;
  gap: 70px;
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
  letter-spacing: 2.24px;
  margin: 0;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #C0C2C0;
  font-size: 13px;
`;

const Email = styled.span`
  color: #C0C2C0;
  font-size: 13px;
`;

const ButtonRow = styled.div`
  display: flex;
  width: 190px;
  gap: 10px;
`;

const Button = styled.button`
  flex: 1;
  padding: 8px 0;
  border-radius: 8px;
  border: 1px solid #40423F;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  cursor: pointer;
`;

const MenuItem = styled.div`
  display: flex;
  align-items: center;
  width: 190px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #40423F;
  background: rgba(255, 255, 255, 0.02);
  gap: 8px;
  cursor: pointer;
`;

const BoardSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
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
`;

const BoardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-size: 16px;
  font-weight: 700;
  color: #FFF;
`;

const BoardItem = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 13px;
  color: #C0C2C0;
  padding: 4px 0;
  border-top: 1px solid #40423F;
`;

export default function HomePage() {
  const boardItems = [
    '어쩌구 저쩌구 대회 소식',
    '어쩌구 저쩌구 대회 소식',
    '어쩌구 저쩌구 대회 소식',
    '어쩌구 저쩌구 대회 소식',
    '어쩌구 저쩌구 대회 소식',
  ];
  const times = ['11분 전', '20분 전', '2시간 전', '3시간 전', '1일 전'];

  return (
      <Wrapper>
        <NoticeBar>
          <span>공지사항</span>
          <span>📢 재학생 프로젝트 2차 과제 마감일 공지</span>
        </NoticeBar>
        <MainContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <ProfileCard>
              <ProfileImage />
              <Name>지민경</Name>
              <InfoRow>
                <span>ICT융합학부</span>
                <span>2023098131</span>
              </InfoRow>
              <Email>rooftop1009@kakao.com</Email>
              <ButtonRow>
                <Button>내 정보</Button>
                <Button>로그아웃</Button>
              </ButtonRow>
            </ProfileCard>
            <MenuItem>🍀 내가 쓴 글</MenuItem>
            <MenuItem>📋 내 과제</MenuItem>
            <MenuItem>⭐ 내 스크랩</MenuItem>
            <MenuItem>📚 도서 대여하러 가기 →</MenuItem>
          </div>
          <BoardSection>
            {['공모전 게시판', '제출 게시판', '자유 게시판'].map((title) => (
                <BoardCard key={title}>
                  <BoardHeader>
                    <span>{title}</span>
                    <span>›</span>
                  </BoardHeader>
                  {boardItems.map((item, i) => (
                      <BoardItem key={i}>
                        <span>{item}</span>
                        <span>{times[i]}</span>
                      </BoardItem>
                  ))}
                </BoardCard>
            ))}
          </BoardSection>
        </MainContent>
      </Wrapper>
  );
}