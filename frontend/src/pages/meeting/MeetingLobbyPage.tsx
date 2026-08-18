import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { createLocalVideoTrack, createLocalAudioTrack } from 'livekit-client';
import type { LocalVideoTrack, LocalAudioTrack } from 'livekit-client';
import { meetingService } from '@/services/meetingService';
import type { MeetingRoomDetail, MeetingStatus } from '@/types/meeting';

const STATUS_LABEL: Record<MeetingStatus, string> = {
  WAITING: '예정',
  ACTIVE: '진행중',
  ENDED: '종료',
};

const STATUS_COLOR: Record<MeetingStatus, { bg: string; text: string }> = {
  ACTIVE:  { bg: '#5FFB7A', text: '#000' },
  WAITING: { bg: '#3B82F6', text: '#fff' },
  ENDED:   { bg: '#374151', text: '#9CA3AF' },
};

export default function MeetingLobbyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const roomId = Number(id);

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoTrackRef = useRef<LocalVideoTrack | null>(null);
  const audioTrackRef = useRef<LocalAudioTrack | null>(null);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [camReady, setCamReady] = useState(false);

  const [token, setToken] = useState('');
  const [roomName, setRoomName] = useState('');
  const [detail, setDetail] = useState<MeetingRoomDetail | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState('');

  useEffect(() => {
    setTokenLoading(true);
    meetingService.join(roomId)
      .then((res) => {
        setToken(res.data.data.livekitToken);
        setRoomName(res.data.data.roomName);
      })
      .catch(() => setTokenError('입장 토큰을 받아오지 못했습니다.'))
      .finally(() => setTokenLoading(false));

    meetingService.getDetail(roomId)
      .then((res) => setDetail(res.data.data))
      .catch(() => {});
  }, [roomId]);

  useEffect(() => {
    let track: LocalVideoTrack;
    createLocalVideoTrack({ resolution: { width: 640, height: 360 } })
      .then((t) => {
        track = t;
        videoTrackRef.current = t;
        if (videoRef.current) t.attach(videoRef.current);
        setCamReady(true);
      })
      .catch(() => { setIsCamOn(false); setCamReady(true); });
    return () => { track?.stop(); };
  }, []);

  useEffect(() => {
    let track: LocalAudioTrack;
    createLocalAudioTrack()
      .then((t) => { track = t; audioTrackRef.current = t; })
      .catch(() => setIsMicOn(false));
    return () => { track?.stop(); };
  }, []);

  const toggleMic = async () => {
    const t = audioTrackRef.current;
    if (!t) return;
    if (isMicOn) await t.mute(); else await t.unmute();
    setIsMicOn((v) => !v);
  };

  const toggleCam = async () => {
    const t = videoTrackRef.current;
    if (!t) return;
    if (isCamOn) await t.mute(); else await t.unmute();
    setIsCamOn((v) => !v);
  };

  const handleEnter = () => {
    videoTrackRef.current?.stop();
    audioTrackRef.current?.stop();
    navigate(`/meeting/${roomId}/room`, {
      state: { token, roomName, isCamOn, isMicOn },
    });
  };

  const isReady = !tokenLoading && !!token && camReady;

  return (
    <Page>
      <BgCircle $size={900} $right={-80} $top={50} />
      <BgCircle $size={694} $right={103} $top={153} />
      <BgCircle $size={503} $right={198} $top={248} />

      <Content>
        <BackBtn onClick={() => navigate(`/meeting/${roomId}`)}>
          ← {detail?.title ?? '회의방'}
        </BackBtn>

        <Columns>
          {/* ── Left: camera preview ── */}
          <Left>
            <LeftCard>
              <CardTitle>내 화면 미리보기</CardTitle>

              <VideoBox>
                <StyledVideo ref={videoRef} autoPlay playsInline muted $hidden={!isCamOn} />
                {!isCamOn && (
                  <VideoPlaceholder>
                    <PlaceholderCircle />
                    <PlaceholderText>카메라 연결 중...</PlaceholderText>
                  </VideoPlaceholder>
                )}
              </VideoBox>

              <SettingLabel>참여 설정</SettingLabel>
              <ToggleRow>
                <DeviceBtn $active={isMicOn} onClick={toggleMic}>
                  마이크 {isMicOn ? '켜짐' : '꺼짐'}
                </DeviceBtn>
                <DeviceBtn $active={isCamOn} onClick={toggleCam}>
                  카메라 {isCamOn ? '켜짐' : '꺼짐'}
                </DeviceBtn>
                <DeviceBtn $active={false} disabled>
                  스피커 꺼짐
                </DeviceBtn>
              </ToggleRow>

              <SettingLink>오디오 · 비디오 설정 변경 →</SettingLink>
            </LeftCard>
          </Left>

          {/* ── Right: info + enter ── */}
          <Right>
            {/* 회의 정보 */}
            <Panel>
              <PanelTitle>회의 정보</PanelTitle>
              {detail ? (
                <InfoGrid>
                  <InfoLabel>회의명</InfoLabel>
                  <InfoVal style={{ fontWeight: 700 }}>{detail.title}</InfoVal>
                  <InfoLabel>주최자</InfoLabel>
                  <InfoVal>{detail.hostName}</InfoVal>
                  <InfoLabel>시작 시간</InfoLabel>
                  <InfoVal>
                    {new Date(detail.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric', month: '2-digit', day: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </InfoVal>
                  <InfoLabel>현재 참여자</InfoLabel>
                  <InfoVal style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    —
                    {detail.status && (
                      <StatusBadge $status={detail.status}>
                        {STATUS_LABEL[detail.status]}
                      </StatusBadge>
                    )}
                  </InfoVal>
                </InfoGrid>
              ) : (
                <InfoVal style={{ color: '#9CA3AF' }}>불러오는 중...</InfoVal>
              )}
            </Panel>

            {/* 준비되셨나요? */}
            <Panel>
              <PanelTitle>준비되셨나요?</PanelTitle>
              <PanelDesc>마이크와 카메라 상태를 확인하고 입장하세요</PanelDesc>
              {tokenError && <ErrorMsg>{tokenError}</ErrorMsg>}
              <EnterBtn onClick={handleEnter} disabled={!isReady}>
                {tokenLoading ? '준비 중...' : '지금 입장하기 →'}
              </EnterBtn>
              <ExitBtn onClick={() => navigate(`/meeting/${roomId}`)}>나가기</ExitBtn>
            </Panel>

            {/* 안내 */}
            <Notice>
              💡 주최자가 회의를 시작하면 자동으로 입장됩니다
            </Notice>
          </Right>
        </Columns>
      </Content>
    </Page>
  );
}

/* ── Styled Components ── */

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
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px 40px 80px;
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

const Columns = styled.div`
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
  align-items: start;

  @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
  }
`;

const Left = styled.div``;

const LeftCard = styled.div`
  background: rgba(255,255,255,0.02);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 24px;
`;

const CardTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMax};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 16px;
`;

const VideoBox = styled.div`
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #111;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  overflow: hidden;
  position: relative;
  margin-bottom: 20px;
