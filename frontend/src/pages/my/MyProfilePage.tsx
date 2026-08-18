import styled from 'styled-components';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const Wrapper = styled.div`
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 70px;
`;

const Card = styled.div`
  width: 480px;
  padding: 32px;
  border-radius: 14px;
  border: 1px solid #40423F;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(7px);
  display: flex;
  flex-direction: column;
  gap: 28px;
`;

const CardTitle = styled.h2`
  color: #FFF;
  font-family: "Pretendard Variable";
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  padding-bottom: 20px;
  border-bottom: 1px solid #40423F;
`;

const AvatarRow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const Avatar = styled.div`
  width: 82px;
  height: 82px;
  border-radius: 20px;
  background: #D9D9D9;
`;

const RoleTag = styled.span<{ role: string }>`
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 20px;
  background: ${({ role }) =>
    role === 'ADMIN' ? 'rgba(255, 100, 100, 0.15)' :
    role === 'STAFF' ? 'rgba(100, 180, 255, 0.15)' :
    'rgba(255, 255, 255, 0.08)'};
  color: ${({ role }) =>
    role === 'ADMIN' ? '#ff8080' :
    role === 'STAFF' ? '#80c8ff' :
    '#C0C2C0'};
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  color: #C0C2C0;
  font-family: "Pretendard Variable";
  font-size: 12px;
  font-weight: 500;
`;

const Input = styled.input<{ readOnly?: boolean }>`
  background: ${({ readOnly }) => readOnly ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)'};
  border: 1px solid ${({ readOnly }) => readOnly ? '#2A2A2A' : '#40423F'};
  border-radius: 8px;
  color: ${({ readOnly }) => readOnly ? '#676767' : '#FFF'};
  font-family: "Pretendard Variable";
  font-size: 14px;
  padding: 10px 14px;
  outline: none;
  cursor: ${({ readOnly }) => readOnly ? 'default' : 'text'};

  &:focus {
    border-color: ${({ readOnly }) => readOnly ? '#2A2A2A' : '#5FFB7A'};
  }
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: #40423F;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const BackButton = styled.button`
  padding: 10px 24px;
  border-radius: 8px;
  border: 1px solid #5D625E;
  background: rgba(255, 255, 255, 0.06);
  color: #C0C2C0;
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }
`;

const SaveButton = styled.button<{ disabled?: boolean }>`
  padding: 10px 28px;
  border-radius: 8px;
  background: ${({ disabled }) => disabled ? '#3A3A3A' : '#5FFB7A'};
  color: ${({ disabled }) => disabled ? '#666' : '#000'};
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-weight: 700;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  transition: opacity 0.2s ease;
`;

const SuccessBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 8px;
  background: rgba(95, 251, 122, 0.10);
  color: #5FFB7A;
  font-family: "Pretendard Variable";
  font-size: 13px;
  font-weight: 600;
`;

const HintText = styled.span`
  color: #676767;
  font-family: "Pretendard Variable";
  font-size: 11px;
`;

export default function MyProfilePage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saved, setSaved] = useState(false);
  const [pwError, setPwError] = useState('');

  if (!user) return null;

  function handleSave() {
    if (!user) return;
    if (newPw || confirmPw || currentPw) {
      if (newPw !== confirmPw) {
        setPwError('새 비밀번호가 일치하지 않습니다.');
        return;
      }
      if (newPw.length < 6) {
        setPwError('비밀번호는 6자 이상이어야 합니다.');
        return;
      }
    }
    setPwError('');

    const updated = { id: user.id, username: user.username, role: user.role, fullName };
    localStorage.setItem('userInfo', JSON.stringify(updated));
    setUser(updated);

    setSaved(true);
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setTimeout(() => setSaved(false), 3000);
  }

  const hasChanges = fullName !== (user.fullName ?? '') || !!newPw;

  return (
    <Wrapper>
      <Card>
        <CardTitle>내 정보 수정</CardTitle>

        <AvatarRow>
          <Avatar />
          <RoleTag role={user.role?.toUpperCase() ?? 'MEMBER'}>
            {user.role?.toUpperCase() ?? 'MEMBER'}
          </RoleTag>
        </AvatarRow>

        <FieldGroup>
          <Field>
            <Label>아이디 (이메일)</Label>
            <Input readOnly value={user.username} />
          </Field>
          <Field>
            <Label>이름</Label>
            <Input
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setSaved(false); }}
              placeholder="이름을 입력하세요"
            />
          </Field>
        </FieldGroup>

        <Divider />

        <FieldGroup>
          <Field>
            <Label>현재 비밀번호</Label>
            <Input
              type="password"
              value={currentPw}
              onChange={(e) => { setCurrentPw(e.target.value); setSaved(false); }}
              placeholder="현재 비밀번호"
            />
          </Field>
          <Field>
            <Label>새 비밀번호</Label>
            <Input
              type="password"
              value={newPw}
              onChange={(e) => { setNewPw(e.target.value); setSaved(false); }}
              placeholder="새 비밀번호 (6자 이상)"
            />
          </Field>
          <Field>
            <Label>새 비밀번호 확인</Label>
            <Input
              type="password"
              value={confirmPw}
              onChange={(e) => { setConfirmPw(e.target.value); setSaved(false); }}
              placeholder="새 비밀번호 확인"
            />
            {pwError && <HintText style={{ color: '#F87171' }}>{pwError}</HintText>}
          </Field>
        </FieldGroup>

        {saved && <SuccessBadge>✅ 변경 사항이 저장되었습니다.</SuccessBadge>}

        <ButtonRow>
          <BackButton onClick={() => navigate('/home')}>취소</BackButton>
          <SaveButton disabled={!hasChanges} onClick={handleSave}>저장</SaveButton>
        </ButtonRow>
      </Card>
    </Wrapper>
  );
}
