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
          <IntroducePosition>
            <IntroduceSection />
          </IntroducePosition>
        ) : (
          <Content>
            {currentSlide.id === 'home' && (
              <TopDots>
                {slides.map((slide, index) => (
                  <Dot
                    key={`top-${slide.id}`}
                    $active={index === currentIndex}
                    onClick={() => setCurrentIndex(index)}
                    aria-label={`${index + 1}번 슬라이드로 이동`}
                  />
                ))}
              </TopDots>
            )}
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

      <Dots $isHome={currentSlide.id === 'home'}>
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
  padding: 0 80px 44px;
`;

const Circle = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 820px;
  height: 820px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.07);
  opacity: 0.9;

  &::before,
  &::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.07);
  }

  &::before {
    inset: 125px;
  }

  &::after {
    inset: 260px;
  }
`;

const IntroducePosition = styled.div`
  position: relative;
  z-index: 2;
  width: 100%;
  display: flex;
  justify-content: center;
  transform: translateY(-25px);
`;

const Content = styled.div`
  position: relative;
  z-index: 2;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.p`
  margin: 34px 0 0;
  font-size: 72px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: -2px;
  color: transparent;
  -webkit-text-stroke: 1px rgba(255, 255, 255, 0.28);
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.08);
`;

const Highlight = styled.h1`
  margin: 22px 0 0;
  color: #55ff78;
  font-size: 86px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: 3px;
  text-shadow:
    0 0 10px rgba(85, 255, 120, 0.95),
    0 0 24px rgba(85, 255, 120, 0.75),
    0 0 42px rgba(85, 255, 120, 0.5);
`;

const Description = styled.p`
  display: none;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-top: 72px;
`;

const SmallButton = styled.button`
  min-width: 106px;
  height: 48px;
  padding: 0 28px;
  border: 2px solid #55ff78;
  border-radius: 6px;
  background: transparent;
  color: #55ff78;
  font-size: 17px;
  font-weight: 700;
`;

const PrimaryButton = styled(SmallButton)`
  background: #55ff78;
  color: #050505;
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

const Dots = styled.div<{ $isHome: boolean }>`
  position: absolute;
  left: 50%;
  bottom: ${({ $isHome }) => ($isHome ? '306px' : '24px')};
  z-index: 10;
  display: flex;
  gap: 14px;
  transform: translateX(-50%);
`;

const Dot = styled.button<{ $active: boolean }>`
  width: 11px;
  height: 11px;
  border: 1px solid ${(props) => (props.$active ? '#55ff78' : 'rgba(255, 255, 255, 0.42)')};
  border-radius: 50%;
  background: ${(props) => (props.$active ? '#55ff78' : 'transparent')};
  cursor: pointer;
`;

const TopDots = styled.div`
  display: flex;
  gap: 14px;
  margin-bottom: 34px;
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
