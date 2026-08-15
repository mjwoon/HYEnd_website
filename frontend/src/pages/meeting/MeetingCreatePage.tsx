import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'motion/react';
import { meetingService } from '@/services/meetingService';

export default function MeetingCreatePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('회의방 이름을 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await meetingService.create({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      navigate(`/meeting/${res.data.data.id}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message ?? '회의방 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <BackBtn onClick={() => navigate('/meeting')}>← 목록으로</BackBtn>

      <Card
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <CardTitle>새 회의방 만들기</CardTitle>

        <Form onSubmit={handleSubmit}>
          <Field>
            <Label htmlFor="title">
              회의방 이름 <Required>*</Required>
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="예: 2026 하반기 정기 회의"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              autoFocus
            />
            <CharCount>{title.length} / 80</CharCount>
          </Field>

          <Field>
            <Label htmlFor="description">설명 (선택)</Label>
            <Textarea
              id="description"
              placeholder="회의 주제나 안건을 간략히 적어주세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <CharCount>{description.length} / 500</CharCount>
          </Field>

          {error && <ErrorMsg>{error}</ErrorMsg>}

          <ButtonRow>
            <CancelBtn type="button" onClick={() => navigate('/meeting')}>
              취소
            </CancelBtn>
            <SubmitBtn type="submit" disabled={loading || !title.trim()}>
              {loading ? '생성 중...' : '회의방 만들기'}
            </SubmitBtn>
          </ButtonRow>
        </Form>
      </Card>
    </Container>
  );
}

const Container = styled.div`
  padding: 100px 40px 60px;
  max-width: 600px;
  margin: 0 auto;
  min-height: 100vh;
`;

const BackBtn = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-family: inherit;
  cursor: pointer;
  padding: 0;
  margin-bottom: 24px;
  display: block;
  transition: color 0.2s;
  &:hover { color: ${({ theme }) => theme.colors.neonGreen}; }
`;

const Card = styled(motion.div)`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 32px;
  backdrop-filter: blur(7px);
`;

const CardTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize.semiTitle};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 28px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Required = styled.span`
  color: ${({ theme }) => theme.colors.neonGreen};
`;

const inputBase = `
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid #40423F;
  border-radius: 8px;
  color: inherit;
  font-size: 0.9375rem;
  font-family: inherit;
  padding: 12px 14px;
  outline: none;
  transition: border-color 0.2s;
  width: 100%;
  box-sizing: border-box;
  &::placeholder { color: #9CA3AF; }
  &:focus { border-color: #5FFB7A; }
`;

const Input = styled.input`${inputBase}`;

const Textarea = styled.textarea`
  ${inputBase}
  resize: vertical;
  min-height: 100px;
`;

const CharCount = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMin};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: right;
`;

const ErrorMsg = styled.p`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSize.body};
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
`;

const CancelBtn = styled.button`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  padding: 11px 24px;
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
  &:hover { border-color: #9CA3AF; color: ${({ theme }) => theme.colors.text.primary}; }
`;

const SubmitBtn = styled.button`
  background: ${({ theme }) => theme.colors.neonGreen};
  color: #000;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 11px 28px;
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover:not(:disabled) { opacity: 0.85; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
`;
