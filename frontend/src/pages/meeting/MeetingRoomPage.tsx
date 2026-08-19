import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useLocalParticipant,
  useParticipants,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { useAudioCapture } from '@/hooks/useAudioCapture';
import { useStompWS } from '@/hooks/useStompWS';
import { ChatPanel } from '@/components/meeting/ChatPanel';
import { TranscriptPanel } from '@/components/meeting/TranscriptPanel';

interface LocationState { token: string; roomName: string; isCamOn?: boolean; isMicOn?: boolean; meetingTitle?: string; }

/* ════════════════════════════════════════
   Outer wrapper — sets up LiveKitRoom
   ════════════════════════════════════════ */
export default function MeetingRoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | undefined;
  const roomId = Number(id);

  useEffect(() => {
    if (!state?.token) navigate('/meeting');
  }, [state, navigate]);

  if (!state?.token) return null;

  const { token, isCamOn = true, isMicOn = true, meetingTitle = '회의' } = state;
  const livekitUrl = import.meta.env.VITE_LIVEKIT_URL as string;

  return (
    <LiveKitRoom
      serverUrl={livekitUrl}
      token={token}
      connect
      video={isCamOn}
      audio={isMicOn}
      onDisconnected={() => navigate(`/meeting/${roomId}`)}
      style={{ position: 'fixed', inset: 0 }}
    >
      <RoomContent roomId={roomId} meetingTitle={meetingTitle} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

/* ════════════════════════════════════════
   Inner component — uses LiveKit hooks
   ════════════════════════════════════════ */
function RoomContent({ roomId, meetingTitle }: { roomId: number; meetingTitle: string }) {
  const navigate = useNavigate();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const participants = useParticipants();

  const cameraTracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
  ], { onlySubscribed: false });

  /* UI state */
  const [sidePanel, setSidePanel] = useState<'chat' | 'transcript' | null>('chat');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  /* STOMP */
  const stomp = useStompWS();

  /* Audio capture */
  const { isCapturing, startCapture, stopCapture } = useAudioCapture();
  const toggleTranscript = useCallback(async () => {
    if (isCapturing) {
      stopCapture();
    } else {
      setSidePanel('transcript');
      await startCapture(roomId);
    }
  }, [isCapturing, startCapture, stopCapture, roomId]);

  const switchToTranscript = useCallback(async () => {
    setSidePanel('transcript');
    if (!isCapturing) await startCapture(roomId);
  }, [isCapturing, startCapture, roomId]);

  /* ── Controls ── */
  const toggleMic = async () => {
    try {
      setDeviceError(null);
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch (e) {
      console.error('마이크 토글 실패:', e);
      setDeviceError('마이크 접근 권한을 확인하거나 브라우저에서 마이크를 허용해주세요.');
    }
  };
  const toggleCam = async () => {
    try {
      setDeviceError(null);
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch (e) {
      console.error('카메라 토글 실패:', e);
      setDeviceError('카메라 접근 권한을 확인하거나 브라우저에서 카메라를 허용해주세요.');
    }
  };

  const toggleScreenShare = async () => {
    try {
      await localParticipant.setScreenShareEnabled(!isScreenSharing);
      setIsScreenSharing((v) => !v);
    } catch { /* permission denied */ }
  };

  const handleLeave = () => {
    navigate(`/meeting/${roomId}`);
  };

  /* ── Render ── */
  return (
    <>
    <FullScreen>
      {/* Top bar */}
      <TopBar>
        <TopLeft>
          <RoomName>{meetingTitle || '회의'}</RoomName>
          <LiveInfo>
            <LiveDot />
            LIVE · {participants.length}명 참여 중
          </LiveInfo>
        </TopLeft>
        <Logo>HY-END</Logo>
        <LeaveBtn onClick={() => setShowLeaveDialog(true)}>나가기</LeaveBtn>
      </TopBar>

      {/* Main body */}
      <Body>
        <VideoArea $sideOpen={sidePanel !== null}>
          <VideoGrid $count={cameraTracks.length}>
            {cameraTracks.map((track) => (
              <ParticipantTile
                key={`${track.participant.identity}-${track.source}`}
                track={track}
              />
            ))}
          </VideoGrid>
        </VideoArea>

        {sidePanel && (
          <SidePanel>
            <PanelTabs>
              <PanelTab $active={sidePanel === 'chat'} onClick={() => setSidePanel('chat')}>채팅</PanelTab>
              <PanelTab $active={sidePanel === 'transcript'} onClick={switchToTranscript}>자막</PanelTab>
            </PanelTabs>
            <PanelBody>
              {sidePanel === 'chat'
                ? <ChatPanel roomId={roomId} stomp={stomp} />
                : <TranscriptPanel roomId={roomId} stomp={stomp} isCapturing={isCapturing} />}
            </PanelBody>
          </SidePanel>
        )}
      </Body>

      {/* Device error toast */}
      {deviceError && (
        <DeviceErrorToast onClick={() => setDeviceError(null)}>
          ⚠ {deviceError}
        </DeviceErrorToast>
      )}

      {/* Control bar */}
      <ControlBar>
        <CtrlBtn $active={isMicrophoneEnabled} onClick={toggleMic}>
          <CtrlIcon>
            {isMicrophoneEnabled
              ? <MicOnIcon />
              : <MicOffIcon />}
          </CtrlIcon>
          <CtrlLabel>마이크</CtrlLabel>
        </CtrlBtn>

        <CtrlBtn $active={isCameraEnabled} onClick={toggleCam}>
          <CtrlIcon><CamIcon /></CtrlIcon>
          <CtrlLabel>카메라</CtrlLabel>
        </CtrlBtn>

        <CtrlBtn $active={isScreenSharing} onClick={toggleScreenShare}>
          <CtrlIcon><ScreenIcon /></CtrlIcon>
          <CtrlLabel>화면 공유</CtrlLabel>
        </CtrlBtn>

        <CtrlBtn $active={isCapturing} onClick={toggleTranscript}>
          <CtrlIcon><TranscriptIcon /></CtrlIcon>
          <CtrlLabel>음성 자막</CtrlLabel>
        </CtrlBtn>

        <CtrlBtn $active={sidePanel === 'chat'} onClick={() => setSidePanel((v) => v === 'chat' ? null : 'chat')}>
          <CtrlIcon><ChatIcon /></CtrlIcon>
          <CtrlLabel>채팅</CtrlLabel>
        </CtrlBtn>
      </ControlBar>

    </FullScreen>

      {/* Leave dialog — rendered via portal to escape LiveKit stacking context */}
      {showLeaveDialog && createPortal(
        <Overlay>
          <Dialog>
            <DialogTitle>회의에서 나가시겠습니까?</DialogTitle>
            <DialogBtns>
              <DialogCancel onClick={() => setShowLeaveDialog(false)}>취소</DialogCancel>
              <DialogLeave onClick={handleLeave}>나가기</DialogLeave>
            </DialogBtns>
          </Dialog>
        </Overlay>,
        document.body,
      )}
    </>
  );
}

/* ════════════════════════════════════════
   Participant tile
   ════════════════════════════════════════ */
function ParticipantTile({ track }: { track: TrackReferenceOrPlaceholder }) {
  const { participant } = track;
  const hasVideo = track.publication != null && !track.publication.isMuted;
  const isSpeaking = participant.isSpeaking;
  const initial = (participant.name ?? participant.identity ?? '?').charAt(0).toUpperCase();
  const micEnabled = participant.isMicrophoneEnabled;

  return (
    <Tile $speaking={isSpeaking}>
      {hasVideo ? (
        <StyledVideo trackRef={track} $mirror={participant.isLocal} />
      ) : (
        <TileCenter>
          <InitialCircle>{initial}</InitialCircle>
        </TileCenter>
      )}
      <TileLabel>
        {participant.name ?? participant.identity}
        {participant.isLocal && ' (나)'}
      </TileLabel>
      {!micEnabled && (
        <MicBadge>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#EF4444">
            <path d="M19 11c0 3.87-3.13 7-7 7s-7-3.13-7-7H3c0 4.54 3.27 8.31 7.6 9.04V22h2.8v-1.96C17.73 19.31 21 15.54 21 11h-2zm-7-9a3 3 0 013 3v5c0 1.66-1.34 3-3 3s-3-1.34-3-3V5a3 3 0 013-3zm0 2a1 1 0 00-1 1v5a1 1 0 002 0V5a1 1 0 00-1-1z"/>
            <line x1="3" y1="3" x2="21" y2="21" stroke="#EF4444" strokeWidth="2"/>
          </svg>
        </MicBadge>
      )}
    </Tile>
  );
}

/* ── SVG Icons ── */
const MicOnIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a3 3 0 013 3v6a3 3 0 01-6 0V5a3 3 0 013-3zm6 9c0 3.31-2.69 6-6 6s-6-2.69-6-6H4c0 4.08 3.05 7.44 7 7.93V21h2v-2.07c3.95-.49 7-3.85 7-7.93h-2z"/>
  </svg>
);
const MicOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 11c0 3.87-3.13 7-7 7-1.44 0-2.78-.44-3.9-1.18l1.46-1.46c.74.4 1.58.64 2.44.64 2.76 0 5-2.24 5-5h2zm-7 7c-3.87 0-7-3.13-7-7H3c0 4.54 3.27 8.31 7.6 9.04V22h2.8v-1.96A9.023 9.023 0 0019.74 14l-1.44-1.44C17.27 14.85 15.28 16 13 16l-1-1zM12 2a3 3 0 013 3v.17L9.05 11.12A3.002 3.002 0 009 11V5a3 3 0 013-3zM3.27 3L2 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5-2.24-5-5H4c0 3.65 2.56 6.67 6 7.42V21h2v-2.58c.85-.18 1.65-.52 2.37-1L19.73 23 21 21.73l-18-18z"/>
  </svg>
);
const CamIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
  </svg>
);
const ScreenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 3H4c-1.11 0-2 .89-2 2v12c0 1.1.89 2 2 2h4v2h8v-2h4c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm0 14H4V5h16v12zm-6-2v-3.75l3.75 3.75L21 13.5 15 7.5l-3.75 3.75H15V9H9v6h5z"/>
  </svg>
);
const TranscriptIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12zM7 9h10v2H7zm0-3h10v2H7zm0 6h7v2H7z"/>
  </svg>
);
const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
  </svg>
);

