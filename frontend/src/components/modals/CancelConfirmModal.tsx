import styled from 'styled-components';

interface LoanBook {
    title: string;
    period: string;
    canExtend: boolean;
}

interface Props {
    loan: LoanBook | null;
    onClose: () => void;
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
  background: #4E2C2C;
  display: flex;
  justify-content: center;
  align-items: center;
  `;

const Title = styled.h2`
  font-family: "Pretendard Variable";
  font-size: 18px;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
  margin: 0;
  text-align: center;
  `;

const ContentsWrapper=styled.p`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
`;

const BookTitle = styled.p`
  font-family: "Pretendard Variable";
  width: 143px;
  font-size: 12px;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
  color: #fff;
  text-align: center;
`;

const Description = styled.p`
  color: #CCC;
  font-family: "Pretendard Variable";
  font-size: 12px;
  text-align: center;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
`;

const Warning = styled.p`
    font-family: "Pretendard Variable";
    font-size: 10px;
    color: #F87171;
    text-align: center;
    font-style: normal;
    font-weight: 600;
    line-height: normal;
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
  padding: 15px 20px;
  border-radius: 8px;
  justify-content: center;
  align-items: center;
  gap: 10px;
  border: 1px solid #5D625E;
  background: rgba(255,255,255,0.10);
  color: #fff;
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-weight: 500;
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  letter-spacing: -0.56px;
`;

const ConfirmButton = styled.button`
  display: flex;
  width: 121px;
  height: 39px;
  padding: 15px 20px;
  border-radius: 8px;
  justify-content: center;
  align-items: center;
  gap: 10px;
  border: 1px solid #5D625E;
  background: #E12E2E;
  color: #fff;
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-weight: 700;
  font-style: normal;
  line-height: normal;
  letter-spacing: -0.56px;
`;

export function CancelConfirmModal({ loan, onClose }: Props) {
    if (!loan) return null;

    return (
        <Overlay>
            <Card>
                <IconWrapper>
                    <span style={{ fontSize: '40px' }}>🗑️</span>
                </IconWrapper>
                <Title>대여 취소 확인</Title>
                <ContentsWrapper>
                    <BookTitle>"{loan.title}"</BookTitle>
                    <Description>도서의 대여를 취소하시겠습니까?</Description>
                    <Warning>취소 후에는 다시 되돌릴 수 없습니다.</Warning>
                </ContentsWrapper>
                <ButtonRow>
                    <CancelButton onClick={onClose}>취소</CancelButton>
                    <ConfirmButton>대여 취소</ConfirmButton>
                </ButtonRow>
            </Card>
        </Overlay>
    );
}