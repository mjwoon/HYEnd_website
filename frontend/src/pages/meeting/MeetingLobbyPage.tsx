import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'motion/react';
import { createLocalVideoTrack, createLocalAudioTrack } from 'livekit-client';
import type { LocalVideoTrack, LocalAudioTrack } from 'livekit-client';
import { meetingService } from '@/services/meetingService';

export default function MeetingLobbyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const roomId = Number(id);

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoTrackRef = useRef<LocalVideoTrack | null>(null);
  const audioTrackRef = useRef<LocalAudioTrack | null>(null);

  const [isCamOn, setIsCamOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [camReady, setCamReady] = useState(false);
  const [token, setToken] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomTitle, setRoomTitle] = useState('');
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState('');

  // Fetch join token
  useEffect(() => {
    setTokenLoading(true);
    meetingService.join(roomId)
      .then((res) => {
        setToken(res.data.data.livekitToken);
        setRoomName(res.data.data.roomName);
      })
      .catch(() => setTokenError('입장 토큰을 받아오지 못했습니다. 다시 시도해주세요.'))
      .finally(() => setTokenLoading(false));

    meetingService.getDetail(roomId)
      .then((res) => setRoomTitle(res.data.data.title))
      .catch(() => {});
  }, [roomId]);

  // Local camera preview
  useEffect(() => {
    let track: LocalVideoTrack;
    createLocalVideoTrack({ resolution: { width: 640, height: 360 } })
      .then((t) => {
        track = t;
        videoTrackRef.current = t;
        if (videoRef.current) t.attach(videoRef.current);
        setCamReady(true);
      })
      .catch(() => {
        setIsCamOn(false);
        setCamReady(true);
      });
    return () => { track?.stop(); };
  }, []);

  // Local audio (muted in lobby — only to test mic permission)
  useEffect(() => {
    let track: LocalAudioTrack;
    createLocalAudioTrack()
      .then((t) => {
        track = t;
        audioTrackRef.current = t;
      })
      .catch(() => setIsMicOn(false));
    return () => { track?.stop(); };
  }, []);

  const toggleCam = async () => {
    const track = videoTrackRef.current;
    if (!track) return;
    if (isCamOn) {
      await track.mute();
    } else {
      await track.unmute();
    }
    setIsCamOn((v) => !v);
  };

  const toggleMic = async () => {
    const track = audioTrackRef.current;
    if (!track) return;
    if (isMicOn) {
      await track.mute();
    } else {
      await track.unmute();
    }
    setIsMicOn((v) => !v);
  };

  const handleEnter = () => {
    // Stop preview tracks — LiveKit Room will create its own
    videoTrackRef.current?.stop();
    audioTrackRef.current?.stop();
    navigate(`/meeting/${roomId}/room`, {
      state: { token, roomName, isCamOn, isMicOn },
    });
  };

  const isReady = !tokenLoading && !!token && camReady;

  return (
    <Outer>
      <BackBtn onClick={() => navigate(`/meeting/${roomId}`)}>← 돌아가기</BackBtn>

      <Inner
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <RoomName>{roomTitle || '회의 대기실'}</RoomName>
        <SubText>입장 전 카메라와 마이크를 확인하세요.</SubText>

        <PreviewBox>
          <Video ref={videoRef} autoPlay playsInline muted $hidden={!isCamOn} />
          {!isCamOn && (
            <CamOff>
              <CamOffIcon>📷</CamOffIcon>
              <span>카메라 꺼짐</span>
            </CamOff>
          )}
        </PreviewBox>

        <Controls>
          <ControlBtn $active={isMicOn} onClick={toggleMic} title={isMicOn ? '마이크 끄기' : '마이크 켜기'}>
            <BtnIcon>{isMicOn ? '🎤' : '🔇'}</BtnIcon>
            <BtnLabel>{isMicOn ? '마이크 ON' : '마이크 OFF'}</BtnLabel>
          </ControlBtn>
          <ControlBtn $active={isCamOn} onClick={toggleCam} title={isCamOn ? '카메라 끄기' : '카메라 켜기'}>
            <BtnIcon>{isCamOn ? '📷' : '🚫'}</BtnIcon>
            <BtnLabel>{isCamOn ? '카메라 ON' : '카메라 OFF'}</BtnLabel>
          </ControlBtn>
        </Controls>

        {tokenError && <ErrorMsg>{tokenError}</ErrorMsg>}

        <EnterBtn
          onClick={handleEnter}
          disabled={!isReady}
        >
          {tokenLoading ? '준비 중...' : isReady ? '입장하기 →' : '장치 초기화 중...'}
        </EnterBtn>
      </Inner>
    </Outer>
  );
}

const Outer = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100px 24px 60px;
`;

const BackBtn = styled.button`
  align-self: flex-start;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-family: inherit;
  cursor: pointer;
  padding: 0;
  margin-bottom: 32px;
  transition: color 0.2s;
  &:hover { color: ${({ theme }) => theme.colors.neonGreen}; }
`;

const Inner = styled(motion.div)`
  width: 100%;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
`;

const RoomName = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize.semiTitle};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 8px;
  text-align: center;
`;

const SubText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 28px;
  text-align: center;
`;

const PreviewBox = styled.div`
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: #111;
  overflow: hidden;
  position: relative;
  margin-bottom: 20px;
`;

const Video = styled.video<{ $hidden: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
  display: ${({ $hidden }) => ($hidden ? 'none' : 'block')};
`;

const CamOff = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.body};
`;

const CamOffIcon = styled.span`font-size: 36px;`;

const Controls = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 28px;
`;

const ControlBtn = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 28px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ $active, theme }) =>
    $active ? theme.colors.border : '#EF4444'};
  background: ${({ $active }) => $active ? 'rgba(255,255,255,0.04)' : 'rgba(239,68,68,0.1)'};
  color: ${({ $active, theme }) => $active ? theme.colors.text.primary : '#EF4444'};
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    border-color: ${({ $active, theme }) => $active ? theme.colors.neonGreen : '#ff6b6b'};
  }
`;

const BtnIcon = styled.span`font-size: 22px;`;

const BtnLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMin};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const ErrorMsg = styled.p`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  margin-bottom: 12px;
  text-align: center;
`;

const EnterBtn = styled.button`
  width: 100%;
  max-width: 320px;
  background: ${({ theme }) => theme.colors.neonGreen};
  color: #000;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 14px 0;
  font-size: ${({ theme }) => theme.typography.fontSize.bodyMax};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover:not(:disabled) { opacity: 0.85; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;
