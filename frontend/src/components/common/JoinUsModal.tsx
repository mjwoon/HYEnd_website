import styled from 'styled-components';

const Container = styled.div`
    display: flex;
    width: 380px;
    padding: 45px 32px;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    border-radius: 14px;
    border: 1px solid #40423F;
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(4px);
    white-space: nowrap;
`;

const Brand = styled.span`
    font-size: ${({theme}) => theme.typography.fontSize.body};
    font-weight: ${({theme}) => theme.typography.fontWeight.medium};
    color: ${({theme}) => theme.colors.neonGreen};
    letter-spacing: 0.05em;
    text-align: center;
    font-style: normal;
    line-height: normal;
    align-self: stretch;
`;

const Title = styled.h2`
    font-size: ${({theme}) => theme.typography.fontSize.semiTitle};
    font-weight: ${({theme}) => theme.typography.fontWeight.black};
    color: ${({theme}) => theme.colors.text.primary};
    margin: 0;
    text-align: center;
    font-style: normal;
    line-height: normal;
    align-self: stretch;
`;

const Description = styled.p`
    font-size: ${({theme}) => theme.typography.fontSize.body};
    font-weight: ${({theme}) => theme.typography.fontWeight.medium};
    color: ${({theme}) => theme.colors.text.secondary};
    text-align: center;
    line-height: 1.6;
    margin: 0;
`;

const Dots = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
`;

const Dot = styled.span<{ $active?: boolean }>`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({$active, theme}) =>
            $active ? theme.colors.neonGreen : 'rgba(255, 255, 255, 0.25)'};
`;

const InputField = styled.input`
    width: 100%;
    border: 1px solid rgba(255, 255, 255, 0.32);
    color: ${({theme}) => theme.colors.text.primary};
    font-family: ${({theme}) => theme.typography.fontFamily};
    font-size: ${({theme}) => theme.typography.fontSize.body};
    font-weight: ${({theme}) => theme.typography.fontWeight.medium};
    outline: none;
    box-sizing: border-box;
    
    display: flex;
    height: 48px;
    padding: 15px 20px;
    align-items: center;
    gap: 10px;
    align-self: stretch;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.10);

    transition: border-color 0.3s;

    &::placeholder {
        color: ${({theme}) => theme.colors.text.secondary};
    }

    &:focus {
        border-color: rgba(95, 251, 122, 0.5);
    }
`;

const SubmitButton = styled.button`
    width: 100%;
    background: ${({theme}) => theme.colors.neonGreen};
    color: #000;
    border: none;
    border-radius: 8px;
    font-family: ${({theme}) => theme.typography.fontFamily};
    font-size: ${({theme}) => theme.typography.fontSize.bodyMax};
    font-weight: ${({theme}) => theme.typography.fontWeight.bold};
    cursor: pointer;
    transition: opacity 0.2s;

    display: flex;
    height: 48px;
    padding: 15px 20px;
    justify-content: center;
    align-items: center;
    gap: 10px;
    align-self: stretch;

    &:hover {
        opacity: 0.85;
    }
`;

const LoginLink = styled.button`
    background: none;
    border: none;
    font-family: ${({theme}) => theme.typography.fontFamily};
    font-size: ${({theme}) => theme.typography.fontSize.body};
    font-weight: ${({theme}) => theme.typography.fontWeight.medium};
    color: ${({theme}) => theme.colors.neonGreen};
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
    padding: 0;

    &:hover {
        opacity: 0.8;
    }
`;

interface JoinUsModalProps {
    onSwitchToLogin?: () => void;
}

export default function JoinUsModal({onSwitchToLogin}: JoinUsModalProps) {
    return (
        <Container>
            <Brand>HY-END</Brand>
            <Title>Join us</Title>
            <Description>
                HY-End 학회와 함께 성장하고, 배움의 기회를 만들어 보세요.
                <br/>
                새로운 도전이 기다리고 있습니다.
            </Description>
            <Dots>
                <Dot $active/>
                <Dot/>
                <Dot/>
            </Dots>
            <InputField type="email" placeholder="이메일 (아이디)"/>
            <InputField type="password" placeholder="비밀번호"/>
            <SubmitButton>다음</SubmitButton>
            <LoginLink onClick={onSwitchToLogin}>로그인 하기</LoginLink>
        </Container>
    );
}
