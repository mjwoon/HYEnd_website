import IntroduceSection from '@/components/landing/IntroduceSection';
import { useState } from 'react';
import styled from 'styled-components';

type SlideItem = {
  id: 'home' | 'introduce' | 'exhibition' | 'contact';
  title: string;
  highlight: string;
  description: string;
};

const slides: SlideItem[] = [
  {
    id: 'home',
    title: 'WELCOME TO',
    highlight: 'HY-END',
    description: '함께 성장하는 HY-END 전시 플랫폼',
  },
  {
    id: 'introduce',
    title: 'INTRODUCE',
    highlight: 'HY-END',
    description: '소개 내용을 이곳에 넣어주세요.',
  },
  {
    id: 'exhibition',
    title: 'HY-END',
    highlight: 'Exhibition Space',
    description: '전시 공간과 프로젝트 이미지를 보여주는 영역입니다.',
  },
  {
    id: 'contact',
    title: 'Executive Team',
    highlight: 'Contact',
    description: '운영진 연락처를 확인할 수 있는 영역입니다.',
  },
];

export default function LandingPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentSlide = slides[currentIndex]!;

  const goToPrevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToNextSlide = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  return (
    <Wrapper>
      <ArrowButton $left onClick={goToPrevSlide} aria-label="previous slide">
        ‹
      </ArrowButton>

      <Slide>
        <Circle />
        {currentSlide.id === 'introduce' ? (
          <IntroduceSection />
        ) : (
          <Content>
            <Title>{currentSlide.title}</Title>
            <Highlight>{currentSlide.highlight}</Highlight>
            <Description>{currentSlide.description}</Description>

            {currentSlide.id === 'home' && (
              <ButtonGroup>
                <SmallButton type="button">로그인</SmallButton>
                <PrimaryButton type="button">회원가입</PrimaryButton>
              </ButtonGroup>
            )}
          </Content>
        )}
      </Slide>

      <ArrowButton onClick={goToNextSlide} aria-label="next slide">
        ›
      </ArrowButton>

      <Dots>
        {slides.map((slide, index) => (
          <Dot
            key={slide.id}
            $active={index === currentIndex}
            onClick={() => setCurrentIndex(index)}
            aria-label={`${index + 1}번 슬라이드로 이동`}
          />
        ))}
      </Dots>

      <FooterText>Copyright © HY-END. All rights reserved.</FooterText>
    </Wrapper>
  );
}

const Wrapper = styled.main`
  position: relative;
  width: 100%;
  height: calc(100vh - 68px);
  min-height: 640px;
  overflow: hidden;
  background: #050505;
  color: white;
`;

const Slide = styled.section`
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 80px 44px;
`;

const Circle = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 880px;
  height: 880px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.04);
  opacity: 0.9;

  &::before,
  &::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.11);
  }

  &::before {
    inset: 160px;
  }

  &::after {
    inset: 300px;
  }
`;

const Content = styled.div`
  position: relative;
  z-index: 2;
  text-align: center;
`;

const Title = styled.p`
  margin: 0;
  font-size: 42px;
  font-weight: 900;
  color: transparent;
  -webkit-text-stroke: 1px rgba(255, 255, 255, 0.35);
`;

const Highlight = styled.h1`
  margin: 8px 0 16px;
  color: #00ff66;
  font-size: 48px;
  font-weight: 900;
  text-shadow: 0 0 16px rgba(0, 255, 102, 0.8);
`;

const Description = styled.p`
  margin: 0 auto;
  max-width: 520px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 15px;
  line-height: 1.7;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 28px;
`;

const SmallButton = styled.button`
  padding: 8px 18px;
  border: 1px solid #00ff66;
  border-radius: 2px;
  background: transparent;
  color: #00ff66;
  font-size: 12px;
`;

const PrimaryButton = styled(SmallButton)`
  background: #00ff66;
  color: #050505;
  font-weight: 700;
`;

const ArrowButton = styled.button<{ $left?: boolean }>`
  position: absolute;
  top: 50%;
  ${(props) => (props.$left ? 'left: 70px;' : 'right: 70px;')}
  z-index: 5;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: #00ff66;
  font-size: 34px;
  cursor: pointer;
`;

const Dots = styled.div`
  position: absolute;
  left: 50%;
  bottom: 28px;
  z-index: 10;
  display: flex;
  gap: 8px;
  transform: translateX(-50%);
`;

const Dot = styled.button<{ $active: boolean }>`
  width: ${(props) => (props.$active ? '18px' : '6px')};
  height: 6px;
  border: none;
  border-radius: 999px;
  background: ${(props) => (props.$active ? '#00ff66' : 'rgba(255, 255, 255, 0.35)')};
  cursor: pointer;
`;

const FooterText = styled.p`
  position: absolute;
  left: 40px;
  bottom: 14px;
  z-index: 10;
  margin: 0;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.45);
`;
