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
const NoticeText = styled.span`
  color: #FFF;
  text-align: center;
  font-family: "Pretendard Variable";
  font-size: 13px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  text-decoration-line: underline;
  text-decoration-style: solid;
  text-decoration-skip-ink: auto;
  text-decoration-thickness: auto;
  text-underline-offset: auto;
  text-underline-position: from-font;
`;

const MainContent = styled.div`
  display: flex;
  padding: 40px 70px;
  align-items: flex-start;
  gap: 30px;
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
  justify-content: center
`;

const MenuItem = styled.div`
  display: flex;
  width: 230px;
  height: 38px;
  padding: 15px 20px;
  align-items: center;
  gap: 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
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
  border-bottom: 1px solid #40423F;
`;

const BoardItem = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 13px;
  color: #C0C2C0;
  padding: 0;
`;

const BoardTime = styled.span`
  color: #676767;
  font-family: "Pretendard Variable";
  font-size: 12px;
  font-weight: 500;
  line-height: normal;
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
          <NoticeText>📢 재학생 프로젝트 2차 과제 마감일 공지</NoticeText>
        </NoticeBar>
        <MainContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <ProfileCard>
              <ProfileImage />
              <Name>지민경</Name>
              <InfoSection>
                <InfoRow>
                  <span>ICT융합학부</span>
                  <span>2023098131</span>
                </InfoRow>
              </InfoSection>
              <Email>rooftop1009@kakao.com</Email>
              <ButtonRow>
                <Button>내 정보</Button>
                <Button>로그아웃</Button>
              </ButtonRow>
            </ProfileCard>
            <MenuItem>✍🏻 내가 쓴 글</MenuItem>
            <MenuItem>📝 내 과제</MenuItem>
            <MenuItem>⭐ 내 스크랩</MenuItem>
            <Bookitem>
              📚 도서 대여하러 가기
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="11" viewBox="0 0 13 11" fill="none">
                <path d="M0.699219 5.19922H11.6992M7.29922 9.69922L11.6992 5.19922L7.29922 0.699219" stroke="#C0C2C0" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg></Bookitem>
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
                        <BoardTime>{times[i]}</BoardTime>
                      </BoardItem>
                  ))}
                </BoardCard>
            ))}
          </BoardSection>
        </MainContent>
      </Wrapper>
  );
}