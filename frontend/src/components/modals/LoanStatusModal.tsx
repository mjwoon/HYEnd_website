import styled from 'styled-components';
import { useState, useEffect } from 'react';
import { ExtendConfirmModal } from './ExtendConfirmModal';
import { CancelConfirmModal } from './CancelConfirmModal';
import { bookLoanStore, type BookLoan } from '../../store/bookStore';
import { useAuthStore } from '../../store/authStore';

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.40);
  backdrop-filter: blur(15px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
`;

const Card = styled.div`
  width: 646px;
  padding: 24px 24px 20px 24px;
  border-radius: 14px;
  border: 1px solid #40423F;
  background: #181818;
  color: #fff;
  z-index: 101;
  position: relative;
`;

const CardTitle = styled.h2`
  color: #FFF;
  font-family: "Pretendard Variable";
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px 0;
`;

const Table = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const TableHeader = styled.div`
  display: grid;
  width: 606px;
  height: 37px;
  grid-template-columns: 225px 129px 113px 61px;
  padding: 10px 25px 10px 62px;
  border-radius: 14px;
  border: 1px solid #40423F;
  background: #2C3C2F;
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-weight: 600;
`;

const HeaderCell = styled.span`
  color: #5FFB7A;
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-weight: 400;
  line-height: normal;
`;

const TableRow = styled.div`
  display: grid;
  width: 606px;
  grid-template-columns: 2fr 2fr 1fr 1fr;
  padding: 10px 20px;
  gap: 54.33px;
  border-radius: 14px;
  border: 1px solid #40423F;
  font-size: 12px;
  justify-content: space-between;
  align-items: center;
  background: rgba(255,255,255,0.02);
`;

const BookTitle = styled.span`
  width: 137px;
  color: #CCC;
  font-family: "Pretendard Variable";
  font-size: 12px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Period = styled.span`
  width: 144px;
  color: #FFF;
  font-family: "Pretendard Variable";
  font-size: 12px;
  font-weight: 400;
`;

const ExtendButton = styled.button<{ canExtend: boolean }>`
  padding: 4px 8px;
  width: 61px;
  height: 21px;
  align-items: center;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: ${({ canExtend }) => canExtend ? 'pointer' : 'not-allowed'};
  background: ${({ canExtend }) => canExtend ? '#334158' : '#3D3E41'};
  color: ${({ canExtend }) => canExtend ? '#5FA5F9' : '#9CA3AF'};
`;

const CancelButton = styled.button`
  padding: 4px 8px;
  width: 61px;
  height: 21px;
  align-items: center;
  border-radius: 4px;
  font-family: "Pretendard Variable";
  font-size: 12px;
  font-weight: 500;
  background: #573535;
  color: #F26F6F;
  cursor: pointer;
`;

const EmptyNote = styled.p`
  color: #676767;
  font-family: "Pretendard Variable";
  font-size: 14px;
  text-align: center;
  padding: 20px 0;
`;

const Notice = styled.p`
  width: 606px;
  height: 37px;
  font-size: 14px;
  font-weight: 400;
  font-family: "Pretendard Variable";
  color: #5FFB7A;
  padding: 10px 183px 10px 184px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px 0 0 0;
  border-radius: 14px;
  background: #292F2A;
  text-align: center;
  white-space: nowrap;
`;

import { BOOKS } from '../../data/books';

function getBookTitle(bookId: number): string {
    return BOOKS.find((b) => b.id === bookId)?.title ?? '알 수 없는 도서';
}

interface Props {
    onClose: () => void;
    onChanged?: () => void;
}

export function LoanStatusModal({ onClose, onChanged }: Props) {
    const { user } = useAuthStore();
    const [loans, setLoans] = useState<BookLoan[]>([]);
    const [isExtendOpen, setIsExtendOpen] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState<BookLoan | null>(null);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [selectedCancelLoan, setSelectedCancelLoan] = useState<BookLoan | null>(null);

    function reload() {
        if (user) setLoans(bookLoanStore.getByUser(user.id));
    }

    useEffect(() => { reload(); }, [user]);

    function handleExtendConfirm() {
        if (!selectedLoan) return;
        bookLoanStore.extend(selectedLoan.id);
        reload();
        onChanged?.();
        setIsExtendOpen(false);
    }

    function handleCancelConfirm() {
        if (!selectedCancelLoan) return;
        bookLoanStore.cancel(selectedCancelLoan.id);
        reload();
        onChanged?.();
        setIsCancelOpen(false);
    }

    return (
        <Overlay onClick={() => { if (!isExtendOpen && !isCancelOpen) onClose(); }}>
            <Card onClick={(e) => e.stopPropagation()}>
                <CardTitle>현재 대여중인 도서</CardTitle>
                <Table>
                    <TableHeader>
                        <HeaderCell style={{ fontWeight: 600 }}>도서명</HeaderCell>
                        <HeaderCell>기간</HeaderCell>
                        <HeaderCell>대여 연장</HeaderCell>
                        <HeaderCell>대여 취소</HeaderCell>
                    </TableHeader>
                    {loans.length === 0 ? (
                        <EmptyNote>현재 대여 중인 도서가 없습니다.</EmptyNote>
                    ) : loans.map((loan) => (
                        <TableRow key={loan.id}>
                            <BookTitle>{getBookTitle(loan.bookId)}</BookTitle>
                            <Period>{loan.startDate} ~ {loan.endDate}</Period>
                            <ExtendButton
                                canExtend={!loan.extended}
                                onClick={() => {
                                    if (!loan.extended) {
                                        setSelectedLoan(loan);
                                        setIsExtendOpen(true);
                                    }
                                }}
                            >
                                {loan.extended ? '연장 불가' : '대여 연장'}
                            </ExtendButton>
                            <CancelButton onClick={() => {
                                setSelectedCancelLoan(loan);
                                setIsCancelOpen(true);
                            }}>대여 취소</CancelButton>
                        </TableRow>
                    ))}
                </Table>
                <Notice>💡 각 도서는 최대 1회까지 연장 가능합니다.</Notice>
            </Card>

            {isExtendOpen && selectedLoan && (
                <ExtendConfirmModal
                    loan={selectedLoan}
                    onClose={() => setIsExtendOpen(false)}
                    onConfirm={handleExtendConfirm}
                />
            )}
            {isCancelOpen && selectedCancelLoan && (
                <CancelConfirmModal
                    loan={selectedCancelLoan}
                    onClose={() => setIsCancelOpen(false)}
                    onConfirm={handleCancelConfirm}
                />
            )}
        </Overlay>
    );
}
