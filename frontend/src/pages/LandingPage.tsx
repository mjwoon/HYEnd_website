import IntroduceSection from '@/components/landing/IntroduceSection';
import ExhibitionSection from '@/components/landing/ExhibitionSection';
import ContactSection from '@/components/landing/ContactSection';
import { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useModal } from '@/hooks/useModal';
import Modal from '@/components/common/Modal';
import LoginModal from '@/components/common/LoginModal';
import SignUpModal from '@/components/common/SignUpModal';
import { useAuthStore } from '@/store/authStore';

type SlideItem = {
    id: 'home' | 'introduce' | 'exhibition' | 'contact';
    title: string;
    highlight: string;
    description: string;
};

const slides: SlideItem[] = [
    { id: 'home',       title: 'WELCOME TO',    highlight: 'HY-END',          description: '함께 성장하는 HY-END 전시 플랫폼' },
    { id: 'introduce',  title: 'INTRODUCE',     highlight: 'HY-END',          description: '소개 내용을 이곳에 넣어주세요.' },
    { id: 'exhibition', title: 'HY-END',        highlight: 'Exhibition Space', description: '전시 공간과 프로젝트 이미지를 보여주는 영역입니다.' },
    { id: 'contact',    title: 'Executive Team', highlight: 'Contact',         description: '운영진 연락처를 확인할 수 있는 영역입니다.' },
];

// ─── Keyframes ────────────────────────────────────────────
const slideInFromRight = keyframes`
  from { opacity: 0; transform: translateX(72px); }
  to   { opacity: 1; transform: translateX(0); }
`;
const slideInFromLeft = keyframes`
  from { opacity: 0; transform: translateX(-72px); }
  to   { opacity: 1; transform: translateX(0); }
`;
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const pulseRing = keyframes`
  0%, 100% { opacity: 0.07; transform: translate(-50%, -50%) scale(1); }
  50%       { opacity: 0.13; transform: translate(-50%, -50%) scale(1.018); }
`;
const glowPulse = keyframes`
  0%, 100% { text-shadow: 0 0 10px rgba(85,255,120,0.95), 0 0 24px rgba(85,255,120,0.75), 0 0 42px rgba(85,255,120,0.5); }
  50%       { text-shadow: 0 0 16px rgba(85,255,120,1),   0 0 40px rgba(85,255,120,0.9),  0 0 70px rgba(85,255,120,0.7); }
`;

export default function LandingPage() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState<'left' | 'right'>('right');
    const loginModal  = useModal();
    const signUpModal = useModal();
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const currentSlide = slides[currentIndex]!;

    const goToPrevSlide = () => {
        setDirection('left');
        setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    };
    const goToNextSlide = () => {
        setDirection('right');
        setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    };
    const goToSlide = (idx: number) => {
        setDirection(idx > currentIndex ? 'right' : 'left');
        setCurrentIndex(idx);
    };

    return (
        <Wrapper>
            <ArrowButton $left onClick={goToPrevSlide} aria-label="previous slide">‹</ArrowButton>

            <Slide>
                <Circle />

                <AnimatedContainer key={currentIndex} $direction={direction}>
                    {currentSlide.id === 'introduce' ? (
                        <IntroducePosition>
                            <IntroduceSection />
                        </IntroducePosition>
                    ) : currentSlide.id === 'exhibition' ? (
                        <ExhibitionPosition>
                            <ExhibitionSection />
                        </ExhibitionPosition>
                    ) : currentSlide.id === 'contact' ? (
                        <ContactPosition>
                            <ContactSection />
                        </ContactPosition>
                    ) : (
                        <Content>
                            <TopDots>
                                {slides.map((slide, index) => (
                                    <Dot key={`top-${slide.id}`} $active={index === currentIndex} onClick={() => goToSlide(index)} />
                                ))}
                            </TopDots>
                            <Title>{ currentSlide.title}</Title>
                            <Highlight>{currentSlide.highlight}</Highlight>
                            {!isAuthenticated && (
                                <ButtonGroup>
                                    <SmallButton type="button" onClick={loginModal.open}>로그인</SmallButton>
                                    <PrimaryButton type="button" onClick={signUpModal.open}>회원가입</PrimaryButton>
                                </ButtonGroup>
                            )}
                        </Content>
                    )}
                </AnimatedContainer>
            </Slide>

            <ArrowButton onClick={goToNextSlide} aria-label="next slide">›</ArrowButton>

            <Dots $isHome={currentSlide.id === 'home'}>
                {slides.map((slide, index) => (
                    <Dot key={slide.id} $active={index === currentIndex} onClick={() => goToSlide(index)} />
                ))}
            </Dots>
            <Modal isOpen={loginModal.isOpen} onClose={loginModal.close} blur>
                <LoginModal
                    onClose={loginModal.close}
                    onSwitchToSignUp={() => { loginModal.close(); signUpModal.open(); }}
                />
            </Modal>
            <Modal isOpen={signUpModal.isOpen} onClose={signUpModal.close} blur>
                <SignUpModal onSwitchToLogin={() => { signUpModal.close(); loginModal.open(); }} />
            </Modal>
        </Wrapper>
    );
}

