import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { meetingService } from '@/services/meetingService';

export default function MeetingCreatePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('20');
  const [scheduledAt, setScheduledAt] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('회의방 이름을 입력해주세요.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await meetingService.create({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      navigate(`/meeting/${res.data.data.id}`);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setError(ax?.response?.data?.message ?? '회의방 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <BgCircle $size={900} $right={-80} $top={50} />
      <BgCircle $size={694} $right={103} $top={153} />
      <BgCircle $size={503} $right={198} $top={248} />

      <Content>
        <PageTitle>새 회의방 만들기</PageTitle>
        <PageSub>참여자들과 실시간 온라인 미팅을 시작하세요</PageSub>

        <FormCard onSubmit={handleSubmit}>
          <Field>
            <Label htmlFor="title">회의방 이름 <Req>*</Req></Label>
            <Input
              id="title"
              type="text"
              placeholder="2024 하반기 정기 회의"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              autoFocus
            />
          </Field>

          <Field>
            <Label htmlFor="desc">설명 (선택)</Label>
            <Textarea
              id="desc"
              placeholder="2024 하반기 학회 운영 방향과 공모전 일정을 논의합니다"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={500}
            />
          </Field>

          <TwoCol>
            <Field>
              <Label htmlFor="max">최대 참여 인원</Label>
              <InputRow>
                <Input
                  id="max"
                  type="number"
                  min={2}
                  max={100}
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  style={{ flex: 1 }}
                />
                <Unit>명</Unit>
              </InputRow>
            </Field>

            <Field>
              <Label htmlFor="sched">예정 시작 시간</Label>
              <Input
                id="sched"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </Field>
          </TwoCol>

          <Field>
            <Label>공개 여부</Label>
            <ToggleRow>
              <ToggleBtn type="button" $active={isPublic} onClick={() => setIsPublic(true)}>공개</ToggleBtn>
              <ToggleBtn type="button" $active={!isPublic} onClick={() => setIsPublic(false)}>비공개</ToggleBtn>
            </ToggleRow>
          </Field>

          {error && <ErrorMsg>{error}</ErrorMsg>}

          <SubmitBtn type="submit" disabled={loading || !title.trim()}>
            {loading ? '생성 중...' : '회의방 만들기'}
          </SubmitBtn>

          <CancelLink type="button" onClick={() => navigate('/meeting')}>
            취소하고 돌아가기
          </CancelLink>
        </FormCard>
      </Content>
    </Page>
  );
}

const Page = styled.div`
  min-height: 100vh;
  position: relative;
  overflow: hidden;
`;

const BgCircle = styled.div<{ $size: number; $right: number; $top: number }>`
  position: absolute;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  right: ${({ $right }) => $right}px;
  top: ${({ $top }) => $top}px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.06);
  pointer-events: none;
  z-index: 0;
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
  max-width: 600px;
  margin: 0 auto;
  padding: 120px 24px 80px;
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize.semiTitle};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 8px;
`;

const PageSub = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 32px;
`;

const FormCard = styled.form`
  background: rgba(255,255,255,0.02);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Req = styled.span`color: ${({ theme }) => theme.colors.neonGreen};`;

const inputCss = `
  background: rgba(255,255,255,0.04);
  border: 1px solid #40423F;
  border-radius: 8px;
  color: #fff;
  font-size: 0.9375rem;
  font-family: inherit;
  padding: 12px 14px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s;
  &::placeholder { color: #9CA3AF; }
  &:focus { border-color: #5FFB7A; }
`;

const Input = styled.input`${inputCss}`;
const Textarea = styled.textarea`${inputCss} resize: vertical; min-height: 96px;`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Unit = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  white-space: nowrap;
`;

const ToggleRow = styled.div`display: flex; gap: 8px;`;

const ToggleBtn = styled.button<{ $active: boolean }>`
  padding: 8px 22px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 1px solid ${({ $active, theme }) =>
    $active ? theme.colors.neonGreen : theme.colors.border};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.neonGreen : 'transparent'};
  color: ${({ $active, theme }) =>
    $active ? '#000' : theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
`;

const ErrorMsg = styled.p`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSize.body};
`;

const SubmitBtn = styled.button`
  width: 100%;
  background: ${({ theme }) => theme.colors.neonGreen};
  color: #000;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 14px;
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMax};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.2s;
  margin-top: 4px;
  &:hover:not(:disabled) { opacity: 0.85; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const CancelLink = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-family: inherit;
  cursor: pointer;
  text-align: center;
  text-decoration: underline;
  transition: color 0.2s;
  &:hover { color: ${({ theme }) => theme.colors.text.primary}; }
`;
