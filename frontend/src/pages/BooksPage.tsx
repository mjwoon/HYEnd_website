import styled from 'styled-components';

const Wrapper = styled.div`
  color: white;
  min-height: 100vh;
  display: flex;      
  flex-direction: column; 
  align-items: center;
`;

const HeroSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 70px 40px;
  gap: 40px;
`;

const Title = styled.h1`
  color: #FFF;
  text-align: center;
  font-family: "Pretendard Variable";
  font-size: 32px;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
`;

const CurrentLoanButton = styled.button`
  display: inline-flex;
  padding: 15.5px 40px 14.5px 41px;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  border: 1px solid #5D625E;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(4px);
  color: #FFF;
  text-align: center;
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-heig ht: normal;
  letter-spacing: -0.56px;
`;

const ListSection = styled.div`
  display: inline-flex;
  width: 1081px;
  padding: 20px; 
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  border-radius: 14px;
  border: 1px solid #40423F;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(7px);
  margin: 0 auto;
`;

const ListHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 0px;
  width: 100%;
`;

const ListTitle = styled.h2`
  color: #FFF;
  font-family: "Pretendard Variable";
  font-size: 17px;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
  margin: 0;
  display: flex;
  padding-bottom: 14px;
  align-items: center;
  align-self: stretch;
  border-bottom: 1px solid #FFF;
  width: 100%;
`;


const GuideLink = styled.span`
  align-self: stretch;
  color: #FFF;
  font-family: "Pretendard Variable";
  font-size: 13px;
  font-weight: 500;
  text-decoration-line: underline;
  text-decoration-style: solid;
  text-decoration-skip-ink: auto;
  text-decoration-thickness: auto;
  text-underline-offset: auto;
  text-underline-position: from-font;
`;

const BookGrid = styled.div`
  display: inline-grid;
  row-gap: 20px;
  column-gap: 20px;
  grid-template-rows: repeat(2,fit-content(100%));
  grid-template-columns: repeat(4,fit-content(100%));
`;

const BookCard = styled.div`
  display: flex;
  flex-direction: column;
  transform: rotate(-0.053deg);
  align-items: center;
  gap: 16px;
  padding: 20px 36px;
  justify-content: center;
  align-items: center; 
  border-radius: 14px;
  border: 1px solid  #40423F;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(7px);
`;

const BookInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  align-self: stretch;
`;

const BookCover = styled.div`
  width: 120px;
  height: 160px;
  transform: rotate(0.053deg);
  flex-shrink: 0;
  background: #D9D9D9;
`;

const BookTitle = styled.p`
  color: #FFF;
  font-family: "Pretendard Variable";
  font-size: 15px;
  font-weight: 700;
  text-align: center;
  margin: 0;
  line-height: 1.4;
  word-break: keep-all;
`;

const BookAuthor = styled.p`
  color: #CCC;
  text-align: center;
  font-family: "Pretendard Variable";
  font-size: 13px;
  font-weight: 400;
  margin: 0;
`;

const LoanStatus = styled.span`
  font-family: "Pretendard Variable";
  font-size: 15px;
  font-weight: 700;
  color: ${({ available }) => (available ? '#5FFB7A' : '#EF4444')};
`;

export default function BookRentalPage() {
  const books = [
    { id: 1, title: 'Android Studio를 활용한 안드로이드 프로그래밍 (9판)', author: '김땡땡', available: true },
    { id: 2, title: 'Android Studio를 활용한 안드로이드 프로그래밍 (9판)', author: '김땡땡', available: false },
    { id: 3, title: 'Android Studio를 활용한 안드로이드 프로그래밍 (9판)', author: '김땡땡', available: true },
    { id: 4, title: 'Android Studio를 활용한 안드로이드 프로그래밍 (9판)', author: '김땡땡', available: false },
    { id: 5, title: 'Android Studio를 활용한 안드로이드 프로그래밍 (9판)', author: '김땡땡', available: true },
    { id: 6, title: 'Android Studio를 활용한 안드로이드 프로그래밍 (9판)', author: '김땡땡', available: false },
    { id: 7, title: 'Android Studio를 활용한 안드로이드 프로그래밍 (9판)', author: '김땡땡', available: true },
    { id: 8, title: 'Android Studio를 활용한 안드로이드 프로그래밍 (9판)', author: '김땡땡', available: false },
  ];

  return (
      <Wrapper>
        <HeroSection>
          <Title>내 서재</Title>
          <CurrentLoanButton>현재 대여중인 도서</CurrentLoanButton>
        </HeroSection>

        <ListSection>
          <ListHeader>
            <ListTitle>도서 목록</ListTitle>
            <GuideLink>🔎 도서 대여 방법 알아보기</GuideLink>
          </ListHeader>

          <BookGrid>
            {books.map((book) => (
                <BookCard key={book.id}>
                  <BookCover />
                  <BookInfo>
                    <BookTitle>{book.title}</BookTitle>
                    <BookAuthor>{book.author}</BookAuthor>
                  </BookInfo>
                    <LoanStatus available={book.available}>
                      📖 {book.available ? '대여 가능' : '대여 불가능'} 📖
                    </LoanStatus>
                </BookCard>
            ))}
          </BookGrid>
        </ListSection>
      </Wrapper>
  );
}