import styled from 'styled-components';

const Container = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 0;
  pointer-events: none;
  width: 900px;
  height: 900px;
`;

const Circle = styled.div<{ size: number }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: transparent;
`;

export default function BackgroundCircles() {
  return (
    <Container>
      <Circle size={900} />
      <Circle size={650} />
      <Circle size={450} />
    </Container>
  );
}
