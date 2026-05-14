import styled from "styled-components";

const bubbles = [
  {
    text: "한양대학교 ERICA 소프트웨어융합대학 전공 학회",
    position: "left",
  },
  {
    text: "ICT융합학부 교수님의 지원을 토대로 2023년에 창설되었습니다.",
    position: "right",
  },
  {
    text: "FE & BE 개발 기초부터 고급 웹/앱 개발 및 디자인까지!",
    position: "left",
  },
  {
    text: "HY-End는 HanYang과 High-End를 합친 단어로, 최상의 웹/앱 프로젝트를 만들고자 합니다",
    position: "right",
  },
];

export default function IntroduceSection() {
  return (
    <Wrapper>
      <Title>INTRODUCE</Title>

      <BubbleList>
        {bubbles.map((bubble, index) => (
          <Bubble key={index} $position={bubble.position}>
            “{bubble.text}”
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
`;

const BubbleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 52px;
`;

const Bubble = styled.div<{ $position: string }>`
  width: fit-content;
  max-width: 630px;
  padding: 18px 42px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: #55ff78;
  font-size: 14px;
  line-height: 1.6;

  margin-left: ${({ $position }) => ($position === "right" ? "360px" : "0")};
`;
