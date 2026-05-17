import { useState } from 'react';
import styled from 'styled-components';

type GalleryItem = {
  title: string;
  description: string;
  image: string;
  isEmpty?: boolean;
};

const galleryItems: GalleryItem[] = [
  {
    title: '개강총회',
    description: '새로운 학회원들과 만나\n‘하이엔드’ 라는 학회를 소개하고 앞으로의 활동 계획을 \n안내하는 시간입니다.',
    image: '/images/gallery/opening.png',
  },
  {
    title: '개강총회 뒤풀이',
    description: '설명회가 끝난 후 편하게\n이야기하며 서로 알아가는 \n친목 활동의 시간을 \n마련합니다.',
    image: '/images/gallery/after-meeting.png',
  },
  {
    title: '',
    description: '',
    image: '',
    isEmpty: true,
  },
  {
    title: '',
    description: '',
    image: '',
    isEmpty: true,
  },
];

const emptyGalleryItem: GalleryItem = {
  title: '',
  description: '',
  image: '',
  isEmpty: true,
};

export default function GalleryPage() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const visibleItems: GalleryItem[] = [
    galleryItems[currentIndex] ?? emptyGalleryItem,
    galleryItems[(currentIndex + 1) % galleryItems.length] ?? emptyGalleryItem,
  ];

  return (
    <Wrapper>
      <Content>
        <Title>ABOUT HY-END</Title>

        <GalleryGrid>
          {visibleItems.map((item, index) => (
            <GalleryCard key={`${currentIndex}-${index}`}>
              {item.isEmpty ? (
                <EmptyCard />
              ) : (
                <>
                  <ImageBox>
                    <GalleryImage src={item.image} alt={item.title} />
                  </ImageBox>
                  <TextBox>
                    <CardTitle>· {item.title}</CardTitle>
                    <CardText>{item.description}</CardText>
                  </TextBox>
                </>
              )}
            </GalleryCard>
          ))}
        </GalleryGrid>

        <Dots>
          {galleryItems.map((_, index) => (
            <DotButton
              key={index}
              type="button"
              aria-label={`gallery ${index + 1}`}
              className={currentIndex === index ? 'active' : ''}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </Dots>
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
  padding: 110px 5vw 86px;
`;

const Content = styled.div`
  position: relative;
  z-index: 2;
  width: min(1360px, 100%);
  transform: translateY(8px);
`;

const Title = styled.h1`
  margin: 0 0 34px;
  color: #55ff74;
  font-size: 64px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.045em;
  text-shadow:
    0 0 10px rgba(85, 255, 116, 0.75),
    0 0 28px rgba(85, 255, 116, 0.24);
`;

const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 88px;
`;

const GalleryCard = styled.article`
  height: 405px;
  padding: 20px 18px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  display: grid;
  grid-template-columns: 58% 42%;
  align-items: center;
  gap: 26px;
  backdrop-filter: blur(6px);
`;

const ImageBox = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.06);
`;

const GalleryImage = styled.img`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
`;

const TextBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  text-align: left;
  padding-right: 12px;
`;

const CardTitle = styled.h2`
  margin: 0 0 24px;
  color: #ffffff;
  font-size: 21px;
  font-weight: 500;
  line-height: 1.25;
  letter-spacing: -0.045em;
`;

const CardText = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.94);
  font-size: 18px;
  font-weight: 400;
  line-height: 1.32;
  letter-spacing: -0.055em;
  white-space: pre-line;
`;

const EmptyCard = styled.div`
  grid-column: 1 / -1;
  width: 100%;
  height: 100%;
`;

const Dots = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 74px;
`;

const DotButton = styled.button`
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: transparent;
  padding: 0;
  cursor: pointer;

  &.active {
    border-color: #55ff74;
    background: #55ff74;
    box-shadow: 0 0 10px rgba(85, 255, 116, 0.8);
  }
`;
