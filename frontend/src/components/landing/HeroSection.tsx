import styled from 'styled-components';

const Section = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 32px;
`;

const Title = styled.div`
  text-align: center;
`;

const WelcomeText = styled.h2`
  font-size: 2rem;
  color: white;
  font-weight: 300;
  letter-spacing: 0.1em;
`;

const MainTitle = styled.h1`
  font-size: 5rem;
  color: #00ff00;
  font-weight: 700;
  text-shadow: 0 0 30px #00ff00;
`;

const Dots = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
`;

const Dot = styled.span<{ active?: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ active }) => (active ? '#00ff00' : 'transparent')};
  border: 1px solid #00ff00;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
`;

const Button = styled.button<{ filled?: boolean }>`
  padding: 12px 32px;
  border: 1px solid #00ff00;
  background: ${({ filled }) => (filled ? '#00ff00' : 'transparent')};
  color: ${({ filled }) => (filled ? 'black' : 'white')};
  cursor: pointer;
  font-size: 1rem;
`;

export default function HeroSection() {
  return (
    <Section>
      <Dots>
        <Dot active />
        <Dot />
        <Dot />
        <Dot />
      </Dots>

      <Title>
        <WelcomeText>WELCOME TO</WelcomeText>
        <MainTitle>HY-END</MainTitle>
      </Title>

      <Dots>
        <Dot active />
        <Dot />
        <Dot />
        <Dot />
      </Dots>

      <ButtonGroup>
        <Button>로그인</Button>
        <Button filled>회원가입</Button>
      </ButtonGroup>
    </Section>
  );
}