// ─── Styled Components ────────────────────────────────────

const Wrapper = styled.main`
    position: relative;
    width: 100%;
    height: calc(100vh - 68px - 48px);
    min-height: 640px;
    overflow: hidden;
    //background: #050505;
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

const AnimatedContainer = styled.div<{ $direction: 'left' | 'right' }>`
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    ${({ $direction }) => css`
        animation: ${$direction === 'right' ? slideInFromRight : slideInFromLeft}
            0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
    `}
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
    animation: ${pulseRing} 6s ease-in-out infinite;

    &::before, &::after {
        content: '';
        position: absolute;
        border-radius: 50%;
        border: 3px solid rgba(255, 255, 255, 0.07);
    }
    &::before { inset: 125px; animation: ${pulseRing} 7s ease-in-out infinite reverse; }
    &::after  { inset: 260px; animation: ${pulseRing} 5s ease-in-out infinite 1s; }
`;

const IntroducePosition = styled.div`
    position: relative;
    z-index: 2;
    width: 100%;
    display: flex;
    justify-content: center;
    transform: translateY(-25px);
`;

const ExhibitionPosition = styled.div`
    position: absolute;
    inset: 0;
    z-index: 2;
    width: 100%;
    height: 100%;
`;

const ContactPosition = styled.div`
    position: absolute;
    inset: 0;
    z-index: 2;
    width: 100%;
    height: 100%;
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
    animation: ${fadeUp} 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.05s both;
`;

const Highlight = styled.h1`
    margin: 22px 0 0;
    color: #55ff78;
    font-size: 86px;
    line-height: 1;
    font-weight: 900;
    letter-spacing: 3px;
    animation: ${fadeUp} 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both,
               ${glowPulse} 3.5s ease-in-out 0.65s infinite;
`;

const ButtonGroup = styled.div`
    display: flex;
    justify-content: center;
    gap: 32px;
    margin-top: 72px;
    animation: ${fadeUp} 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.28s both;
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
    transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
    &:hover {
        background: rgba(85,255,120,0.1);
        box-shadow: 0 0 18px rgba(85,255,120,0.45);
        transform: translateY(-2px);
    }
`;

const PrimaryButton = styled(SmallButton)`
    background: #55ff78;
    color: #050505;
    &:hover {
        background: #7fff9a;
        box-shadow: 0 0 24px rgba(85,255,120,0.7);
        transform: translateY(-2px);
    }
`;

const ArrowButton = styled.button<{ $left?: boolean }>`
    position: absolute;
    top: 50%;
    ${(props) => (props.$left ? 'left: 70px;' : 'right: 70px;')}
    z-index: 5;
    transform: translateY(-50%);
    border: none;
    background: transparent;
    color: #55ff78;
    font-size: 34px;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.2s ease, transform 0.2s ease, text-shadow 0.2s ease;
    &:hover {
        opacity: 1;
        transform: translateY(-50%) scale(1.2);
        text-shadow: 0 0 16px rgba(85,255,120,0.9), 0 0 32px rgba(85,255,120,0.5);
    }
`;

const Dots = styled.div<{ $isHome: boolean }>`
    position: absolute;
    left: 50%;
    bottom: ${({ $isHome }) => ($isHome ? '306px' : '24px')};
    z-index: 20;
    display: flex;
    gap: 14px;
    transform: translateX(-50%);
`;

const Dot = styled.button<{ $active: boolean }>`
    width: 11px;
    height: 11px;
    border: 1px solid ${(props) => (props.$active ? '#55ff78' : 'rgba(255,255,255,0.42)')};
    border-radius: 50%;
    background: ${(props) => (props.$active ? '#55ff78' : 'transparent')};
    box-shadow: ${(props) => (props.$active ? '0 0 8px rgba(85,255,120,0.8)' : 'none')};
    cursor: pointer;
    transition: background 0.3s ease, border 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease;
    &:hover { transform: scale(1.3); }
`;

const TopDots = styled.div`
    display: flex;
    gap: 14px;
    margin-bottom: 34px;
    animation: ${fadeUp} 0.4s ease both;
`;