/* ════════════════════════════════════════
   Styled Components
   ════════════════════════════════════════ */

const FullScreen = styled.div`
  position: fixed;
  inset: 0;
  background: #060606;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

/* Top bar */
const TopBar = styled.header`
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid #1a1a1a;
  flex-shrink: 0;
`;

const TopLeft = styled.div`display: flex; align-items: center; gap: 14px;`;

const RoomName = styled.span`
  font-size: 0.9375rem;
  font-weight: 600;
  color: #fff;
`;

const LiveInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
  color: #5FFB7A;
`;

const LiveDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #5FFB7A;
  animation: pulse 1.5s ease-in-out infinite;
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
`;

const Logo = styled.div`
  font-size: 1.125rem;
  font-weight: 800;
  color: #5FFB7A;
  letter-spacing: 0.05em;
`;

const LeaveBtn = styled.button`
  background: transparent;
  border: 1.5px solid #EF4444;
  color: #EF4444;
  border-radius: 6px;
  padding: 6px 18px;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: rgba(239,68,68,0.12); }
`;

/* Body */
const Body = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const VideoArea = styled.div<{ $sideOpen: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
`;

const VideoGrid = styled.div<{ $count: number }>`
  display: grid;
  grid-template-columns: ${({ $count }) =>
    $count <= 1 ? '1fr'
    : $count <= 2 ? 'repeat(2, 1fr)'
    : 'repeat(3, 1fr)'};
  gap: 12px;
  width: 100%;
  max-height: 100%;
`;

