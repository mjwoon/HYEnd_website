import styled from 'styled-components';
import { useState } from 'react';

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
  line-height: normal;
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
  border-radius: 14px;
  border: 1px solid #40423F;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(7px);
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
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

const LoanStatus = styled.span<{ available: boolean }>`
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-weight: 500;
  height: 17px;
  color: ${({ available }) => (available ? '#5FFB7A' : '#EF4444')};
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.40);
  backdrop-filter: blur(15px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
`;

const ModalCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 30px 29px 30px;
  width: 441px;
  border-radius: 14px;
  border: 1px solid #40423F;
  background: #181818;
`;

const ModalBookCover = styled.div`
  width: 115px;
  height: 141px;
  background: #D9D9D9;
  flex-shrink: 0;
`;

const ModalTitle = styled.p`
  color: #FFF;
  font-family: "Pretendard Variable";
  font-size: 15px;
  font-weight: 700;
  text-align: center;
  margin: 22px;
  word-break: keep-all;
  width: 171px;
`;


const ModalInfoContainer = styled.div`
  display: flex;
  width: 331px;
  height: 168px;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  border-radius: 14px;
`;

const ModalInfoRow = styled.div`
  display: flex;
  width: 331px;
  align-items: center;
  gap : 36px;
`;

const ModalTag = styled.span`
  color: #CCC;
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-weight: 500;
  width: 80px;
  height: 17px;
`;

const ModalValue = styled.span`
  color: #FFF;
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-weight: 500;
  height: 17px;
  line-height: normal;
`;

const TagBadge = styled.span`
  display: flex;
  width: 184px;
  height: 20px;
  border-radius: 4px;
  padding: 3px 9px;
  align-items: center;
  gap: 10px;
  background: #334158;
  color: #FFF;
  font-family: "Pretendard Variable";
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
`;

const DateLink = styled.span`
  color: #5FFB7A;
  font-size: 14px;
  height: 17px;
  text-decoration: underline;
  text-decoration-style: solid;
  text-decoration-skip-ink: auto;
  text-decoration-thickness: auto;
  text-underline-offset: auto;
  text-underline-position: from-font;
`;

const ModalButtonRow = styled.div`
  display: flex;
  gap: 15px;
  width: 331px;
  margin-top: 58px;
`;

const CancelButton = styled.button`
  width:158px;
  height:40px;
  padding: 11.5px 20px ;
  border-radius: 8px;
  border: 1px solid #5D625E;
  background: rgba(255, 255, 255, 0.10);
  color: #FFF;
  text-align: center;
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.56px;
`;

const RentButton = styled.button`
  width:158px;
  height:40px;
  padding: 11.5px 20px;
  border-radius: 8px;
  justify-content: center;
  align-items: center;
  gap: 10px;
  background: #5FFB7A;
  color: #000;
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.56px;
`;

export default function BookRentalPage() {
    const [selectedBook, setSelectedBook] = useState(null);

    const books = [
        { id: 1, title: 'Android Studio를 활용한 안드로이드 프로그래밍 (9판)', author: '김땡땡', available: true, tag: 'BACK' },
        { id: 2, title: 'Android Studio를 활용한 안드로이드 프로그래밍 (9판)', author: '김땡땡', available: false, tag: 'BACK' },
        { id: 3, title: 'Android Studio를 활용한 안드로이드 프로그래밍 (9판)', author: '김땡땡', available: true, tag: 'BACK' },
        { id: 4, title: 'Android Studio를 활용한 안드로이드 프로그래밍 (9판)', author: '김땡땡', available: false, tag: 'BACK' },
        { id: 5, title: 'Android Studio를 활용한 안드로이드 프로그래밍 (9판)', author: '김땡땡', available: true, tag: 'BACK' },
        { id: 6, title: 'Android Studio를 활용한 안드로이드 프로그래밍 (9판)', author: '김땡땡', available: false, tag: 'BACK' },
        { id: 7, title: 'Android Studio를 활용한 안드로이드 프로그래밍 (9판)', author: '김땡땡', available: true, tag: 'BACK' },
        { id: 8, title: 'Android Studio를 활용한 안드로이드 프로그래밍 (9판)', author: '김땡땡', available: false, tag: 'BACK' },
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
                        <BookCard key={book.id} onClick={() => setSelectedBook(book)}>
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

            {selectedBook && (
                <ModalOverlay onClick={() => setSelectedBook(null)}>
                    <ModalCard onClick={(e) => e.stopPropagation()}>
                        <ModalBookCover />
                        <ModalTitle>{selectedBook.title}</ModalTitle>

                        <ModalInfoContainer>  {/* 👈 추가 */}
                            <ModalInfoRow>
                                <ModalTag>저자</ModalTag>
                                <ModalValue>{selectedBook.author}</ModalValue>
                            </ModalInfoRow>
                            <ModalInfoRow>
                                <ModalTag>태그</ModalTag>
                                <TagBadge>{selectedBook.tag}</TagBadge>
                            </ModalInfoRow>
                            <ModalInfoRow>
                                <ModalTag>상태</ModalTag>
                                <LoanStatus available={selectedBook.available}>
                                    {selectedBook.available ? '대여 가능' : '대여 불가능'}
                                </LoanStatus>
                            </ModalInfoRow>
                            {selectedBook.available ? (
                                // available이 true면 기존 내용
                                <>
                                    <ModalInfoRow>
                                        <ModalTag>대여 시작일</ModalTag>
                                        <DateLink>날짜 선택</DateLink>
                                    </ModalInfoRow>
                                    <ModalInfoRow>
                                        <ModalTag>대여 마감일</ModalTag>
                                        <ModalValue>-</ModalValue>
                                    </ModalInfoRow>
                                </>
                            ) : (
                                // available이 false면 대여 기간 상태 표시
                                <ModalInfoRow>
                                    <ModalTag>대여 기간 상태</ModalTag>
                                    <ModalValue style={{ color: '#5D5D5D' }}>2024-07-01 ~ 2024-07-15</ModalValue>
                                </ModalInfoRow>
                            )}
                        </ModalInfoContainer>

                        {selectedBook.available && (  // 👈 대여 가능일 때만 버튼 표시
                            <ModalButtonRow>
                                <CancelButton onClick={() => setSelectedBook(null)}>취소</CancelButton>
                                <RentButton>대여하기</RentButton>
                            </ModalButtonRow>
                        )}
                    </ModalCard>
                </ModalOverlay>
            )}
        </Wrapper>
    );
}