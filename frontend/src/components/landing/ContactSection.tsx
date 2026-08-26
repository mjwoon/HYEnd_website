import styled, { keyframes, css } from 'styled-components';

const contacts = [
  '회장 이인섭 / 010-4696-0114',
  '부회장 강준우 / 010-3133-2924',
  '회계부 이재림 / 010-2881-8527',
];

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const titleIn = keyframes`
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const ContactSection = () => {
  return (
    <Section>
      <Content>
        <Title>Executive Team Contact</Title>
        <ContactList>
          {contacts.map((contact, idx) => (
            <ContactItem key={contact} $index={idx}>{contact}</ContactItem>
          ))}
        </ContactList>
      </Content>
    </Section>
  );
};

export default ContactSection;

const Section = styled.section`
  position: relative;
  min-height: calc(100vh - 80px);
  overflow: hidden;
  //background: #050606;
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
    0 0 10px rgba(85,255,116,0.95),
    0 0 24px rgba(85,255,116,0.55),
    0 0 42px rgba(85,255,116,0.22);
  animation: ${titleIn} 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
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

const ContactItem = styled.li<{ $index: number }>`
  font-size: clamp(20px, 1.8vw, 27px);
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: -0.04em;
  color: rgba(255, 255, 255, 0.96);
  ${({ $index }) => css`
    animation: ${fadeUp} 0.55s cubic-bezier(0.22, 1, 0.36, 1) ${0.12 + $index * 0.1}s both;
  `}
  transition: color 0.2s ease, letter-spacing 0.2s ease;
  &:hover {
    color: #55ff78;
    letter-spacing: -0.02em;
  }
`;

// const Footer = styled.footer`
//   position: absolute;
//   left: 0; right: 0; bottom: 0;
//   z-index: 4;
//   height: 58px;
//   padding: 0 34px;
//   border-top: 1px solid rgba(255, 255, 255, 0.08);
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
//   background: rgba(5, 6, 6, 0.94);
// `;
//
// const Copyright = styled.p`
//   margin: 0;
//   font-size: 12px;
//   font-weight: 400;
//   color: rgba(255, 255, 255, 0.62);
// `;
//
// const SnsGroup = styled.div`
//   display: flex;
//   align-items: center;
//   gap: 10px;
// `;
//
// const SnsButton = styled.button`
//   width: 24px;
//   height: 24px;
//   border-radius: 6px;
//   border: 1px solid rgba(255, 255, 255, 0.18);
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   color: rgba(255, 255, 255, 0.9);
//   background: transparent;
//   font-size: 12px;
//   line-height: 1;
//   transition: border-color 0.2s ease, background 0.2s ease;
//   &:hover {
//     border-color: rgba(85, 255, 120, 0.6);
//     background: rgba(85, 255, 120, 0.1);
//   }
// `;
