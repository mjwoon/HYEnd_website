import styled from 'styled-components';

export default function GreetingPage() {
  return (
    <Wrapper>
      <Content>
        <Title>HY-END에 오신 걸 환영합니다!</Title>
        <Description>
          <p>우리는 개발을 사랑하는 사람들입니다.</p>
          <p>HY-END는 다양한 분야의 학생들이 모여 함께 배우고 성장하는 학회입니다.</p>
          <p>프론트엔드, 백엔드, 디자인 등 다양한 분야를 아우르며, 자신만의 프로젝트를 직접 기획하고 개발합니다.</p>
          <p>함께 도전하며 의미있는 결과를 만들어봅시다.</p>
          <p>끊임없이 배우고, 학습하며 아이디어를 세상에 내놓고 싶은 모든 분을 HY-END가 기다리고 있습니다.</p>
        </Description>
      </Content>
    </Wrapper>
  );
}

const Wrapper = styled.section`
  position: relative;
  width: 100%;
  min-height: 100%;
  overflow: hidden;
  color: #ffffff;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 120px 10vw 90px;
`;


const Content = styled.div`
  position: relative;
  z-index: 2;
  width: min(980px, 100%);
  transform: translateY(40px);
`;

const Title = styled.h1`
  margin: 0 0 44px;
  color: #55ff74;
  font-size: 55px;
  font-weight: 500;
  line-height: 1.15;
  letter-spacing: -0.045em;
  text-shadow:
    0 0 8px rgba(85, 255, 116, 0.7),
    0 0 24px rgba(85, 255, 116, 0.22);
`;

const Description = styled.div`
  display: flex;
  flex-direction: column;
  gap: 9px;
  font-size: 20px;
  font-weight: 400;
  line-height: 1.5;
`;