/* Participant tile */
const Tile = styled.div<{ $speaking: boolean }>`
  position: relative;
  background: #111;
  border-radius: 10px;
  border: 2px solid ${({ $speaking }) => $speaking ? '#5FFB7A' : 'transparent'};
  aspect-ratio: 16 / 9;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TileCenter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`;

const InitialCircle = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #2A2A2A;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
`;

const StyledVideo = styled(VideoTrack)<{ $mirror?: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  ${({ $mirror }) => $mirror && 'transform: scaleX(-1);'}
`;

const TileLabel = styled.div`
  position: absolute;
  bottom: 8px;
  left: 10px;
  font-size: 0.75rem;
  color: #fff;
  background: rgba(0,0,0,0.55);
  padding: 2px 8px;
  border-radius: 4px;
`;

const MicBadge = styled.div`
  position: absolute;
  bottom: 8px;
  right: 10px;
`;

/* Side panel */
const SidePanel = styled.div`
  width: 360px;
  flex-shrink: 0;
  border-left: 1px solid #1a1a1a;
  display: flex;
  flex-direction: column;
`;

const PanelTabs = styled.div`
  display: flex;
  border-bottom: 1px solid #1a1a1a;
`;

const PanelTab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 12px 0;
  background: transparent;
  border: none;
  border-bottom: 2px solid ${({ $active }) => $active ? '#5FFB7A' : 'transparent'};
  color: ${({ $active }) => $active ? '#5FFB7A' : '#6B7280'};
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: color 0.15s;
  &:hover { color: ${({ $active }) => $active ? '#5FFB7A' : '#9CA3AF'}; }
