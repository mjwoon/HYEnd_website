import styled from 'styled-components';
import bookIcon from '../../assets/📚.png';
import { type BookLoan } from '../../store/bookStore';

interface Props {
    loan: BookLoan | null;
    onClose: () => void;
    onConfirm: () => void;
}

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.40);
  backdrop-filter: blur(15px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
`;

const Card = styled.div`
  width: 303px;
  padding: 20px;
  gap: 20px;
  border-radius: 14px;
  border: 1px solid #40423F;
  background: #181818;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const IconWrapper = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #1E2A3A;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Title = styled.h2`
  font-family: "Pretendard Variable";
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  text-align: center;
`;

const ContentsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const Description = styled.p`
  color: #CCC;
  font-family: "Pretendard Variable";
  font-size: 12px;
  text-align: center;
  font-weight: 600;
  margin: 0;
`;

const ExtendInfo = styled.p`
  font-family: "Pretendard Variable";
  font-size: 11px;
  color: #5FA5F9;
  text-align: center;
  font-weight: 600;
  margin: 0;
`;

const ExtendCount = styled.p`
  font-family: "Pretendard Variable";
  font-size: 10px;
  color: #999;
  text-align: center;
  font-weight: 600;
  margin: 0;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 20px;
  width: 100%;
`;

const CancelButton = styled.button`
  display: flex;
  width: 121px;
  height: 39px;
  border-radius: 8px;
  justify-content: center;
  align-items: center;
  border: 1px solid #5D625E;
  background: rgba(255,255,255,0.10);
  color: #fff;
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.56px;
`;

const ConfirmButton = styled.button`
  display: flex;
  width: 121px;
  height: 39px;
  border-radius: 8px;
  justify-content: center;
  align-items: center;
  background: #2A6AEE;
  color: #fff;
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.56px;
`;

function addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

export function ExtendConfirmModal({ loan, onClose, onConfirm }: Props) {
    if (!loan) return null;

    const newEndDate = addDays(loan.endDate, 14);

    return (
        <Overlay onClick={(e) => e.stopPropagation()}>
            <Card>
                <IconWrapper>
                    <img src={bookIcon} width={48} height={48} />
                </IconWrapper>
                <Title>대여 연장 확인</Title>
                <ContentsWrapper>
                    <Description>도서의 대여 기간을 2주 연장하시겠습니까?</Description>
                    <ExtendInfo>{loan.endDate} → {newEndDate}</ExtendInfo>
                    <ExtendCount>(연장 횟수: 0/1)</ExtendCount>
                </ContentsWrapper>
                <ButtonRow>
                    <CancelButton onClick={onClose}>취소</CancelButton>
                    <ConfirmButton onClick={onConfirm}>연장하기</ConfirmButton>
                </ButtonRow>
            </Card>
        </Overlay>
    );
}
