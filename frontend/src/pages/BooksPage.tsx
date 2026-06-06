import styled from 'styled-components';
import { useState, useEffect } from 'react';
import { LoanStatusModal } from '../components/modals/LoanStatusModal';
import { GuideModal } from '../components/modals/GuideModal';
import { bookLoanStore } from '../store/bookStore';
import { useAuthStore } from '../store/authStore';
import { BOOKS, type Book } from '../data/books';

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
    THEORY:    { bg: '#2C2C3E', color: '#A78BFA' },
    WEB:       { bg: '#1E2D3E', color: '#60A5FA' },
    AI:        { bg: '#1E3028', color: '#34D399' },
    ALGORITHM: { bg: '#2E2A1E', color: '#FBBF24' },
    BACK:      { bg: '#2C1E3A', color: '#C084FC' },
    FRONT:     { bg: '#1E2E3A', color: '#38BDF8' },
    DB:        { bg: '#3A1E1E', color: '#FB923C' },
    MOBILE:    { bg: '#1E3A2C', color: '#4ADE80' },
};

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
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.56px;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.20);
  }
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
  cursor: pointer;
`;

const BookGrid = styled.div`
  display: inline-grid;
  row-gap: 20px;
  column-gap: 20px;
  grid-template-rows: repeat(2, fit-content(100%));
  grid-template-columns: repeat(4, fit-content(100%));
`;

const BookCard = styled.div`
  display: flex;
  flex-direction: column;
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
  color: ${({ available }) => (available ? '#5FFB7A' : '#EF4444')};
`;

const TagBadge = styled.span<{ tag: string }>`
  display: inline-flex;
  height: 20px;
  border-radius: 4px;
  padding: 3px 9px;
  align-items: center;
  font-family: "Pretendard Variable";
  font-size: 12px;
  font-weight: 500;
  background: ${({ tag }) => TAG_COLORS[tag]?.bg ?? '#334158'};
  color: ${({ tag }) => TAG_COLORS[tag]?.color ?? '#FFF'};
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
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
  padding: 30px;
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
  margin: 22px 22px 16px;
  word-break: keep-all;
  width: 171px;
`;

const ModalInfoContainer = styled.div`
  display: flex;
  width: 331px;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  border-radius: 14px;
`;

const ModalInfoRow = styled.div`
  display: flex;
  width: 331px;
  align-items: center;
  gap: 36px;
`;

const ModalTag = styled.span`
  color: #CCC;
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-weight: 500;
  width: 80px;
`;

const ModalValue = styled.span`
  color: #FFF;
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-weight: 500;
`;

const DateInput = styled.input`
  background: rgba(255,255,255,0.06);
  border: 1px solid #40423F;
  border-radius: 6px;
  color: #5FFB7A;
  font-family: "Pretendard Variable";
  font-size: 14px;
  padding: 4px 10px;
  cursor: pointer;
  outline: none;

  &:focus {
    border-color: #5FFB7A;
  }
`;

const ModalButtonRow = styled.div`
  display: flex;
  gap: 15px;
  width: 331px;
  margin-top: 30px;
`;

const CancelButton = styled.button`
  width: 158px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid #5D625E;
  background: rgba(255, 255, 255, 0.10);
  color: #FFF;
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.56px;
`;

const RentButton = styled.button<{ disabled?: boolean }>`
  width: 158px;
  height: 40px;
  border-radius: 8px;
  background: ${({ disabled }) => disabled ? '#3A3A3A' : '#5FFB7A'};
  color: ${({ disabled }) => disabled ? '#666' : '#000'};
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.56px;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  transition: opacity 0.2s ease;
`;

const RentedByNote = styled.p`
  color: #676767;
  font-family: "Pretendard Variable";
  font-size: 12px;
  margin: 6px 0 0;
  text-align: center;
`;

const SuccessBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(95, 251, 122, 0.12);
  color: #5FFB7A;
  font-family: "Pretendard Variable";
  font-size: 13px;
  font-weight: 600;
  margin-top: 16px;
  width: 331px;
`;

function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