`;

const PanelBody = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

/* Device error toast */
const DeviceErrorToast = styled.div`
  position: absolute;
  bottom: 96px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid #EF4444;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 0.8125rem;
  color: #FCA5A5;
  cursor: pointer;
  white-space: nowrap;
  z-index: 10;
`;

/* Control bar */
const ControlBar = styled.div`
  height: 86px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-top: 1px solid #1a1a1a;
  flex-shrink: 0;
`;

const CtrlBtn = styled.button<{ $active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 72px;
  height: 62px;
  border-radius: 10px;
  border: none;
  background: ${({ $active }) => $active ? '#5FFB7A' : '#1a1a1a'};
  color: ${({ $active }) => $active ? '#000' : '#9CA3AF'};
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  &:hover {
    background: ${({ $active }) => $active ? '#4de868' : '#242424'};
  }
`;

const CtrlIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CtrlLabel = styled.span`font-size: 0.6875rem; font-weight: 600;`;

/* Leave dialog */
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Dialog = styled.div`
  background: #111;
  border: 1px solid #2A2A2A;
  border-top: 3px solid #EF4444;
  border-radius: 12px;
  padding: 28px 28px 20px;
  width: 400px;
`;

const DialogTitle = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 20px;
  text-align: center;
`;

const DialogBtns = styled.div`display: flex; gap: 10px;`;

const DialogCancel = styled.button`
  flex: 1;
  background: transparent;
  border: 1px solid #2A2A2A;
  border-radius: 8px;
  color: #9CA3AF;
  padding: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  &:hover { border-color: #9CA3AF; color: #fff; }
`;

const DialogLeave = styled.button`
  flex: 1;
  background: rgba(239,68,68,0.15);
  border: 1px solid #EF4444;
  border-radius: 8px;
  color: #EF4444;
  padding: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  &:hover { background: rgba(239,68,68,0.25); }
`;
