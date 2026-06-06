import styled, { keyframes, css } from 'styled-components';

const bubbles = [
  { text: '한양대학교 ERICA 소프트웨어융합대학 전공 학회', position: 'left' },
  { text: 'ICT융합학부 교수님의 지원을 토대로 2023년에 창설되었습니다.', position: 'right' },
  { text: 'FE & BE 개발 기초부터 고급 웹/앱 개발 및 디자인까지!', position: 'left' },
  { text: 'HY-End는 HanYang과 High-End를 합친 단어로, 최상의 웹/앱 프로젝트를 만들고자 합니다', position: 'right' },
];

const slideFromLeft = keyframes`
  from { opacity: 0; transform: translateX(-48px); }
  to   { opacity: 1; transform: translateX(0); }
`;
const slideFromRight = keyframes`
  from { opacity: 0; transform: translateX(48px); }
  to   { opacity: 1; transform: translateX(0); }
`;
const titleFadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

export default function IntroduceSection() {
  return (
    <Wrapper>
      <Title>INTRODUCE</Title>
      <BubbleList>
        {bubbles.map((bubble, index) => (
          <Bubble key={index} $position={bubble.position} $index={index}>
            "{bubble.text}"
          </Bubble>
        ))}
      </BubbleList>
    </Wrapper>
  );
}

const Wrapper = styled.section`
  position: relative;
  width: 100%;
  height: 100vh;
  padding: 130px 150px 0;
`;

const Title = styled.h1`
  margin: 0 0 60px;
  color: #55ff78;
  font-size: 64px;
  font-weight: 500;
  text-shadow: 0 0 14px rgba(85, 255, 120, 0.9);
  animation: ${titleFadeUp} 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
`;

const BubbleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 52px;
`;

const Bubble = styled.div<{ $position: string; $index: number }>`
  width: fit-content;
  max-width: 630px;
  padding: 18px 42px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: #55ff78;
  font-size: 14px;
  line-height: 1.6;
  margin-left: ${({ $position }) => ($position === 'right' ? '360px' : '0')};

  ${({ $position, $index }) => css`
    animation: ${$position === 'left' ? slideFromLeft : slideFromRight}
      0.55s cubic-bezier(0.22, 1, 0.36, 1) ${0.1 + $index * 0.1}s both;
  `}

  transition: background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  &:hover {
    background: rgba(85, 255, 120, 0.12);
    border-color: rgba(85, 255, 120, 0.5);
    box-shadow: 0 0 20px rgba(85, 255, 120, 0.15);
  }
`;
