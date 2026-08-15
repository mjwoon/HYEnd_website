import styled from 'styled-components';

const FullScreen = styled.div`
  width: 100vw;
  height: 100vh;
  background: #060606;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5FFB7A;
  font-size: 1.25rem;
`;

export default function MeetingRoomPage() {
  return <FullScreen>회의 중 (구현 예정)</FullScreen>;
}
