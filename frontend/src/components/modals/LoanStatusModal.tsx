import styled from 'styled-components';

interface LoanBook {
    title: string;
    period: string;
    canExtend: boolean;
}

const loans: LoanBook[] = [
    { title: 'Android Studio를 활용한 안드로이드 프로그래밍 (9판)', period: '2024-07-01 ~ 2024-07-15', canExtend: true },
    { title: 'Android Studio를 활용한 안드로이드 프로그래밍 (9판)', period: '2024-07-01 ~ 2024-07-15', canExtend: true },
    { title: 'Android Studio를 활용한 안드로이드 프로그래밍 (9판)', period: '2024-07-01 ~ 2024-07-15', canExtend: false },
    { title: 'Android Studio를 활용한 안드로이드 프로그래밍 (9판)', period: '2024-07-01 ~ 2024-07-15', canExtend: true },
];

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
  width: 134px;
  height: 26px;
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
  color: #5FFB7A;
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-weight: 600;
`;

const HeaderCell = styled.span`
  color: #5FFB7A;
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
`;

const TableRow = styled.div`
  display: grid;
  width: 606px;
  grid-template-columns: 2fr 2fr 1fr 1fr;
  padding: 10px 20px;
  gap: 54.33px;
  border-radius: 8px;
  background: rgba(255,255,255,0.02);
  border-radius: 14px;
  border: 1px solid #40423F;
  font-size: 12px;
    justify-content: space-between;
    align-items: center;
    align-self: stretch;
`;

const BookTitle = styled.span`
  width: 137px;
  color: #CCC;
  font-family: "Pretendard Variable";
  font-size: 12px;
  font-weight: 600;
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
  gap: 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
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
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  background: #573535;
  color: #F26F6F;
  cursor: pointer;
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

interface Props {
    onClose: () => void;
}

export function LoanStatusModal({ onClose }: Props) {
    return (
        <Overlay onClick={onClose}>
            <Card onClick={(e) => e.stopPropagation()}>
                <CardTitle>현재 대여중인 도서</CardTitle>
                <Table>
                    <TableHeader>
                        <HeaderCell style={{fontWeight: 600}}>도서명</HeaderCell>
                        <HeaderCell>기간</HeaderCell>
                        <HeaderCell>대여 연장</HeaderCell>
                        <HeaderCell>대여 취소</HeaderCell>
                    </TableHeader>
                    {loans.map((loan, i) => (
                        <TableRow key={i}>
                            <BookTitle>{loan.title}</BookTitle>
                            <Period>{loan.period}</Period>
                            <ExtendButton canExtend={loan.canExtend}>
                                {loan.canExtend ? '대여 연장' : '연장 불가'}
                            </ExtendButton>
                            <CancelButton>대여 취소</CancelButton>
                        </TableRow>
                    ))}
                </Table>
                <Notice>💡 각 도서는 최대 1회까지 연장 가능합니다.</Notice>
            </Card>
        </Overlay>
    );
}