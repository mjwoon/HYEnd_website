import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { meetingService } from '@/services/meetingService';

export default function InviteRedirectPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setError('유효하지 않은 링크입니다.'); return; }

    meetingService.resolveInvite(token)
      .then((res) => {
        const roomId = res.data.data;
        navigate(`/meeting/${roomId}`, { replace: true });
      })
      .catch(() => {
        setError('초대 링크가 만료됐거나 유효하지 않습니다.');
      });
  }, [token, navigate]);

  return (
    <Page>
      {error ? (
        <Card>
          <Icon>🔗</Icon>
          <Msg style={{ color: '#EF4444' }}>{error}</Msg>
          <BackBtn onClick={() => navigate('/meeting')}>회의 목록으로</BackBtn>
        </Card>
      ) : (
        <Card>
          <Spinner />
          <Msg>초대 링크를 확인하는 중...</Msg>
        </Card>
      )}
    </Page>
  );
}

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px;
  background: rgba(255,255,255,0.02);
  border: 1px solid #40423F;
  border-radius: 14px;
`;

const Icon = styled.span`font-size: 48px;`;

const Msg = styled.p`
  font-family: "Pretendard Variable";
  font-size: 15px;
  color: #9CA3AF;
  margin: 0;
  text-align: center;
`;

const BackBtn = styled.button`
  padding: 10px 24px;
  border-radius: 8px;
  border: 1px solid #5D625E;
  background: rgba(255,255,255,0.08);
  color: #fff;
  font-family: "Pretendard Variable";
  font-size: 14px;
  cursor: pointer;
  &:hover { background: rgba(255,255,255,0.14); }
`;

const Spinner = styled.div`
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: #5FFB7A;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
