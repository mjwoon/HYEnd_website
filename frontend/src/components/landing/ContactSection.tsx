import styled from 'styled-components';

const contacts = [
  '회장 이인섭 / 010-4696-0114',
  '부회장 강준우 / 010-3133-2924',
  '회계부 이재림 / 010-2881-8527',
];

const ContactSection = () => {
  return (
    <Section>

      <Content>
        <Title>Executive Team Contact</Title>

        <ContactList>
          {contacts.map((contact) => (
            <ContactItem key={contact}>{contact}</ContactItem>
          ))}
        </ContactList>
      </Content>

      <Footer>
        <Copyright>
          Copyright © 2023 BRIX Templates | All Rights Reserved | hyend@afsldf.com
        </Copyright>
        <SnsGroup>
          <SnsButton aria-label="instagram">◎</SnsButton>
          <SnsButton aria-label="kakao talk">💬</SnsButton>
        </SnsGroup>
      </Footer>
    </Section>
  );
};

export default ContactSection;

const Section = styled.section`
  position: relative;
  min-height: calc(100vh - 80px);
  overflow: hidden;
  background: #050606;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 120px 24px 84px;
`;

const Content = styled.div`
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 900px;
  text-align: center;
  transform: translateY(-18px);
`;

const Title = styled.h1`
  margin: 0 0 72px;
  font-size: 64px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.04em;
  color: #55ff74;
  text-shadow:
    0 0 10px rgba(85, 255, 116, 0.95),
    0 0 24px rgba(85, 255, 116, 0.55),
    0 0 42px rgba(85, 255, 116, 0.22);
`;

const ContactList = styled.ul`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 42px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const ContactItem = styled.li`
  font-size: clamp(20px, 1.8vw, 27px);
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: -0.04em;
  color: rgba(255, 255, 255, 0.96);
`;

const Footer = styled.footer`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 4;
  height: 58px;
  padding: 0 34px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(5, 6, 6, 0.94);
`;

const Copyright = styled.p`
  margin: 0;
  font-size: 12px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.62);
`;

const SnsGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SnsButton = styled.button`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.9);
  background: transparent;
  font-size: 12px;
  line-height: 1;
`;
