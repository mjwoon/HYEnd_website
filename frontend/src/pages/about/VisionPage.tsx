import styled from 'styled-components';

const goals = [
  {
    icon: '</>',
    title: '체계적 스터디',
    description: '체계적인 커리큘럼과 스터디\n활동을 통해 실력을 키웁니다.',
  },
  {
    icon: '🚀',
    title: '실전 프로젝트',
    description: '다양한 프로젝트 경험으로\n실무 역량을 강화합니다.',
  },
  {
    icon: '👥',
    title: '성장 환경',
    description: '구성원들이 스스로 성장할 수 있는\n환경을 제공합니다.',
  },
];

export default function VisionPage() {
  return (
    <Wrapper>
      <Content>
        <VisionArea>
          <SectionTitle>VISION</SectionTitle>
          <VisionText>
            끊임없는 학습과 도전으로,
            <br />
            <Highlight>함께 성장</Highlight>하는 하이엔드를 만들어갑니다.
          </VisionText>
        </VisionArea>

        <GoalArea>
          <SectionTitle>GOALS</SectionTitle>
          <GoalGrid>
            {goals.map((goal) => (
              <GoalCard key={goal.title}>
                <Icon>{goal.icon}</Icon>
                <CardTitle>{goal.title}</CardTitle>
                <CardText>{goal.description}</CardText>
              </GoalCard>
            ))}
          </GoalGrid>
        </GoalArea>
      </Content>
    </Wrapper>
  );
}

const Wrapper = styled.section`
  position: relative;
  width: 100%;
  min-height: 100%;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 92px 8vw 70px;
`;

const Content = styled.div`
  position: relative;
  z-index: 2;
  width: min(980px, 100%);
  text-align: center;
  transform: translateY(12px);
`;

const VisionArea = styled.div`
  margin-bottom: 56px;
`;

const SectionTitle = styled.h1`
  width: fit-content;
  margin: 0 auto 30px;
  padding-bottom: 8px;
  color: #55ff74;
  font-size: 32px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.04em;
  border-bottom: 1px solid rgba(85, 255, 116, 0.75);
`;

const VisionText = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.96);
  font-size: 24px;
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: -0.05em;
`;

const Highlight = styled.span`
  color: #55ff74;
`;

const GoalArea = styled.div``;

const GoalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 42px;
`;

const GoalCard = styled.article`
  height: 232px;
  padding: 34px 26px 28px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  backdrop-filter: blur(6px);
`;

const Icon = styled.div`
  height: 44px;
  margin-bottom: 16px;
  color: #55ff74;
  font-size: 30px;
  font-weight: 400;
  line-height: 1;
`;

const CardTitle = styled.h2`
  margin: 0 0 24px;
  color: #ffffff;
  font-size: 21px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.045em;
`;

const CardText = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  font-weight: 500;
  line-height: 1.45;
  letter-spacing: -0.045em;
  white-space: pre-line;
`;
