import styled from 'styled-components';

export default function ContactPage() {
  return (
    <Wrapper>
      <HeroArea>
        <MainTitle>HY-END</MainTitle>
        <SubTitle>함께 배우고 함께 성장하는 개발 학회</SubTitle>
      </HeroArea>

      <FormCard>
        <SmallTitle>HY-END</SmallTitle>
        <FormTitle>Contact us</FormTitle>
        <Description>
          HY-End 학회와 함께 성장하고, 배움의 기회를 만들어 보세요.
          <br />
          새로운 도전이 기다리고 있습니다.
        </Description>

        <Form>
          <Row>
            <Input type="text" placeholder="이름" />
            <Input type="tel" placeholder="전화번호" />
          </Row>
          <Input type="email" placeholder="이메일" />
          <Textarea placeholder="설명" />
          <CheckIcon>✓</CheckIcon>
          <SubmitButton type="button">submit</SubmitButton>
        </Form>
      </FormCard>
    </Wrapper>
  );
}

const Wrapper = styled.section`
  position: relative;
  min-height: calc(100vh - 80px);
  overflow: hidden;
  color: #ffffff;
  display: grid;
  grid-template-columns: 1.08fr 0.92fr;
  align-items: center;
  gap: 62px;
  padding: 92px 7vw 86px;
`;


const HeroArea = styled.div`
  position: relative;
  z-index: 2;
  transform: translateY(-34px);
`;

const MainTitle = styled.h1`
  margin: 0 0 16px;
  color: #55ff74;
  font-size: 74px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.04em;
  text-shadow:
    0 0 8px rgba(85, 255, 116, 0.95),
    0 0 24px rgba(85, 255, 116, 0.55),
    0 0 44px rgba(85, 255, 116, 0.28);
`;

const SubTitle = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.96);
  font-size: 28px;
  font-weight: 400;
  line-height: 1.35;
  letter-spacing: 0.05em;
`;

const FormCard = styled.div`
  position: relative;
  z-index: 2;
  width: min(530px, 100%);
  justify-self: center;
  padding: 40px 44px 44px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 45px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(8px);
  text-align: center;
`;

const SmallTitle = styled.p`
  margin: 0 0 18px;
  color: #55ff74;
  font-size: 16px;
  font-weight: 500;
  line-height: 1;
`;

const FormTitle = styled.h2`
  margin: 0 0 22px;
  color: #ffffff;
  font-size: 34px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
`;

const Description = styled.p`
  margin: 0 0 24px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 14px;
  font-weight: 400;
  line-height: 1.45;
  letter-spacing: -0.04em;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
`;

const Input = styled.input`
  width: 100%;
  height: 40px;
  padding: 0 16px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 12px;
  outline: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.48);
  }

  &:focus {
    border-color: rgba(85, 255, 116, 0.75);
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  height: 88px;
  resize: none;
  padding: 18px 16px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 12px;
  outline: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.48);
  }

  &:focus {
    border-color: rgba(85, 255, 116, 0.75);
  }
`;

const CheckIcon = styled.div`
  width: 22px;
  height: 22px;
  margin: 0 auto;
  border-radius: 50%;
  background: #55ff74;
  color: #050606;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 800;
  line-height: 1;
`;

const SubmitButton = styled.button`
  width: 100%;
  height: 40px;
  border: 0;
  border-radius: 6px;
  background: #55ff74;
  color: #050606;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
`;