export default function BookRentalPage() {
    const { user } = useAuthStore();
    const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [rentedMap, setRentedMap] = useState<Record<number, boolean>>({});
    const [startDate, setStartDate] = useState(todayStr());
    const [justRented, setJustRented] = useState(false);
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        const map: Record<number, boolean> = {};
        BOOKS.forEach((b) => { map[b.id] = bookLoanStore.isRented(b.id); });
        setRentedMap(map);
    }, [refresh]);

    function handleOpenBook(book: Book) {
        setSelectedBook(book);
        setStartDate(todayStr());
        setJustRented(false);
    }

    function handleRent() {
        if (!selectedBook || !user) return;
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 14);
        bookLoanStore.rent(selectedBook.id, user.id, user.fullName || user.username, startDate);
        setJustRented(true);
        setRefresh((r) => r + 1);
    }

    function handleCloseModal() {
        setSelectedBook(null);
        setJustRented(false);
    }

    const selectedAvailable = selectedBook ? !rentedMap[selectedBook.id] : false;
    const endDateStr = (() => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + 14);
        return d.toISOString().slice(0, 10);
    })();

    return (
        <Wrapper>
            <HeroSection>
                <Title>내 서재</Title>
                <CurrentLoanButton onClick={() => setIsLoanModalOpen(true)}>
                    현재 대여중인 도서
                </CurrentLoanButton>
            </HeroSection>

            <ListSection>
                <ListHeader>
                    <ListTitle>도서 목록</ListTitle>
                    <GuideLink onClick={() => setIsGuideOpen(true)}>🔎 도서 대여 방법 알아보기</GuideLink>
                </ListHeader>

                <BookGrid>
                    {BOOKS.map((book) => {
                        const available = !rentedMap[book.id];
                        return (
                            <BookCard key={book.id} onClick={() => handleOpenBook(book)}>
                                <BookCover />
                                <BookInfo>
                                    <BookTitle>{book.title}</BookTitle>
                                    <BookAuthor>{book.author}</BookAuthor>
                                    <TagBadge tag={book.tag}>{book.tag}</TagBadge>
                                </BookInfo>
                                <LoanStatus available={available}>
                                    📖 {available ? '대여 가능' : '대여 불가'} 📖
                                </LoanStatus>
                            </BookCard>
                        );
                    })}
                </BookGrid>
            </ListSection>

            {isLoanModalOpen && (
                <LoanStatusModal
                    onClose={() => setIsLoanModalOpen(false)}
                    onChanged={() => setRefresh((r) => r + 1)}
                />
            )}
            {isGuideOpen && <GuideModal onClose={() => setIsGuideOpen(false)} />}

            {selectedBook && (
                <ModalOverlay onClick={handleCloseModal}>
                    <ModalCard onClick={(e) => e.stopPropagation()}>
                        <ModalBookCover />
                        <ModalTitle>{selectedBook.title}</ModalTitle>

                        <ModalInfoContainer>
                            <ModalInfoRow>
                                <ModalTag>저자</ModalTag>
                                <ModalValue>{selectedBook.author}</ModalValue>
                            </ModalInfoRow>
                            <ModalInfoRow>
                                <ModalTag>태그</ModalTag>
                                <TagBadge tag={selectedBook.tag}>{selectedBook.tag}</TagBadge>
                            </ModalInfoRow>
                            <ModalInfoRow>
                                <ModalTag>상태</ModalTag>
                                <LoanStatus available={selectedAvailable}>
                                    {selectedAvailable ? '대여 가능' : '대여 불가'}
                                </LoanStatus>
                            </ModalInfoRow>

                            {selectedAvailable ? (
                                <>
                                    <ModalInfoRow>
                                        <ModalTag>대여 시작일</ModalTag>
                                        <DateInput
                                            type="date"
                                            value={startDate}
                                            min={todayStr()}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                    </ModalInfoRow>
                                    <ModalInfoRow>
                                        <ModalTag>대여 마감일</ModalTag>
                                        <ModalValue style={{ color: '#CCC' }}>{endDateStr}</ModalValue>
                                    </ModalInfoRow>
                                </>
                            ) : (
                                (() => {
                                    const loan = bookLoanStore.getLoanForBook(selectedBook.id);
                                    return (
                                        <ModalInfoRow>
                                            <ModalTag>대여 기간</ModalTag>
                                            <ModalValue style={{ color: '#5D5D5D' }}>
                                                {loan ? `${loan.startDate} ~ ${loan.endDate}` : '-'}
                                            </ModalValue>
                                        </ModalInfoRow>
                                    );
                                })()
                            )}
                        </ModalInfoContainer>

                        {justRented ? (
                            <SuccessBadge>✅ 대여 신청이 완료되었습니다!</SuccessBadge>
                        ) : selectedAvailable ? (
                            <ModalButtonRow>
                                <CancelButton onClick={handleCloseModal}>취소</CancelButton>
                                <RentButton onClick={handleRent}>대여하기</RentButton>
                            </ModalButtonRow>
                        ) : (
                            <RentedByNote>
                                {(() => {
                                    const loan = bookLoanStore.getLoanForBook(selectedBook.id);
                                    return loan ? `${loan.borrowerName}님이 대여 중입니다` : '현재 대여 중인 도서입니다';
                                })()}
                            </RentedByNote>
                        )}
                    </ModalCard>
                </ModalOverlay>
            )}
        </Wrapper>
    );
}
