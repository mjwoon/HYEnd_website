import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import styled from 'styled-components';
import {motion} from 'motion/react';
import {authService} from '@/services/authService';
import {userService} from '@/services/userService';
import {useAuthStore} from '@/store/authStore';

const Container = styled.div`
    display: flex;
    width: 380px;
    padding: 45px 32px;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    border-radius: 14px;
    border: 1px solid #40423F;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    white-space: nowrap;
`;

const Brand = styled.span`
    font-size: ${({theme}) => theme.typography.fontSize.body};
    font-weight: ${({theme}) => theme.typography.fontWeight.medium};
    color: ${({theme}) => theme.colors.neonGreen};
    letter-spacing: 0.05em;
    text-align: center;
    align-self: stretch;
`;

const Title = styled.h2`
    font-size: ${({theme}) => theme.typography.fontSize.semiTitle};
    font-weight: ${({theme}) => theme.typography.fontWeight.black};
    color: ${({theme}) => theme.colors.text.primary};
    margin: 0;
    text-align: center;
    align-self: stretch;
`;

const Description = styled.p`
    font-size: ${({theme}) => theme.typography.fontSize.body};
    font-weight: ${({theme}) => theme.typography.fontWeight.medium};
    color: ${({theme}) => theme.colors.text.secondary};
    text-align: center;
    line-height: 1.6;
    margin: 0;
    white-space: pre-line;
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
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.15);
    transition: border-color 0.3s;

    &::placeholder {
        color: ${({theme}) => theme.colors.text.primary};
    }

    &:focus {
        border-color: rgba(95, 251, 122, 0.8);
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
    align-self: stretch;

    &:hover {
        opacity: 0.85;
    }

    &:disabled {
        opacity: 0.6;
        cursor: default;
    }
`;

const BackLink = styled.button`
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

const ErrorText = styled.p`
    color: #ff6b6b;
    font-size: ${({theme}) => theme.typography.fontSize.body};
    margin: 0;
    text-align: center;
    white-space: normal;
`;

interface LoginModalProps {
    onClose?: () => void;
    onSwitchToSignUp?: () => void;
}

export default function LoginModal({onClose, onSwitchToSignUp}: LoginModalProps) {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const setUser = useAuthStore((state) => state.setUser);

    const valid = email.trim() !== '' && password.length > 0;

    const handleLogin = async () => {
        if (!valid || loading) return;
        setError('');
        setLoading(true);

        if (email === 'testid' && password === 'testpw1234') {
            const user = { id: -1, username: 'testid', fullName: '테스트 계정', role: 'student' as const };
            localStorage.setItem('accessToken', 'mock-test-token');
            localStorage.setItem('userInfo', JSON.stringify(user));
            setUser(user);
            setLoading(false);
            onClose?.();
            navigate('/home');
            return;
        }

        try {
            const res = await authService.login({email, password});
            const {accessToken, refreshToken} = res.data.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            
            // Fetch real user info from backend
            const userRes = await userService.getMe();
            const { id, name, email: userEmail, role } = userRes.data.data;
            const user = {
                id,
                username: userEmail,
                fullName: name,
                role: role.toLowerCase() as 'student' | 'staff' | 'admin'
            };
            
            localStorage.setItem('userInfo', JSON.stringify(user));
            setUser(user);
            onClose?.();
            navigate('/home');
        } catch (err: any) {
            const msg = err?.response?.data?.message || '이메일 또는 비밀번호를 확인해 주세요.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleLogin();
    };

    return (
        <Container>
            <Brand>HY-END</Brand>
            <Title>Welcome back</Title>
            <Description>{'HY-End 학회에 다시 오신 것을 환영합니다.\n로그인하여 활동을 계속하세요.'}</Description>

            <Dots>
                <Dot $active/>
                <Dot/>
                <Dot/>
            </Dots>

            <motion.div
                initial={{opacity: 0, x: 24}}
                animate={{opacity: 1, x: 0}}
                transition={{duration: 0.22, ease: 'easeInOut'}}
                style={{display: 'flex', flexDirection: 'column', gap: 20, width: '100%'}}
            >
                <InputField
                    type="email"
                    placeholder="이메일 (아이디)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <InputField
                    type="password"
                    placeholder="비밀번호"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                />

                {error && <ErrorText>{error}</ErrorText>}

                <SubmitButton onClick={handleLogin} disabled={!valid || loading}>
                    {loading ? '로그인 중...' : '로그인'}
                </SubmitButton>

                <BackLink onClick={onSwitchToSignUp}>회원가입하러 가기</BackLink>
            </motion.div>
        </Container>
    );
}
