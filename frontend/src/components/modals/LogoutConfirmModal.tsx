import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.40);
  backdrop-filter: blur(15px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
`;

const Card = styled.div`
  width: 303px;
  padding: 28px 24px 24px;
  border-radius: 14px;
  border: 1px solid #40423F;
  background: #181818;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const IconWrapper = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 30px;
`;

const Title = styled.h2`
  font-family: "Pretendard Variable";
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  text-align: center;
  color: #FFF;
`;

const Desc = styled.p`
  font-family: "Pretendard Variable";
  font-size: 13px;
  font-weight: 400;
  color: #888;
  text-align: center;
  margin: 0;
  line-height: 1.6;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
  margin-top: 4px;
`;

const CancelBtn = styled.button`
  flex: 1;
  height: 40px;
  border-radius: 8px;
  border: 1px solid #5D625E;
  background: rgba(255, 255, 255, 0.06);
  color: #C0C2C0;
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
  &:hover { background: rgba(255, 255, 255, 0.12); }
`;

const ConfirmBtn = styled.button`
  flex: 1;
  height: 40px;
  border-radius: 8px;
  background: rgba(255, 80, 80, 0.85);
  color: #FFF;
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-weight: 700;
  transition: background 0.2s;
  &:hover { background: rgba(255, 80, 80, 1); }
`;

interface Props {
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutConfirmModal({ onClose, onConfirm }: Props) {
  return (
    <Overlay onClick={onClose}>
      <Card onClick={(e) => e.stopPropagation()}>
        <IconWrapper>👋</IconWrapper>
        <Title>로그아웃</Title>
        <Desc>정말 로그아웃 하시겠습니까?</Desc>
        <ButtonRow>
          <CancelBtn onClick={onClose}>취소</CancelBtn>
          <ConfirmBtn onClick={onConfirm}>로그아웃</ConfirmBtn>
        </ButtonRow>
      </Card>
    </Overlay>
  );
}