`;

const StyledVideo = styled.video<{ $hidden: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
  display: ${({ $hidden }) => $hidden ? 'none' : 'block'};
`;

const VideoPlaceholder = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

const PlaceholderCircle = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #2A2A2A;
`;

const PlaceholderText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const SettingLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 10px;
`;

const ToggleRow = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
`;

const DeviceBtn = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 10px 4px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ $active }) => $active ? '#5FFB7A' : '#40423F'};
  background: transparent;
  color: ${({ $active }) => $active ? '#5FFB7A' : '#9CA3AF'};
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMin};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-family: inherit;
  cursor: ${({ disabled }) => disabled ? 'default' : 'pointer'};
  transition: all 0.15s;
  &:hover:not(:disabled) {
    border-color: ${({ $active }) => $active ? '#5FFB7A' : '#9CA3AF'};
  }
`;

const SettingLink = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMin};
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;
  &:hover { color: ${({ theme }) => theme.colors.neonGreen}; }
`;

const Right = styled.div`display: flex; flex-direction: column; gap: 16px;`;

const Panel = styled.div`
  background: rgba(255,255,255,0.02);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PanelTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMax};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const PanelDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 10px 12px;
  align-items: center;
`;

const InfoLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMin};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const InfoVal = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const StatusBadge = styled.span<{ $status: MeetingStatus }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: 11px;
  font-weight: 700;
  background: ${({ $status }) => STATUS_COLOR[$status].bg};
  color: ${({ $status }) => STATUS_COLOR[$status].text};
`;

const ErrorMsg = styled.p`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMin};
`;

const EnterBtn = styled.button`
  width: 100%;
  background: ${({ theme }) => theme.colors.neonGreen};
  color: #000;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 13px;
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover:not(:disabled) { opacity: 0.85; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const ExitBtn = styled.button`
  width: 100%;
  background: rgba(255,255,255,0.05);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.text.primary};
  padding: 13px;
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: rgba(255,255,255,0.08); }
`;

const Notice = styled.div`
  background: rgba(255,255,255,0.02);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 16px 20px;
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  color: ${({ theme }) => theme.colors.text.secondary};
`;
