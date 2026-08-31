import styled from 'styled-components';

interface Props {
    onClose: () => void;
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.40);
  backdrop-filter: blur(15px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  `;

const Card = styled.div`
  display: flex;
  width: 646px;
  padding: 20px;
  border-radius: 14px;
  border: 1px solid #40423F;
  background: #181818;
  color: #fff;
  flex-direction: column;
  gap: 20px;
`;

const Title = styled.h2`
  font-family: "Pretendard Variable";
  font-size: 18px;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
`;

const Content = styled.div`
  padding: 10px 20px;
  border-radius: 14px;
  border: 1px solid #40423F;
  background: rgba(255,255,255,0.02);
  display:  flex;
  flex-direction: column;
  align-self: stretch;
  gap: 16px;
`;

const Text = styled.p`
  font-family: "Pretendard Variable";
  align-self: stretch;
  font-size: 12px;
  font-weight: 600;
  color: #CCC;
  line-height: normal;
  margin: 0;
`;

export function GuideModal({ onClose }: Props) {
    return (
        <Overlay onClick={onClose}>
            <Card onClick={(e) => e.stopPropagation()}>
                <Title>📚 도서 대여 방법 안내</Title>
                <Content>
                    <Text>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</Text>
                    <Text>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</Text>
                    <Text>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</Text>
                </Content>
            </Card>
        </Overlay>
    );
}