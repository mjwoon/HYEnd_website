import {useState} from 'react';
import styled from 'styled-components';
import {AnimatePresence, motion} from 'motion/react';
import {authService} from '@/services/authService';

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
    color: ${({theme}) => theme.colors.text.primary};
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
    gap: 10px;
    align-self: stretch;
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

const SubmitButton = styled.button<{ $active?: boolean }>`
    width: 100%;
    background: ${({$active, theme}) => $active ? theme.colors.neonGreen : 'rgba(255,255,255,0.12)'};
    color: ${({$active}) => $active ? '#000' : 'rgba(255,255,255,0.4)'};
    border: none;
    border-radius: 8px;
    font-family: ${({theme}) => theme.typography.fontFamily};
    font-size: ${({theme}) => theme.typography.fontSize.bodyMax};
    font-weight: ${({theme}) => theme.typography.fontWeight.bold};
    cursor: ${({$active}) => $active ? 'pointer' : 'default'};
    transition: opacity 0.2s, background 0.2s, color 0.2s;

    display: flex;
    height: 48px;
    padding: 15px 20px;
    justify-content: center;
    align-items: center;
    gap: 10px;
    align-self: stretch;

    &:hover {
        opacity: ${({$active}) => $active ? 0.85 : 1};
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

const InfoBox = styled.div`
    width: 100%;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 16px 20px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

const InfoLabel = styled.span`
    font-size: ${({theme}) => theme.typography.fontSize.body};
    font-weight: ${({theme}) => theme.typography.fontWeight.bold};
    color: ${({theme}) => theme.colors.text.primary};
`;

const InfoValue = styled.span`
    font-size: ${({theme}) => theme.typography.fontSize.body};
    font-weight: ${({theme}) => theme.typography.fontWeight.medium};
    color: ${({theme}) => theme.colors.text.primary};
    white-space: pre-line;
    line-height: 1.7;
`;

const CheckRow = styled.label`
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    width: 100%;
`;

const Checkbox = styled.div<{ $checked: boolean }>`
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid ${({$checked, theme}) => $checked ? theme.colors.neonGreen : 'rgba(255,255,255,0.3)'};
    background: ${({$checked, theme}) => $checked ? theme.colors.neonGreen : 'transparent'};
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
    color: #000;
    font-size: 14px;
`;

const ErrorText = styled.p`
    color: #ff6b6b;
    font-size: ${({theme}) => theme.typography.fontSize.body};
    margin: 0;
    text-align: center;
    white-space: normal;
`;

interface SignUpModalProps {
    onSwitchToLogin?: () => void;
}

interface FormData {
    email: string;
    password: string;
    name: string;
    department: string;
    studentId: string;
}

const TOTAL_STEPS = 3;

export default function SignUpModal({onSwitchToLogin}: SignUpModalProps) {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState<FormData>({
        email: '',
        password: '',
        name: '',
        department: '',
        studentId: '',
    });
    const [paidConfirmed, setPaidConfirmed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    const update = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(prev => ({...prev, [field]: e.target.value}));

    const step1Valid = form.email.trim() !== '' && form.password.length >= 8;
    const step2Valid = form.name.trim() !== '';

    const handleNext = async () => {
        setError('');
        if (step === 1 && step1Valid) {
            setStep(2);
        } else if (step === 2 && step2Valid) {
            setStep(3);
        } else if (step === 3 && paidConfirmed) {
            setLoading(true);
            try {
                await authService.register({
                    email: form.email,
                    password: form.password,
                    name: form.name,
                    department: form.department || undefined,
                    studentId: form.studentId || undefined,
                });
                setDone(true);
            } catch (err: any) {
                const msg = err?.response?.data?.message || '회원가입에 실패했습니다.';
                setError(msg);
            } finally {
                setLoading(false);
            }
        }
    };

    if (done) {
        return (
            <Container>
                <Brand>HY-END</Brand>
                <Title>Join us</Title>
                <Description>{'회원가입이 완료되었습니다!\n로그인 후 이용해 주세요.'}</Description>
                <SubmitButton $active onClick={onSwitchToLogin}>로그인 하기</SubmitButton>
            </Container>
        );
    }

    const nextActive = step === 1 ? step1Valid : step === 2 ? step2Valid : paidConfirmed;

    return (
        <Container>
            <Brand>HY-END</Brand>
            <Title>Join us</Title>
            <Description>
                {'HY-End 학회와 함께 성장하고, 배움의 기회를 만들어 보세요.\n새로운 도전이 기다리고 있습니다.'}
            </Description>

            <Dots>
                {Array.from({length: TOTAL_STEPS}, (_, i) => (
                    <Dot key={i} $active={i + 1 === step}/>
                ))}
            </Dots>

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{opacity: 0, x: 24}}
                    animate={{opacity: 1, x: 0}}
                    exit={{opacity: 0, x: -24}}
                    transition={{duration: 0.22, ease: 'easeInOut'}}
                    style={{display: 'flex', flexDirection: 'column', gap: 20, width: '100%'}}
                >
                    {step === 1 && (
                        <>
                            <InputField
                                type="email"
                                placeholder="이메일 (아이디)"
                                value={form.email}
                                onChange={update('email')}
                            />
                            <InputField
                                type="password"
                                placeholder="비밀번호"
                                value={form.password}
                                onChange={update('password')}
                            />
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <InputField
                                type="text"
                                placeholder="이름"
                                value={form.name}
                                onChange={update('name')}
                            />
                            <InputField
                                type="text"
                                placeholder="학부"
                                value={form.department}
                                onChange={update('department')}
                            />
                            <InputField
                                type="text"
                                placeholder="학번"
                                value={form.studentId}
                                onChange={update('studentId')}
                            />
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <Description style={{fontWeight: 700, color: 'white'}}>
                                회비를 납부하셨나요?
                            </Description>
                            <InfoBox>
                                <InfoLabel>계좌</InfoLabel>
                                <InfoValue>어디은행 어쩌구저쩌구</InfoValue>
                            </InfoBox>
                            <InfoBox>
                                <InfoLabel>금액</InfoLabel>
                                <InfoValue>{'신입생 - 원\n재학생 - 원\n재가입 - 원'}</InfoValue>
                            </InfoBox>
                            <CheckRow onClick={() => setPaidConfirmed(p => !p)}>
                                <Checkbox $checked={paidConfirmed}>
                                    {paidConfirmed && '✓'}
                                </Checkbox>
                            </CheckRow>
                        </>
                    )}

                    {error && <ErrorText>{error}</ErrorText>}

                    <SubmitButton $active={nextActive && !loading} onClick={handleNext} disabled={loading}>
                        {loading ? '처리 중...' : '다음'}
                    </SubmitButton>

                    {step === 1 && (
                        <LoginLink onClick={onSwitchToLogin}>로그인하러 가기</LoginLink>
                    )}
                </motion.div>
            </AnimatePresence>
        </Container>
    );
}
