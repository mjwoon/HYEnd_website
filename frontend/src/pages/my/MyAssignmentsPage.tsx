import styled from 'styled-components';

export default function MyAssignmentsPage() {
  return (
    <Wrapper>
      <Icon>📋</Icon>
      <Title>과제 관리</Title>
      <Desc>과제 및 할 일 관리 기능을 준비 중입니다.</Desc>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  gap: 16px;
`;

const Icon = styled.div`font-size: 48px;`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
`;

const Desc = styled.p`
  font-size: 1rem;
  color: #6B7280;
`;
