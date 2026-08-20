# Plan D: 프론트엔드 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 회의방 목록/생성, LiveKit 음성·영상 UI, 실시간 자막, 채팅, 회의록 뷰어, 초대 링크, PWA+FCM 알림을 React로 구현한다.

**Architecture:** 기존 feature 폴더 구조(`src/features/`)에 `meeting`과 `notification` 피처를 추가한다. LiveKit Browser SDK로 SFU에 연결하고, AudioWorklet으로 오디오 청크를 캡처해 백엔드로 전송한다. STOMP over SockJS로 실시간 자막·채팅을 수신한다.

**Tech Stack:** React 18+, TypeScript, Vite, @livekit/components-react, @stomp/stompjs + sockjs-client, react-markdown + remark-gfm, firebase, vite-plugin-pwa, Zustand (기존 store 패턴 따름)

**선행 조건:** Plan A, B, C 백엔드 완료

## Global Constraints

- 기존 `src/services/` 패턴으로 API 클라이언트 추가 (axios instance 재사용)
- 기존 `src/store/` 패턴으로 Zustand store 추가
- 기존 `PrivateRoute` 래핑으로 인증 처리
- 컴포넌트 파일 200줄 이하 유지 — 초과 시 서브컴포넌트 분리
- TypeScript strict 모드 — any 금지
- 스타일: 기존 CSS 모듈 또는 인라인 스타일 패턴 따름

---

### Task 1: 의존성 설치

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`

- [ ] **Step 1: 패키지 설치**

```bash
cd frontend && npm install \
  @livekit/components-react \
  @livekit/client \
  @stomp/stompjs \
  sockjs-client \
  react-markdown \
  remark-gfm \
  firebase \
  vite-plugin-pwa
```

- [ ] **Step 2: TypeScript 타입 설치**

```bash
cd frontend && npm install -D @types/sockjs-client
```

- [ ] **Step 3: vite.config.ts에 PWA 플러그인 추가**

```typescript
// vite.config.ts (기존 설정에 추가)
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'HYEnd',
        short_name: 'HYEnd',
        description: '한양대학교 학회 플랫폼',
        theme_color: '#1a73e8',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  // ... 기존 설정 유지
})
```

- [ ] **Step 4: 빌드 확인**

```bash
cd frontend && npm run build 2>&1 | tail -5
```

예상: `✓ built in`

- [ ] **Step 5: 커밋**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vite.config.ts
git commit -m "chore: add livekit, stomp, react-markdown, firebase, pwa dependencies"
```

---

### Task 2: API 서비스 레이어

**Files:**
- Create: `frontend/src/services/meetingService.ts`
- Create: `frontend/src/types/meeting.ts`

**Interfaces:**
- Produces: 백엔드 API를 감싸는 타입 안전 함수들

- [ ] **Step 1: Meeting 타입 정의**

```typescript
// src/types/meeting.ts
export type MeetingStatus = 'WAITING' | 'ACTIVE' | 'ENDED'
export type ChatMessageType = 'TEXT' | 'FILE'

export interface MeetingRoomSummary {
  id: number
  title: string
  status: MeetingStatus
  hostName: string
  createdAt: string
}

export interface MeetingRoomDetail {
  id: number
  title: string
  description: string | null
  hostId: number
  hostName: string
  status: MeetingStatus
  livekitRoomName: string
  createdAt: string
  endedAt: string | null
}

export interface JoinMeetingResponse {
  livekitToken: string
  roomName: string
  roomId: number
}

export interface TranscriptChunk {
  transcriptId: number
  speakerId: number
  speakerName: string
  text: string
  chunkIndex: number
  createdAt: string
}

export interface ChatMessage {
  id: number
  roomId: number
  userId: number
  userName: string
  type: ChatMessageType
  content: string | null
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  createdAt: string
}

export interface MinutesData {
  id: number
  roomId: number
  content: string
  isEdited: boolean
  generatedAt: string
  updatedAt: string
}

export interface InviteResponse {
  inviteUrl: string
  token: string
  expiresAt: string
}
```

- [ ] **Step 2: meetingService 구현**

기존 `src/services/` 폴더의 axios 인스턴스(`api` 또는 `axiosInstance`)를 import해서 사용:

```typescript
// src/services/meetingService.ts
import api from './api'  // 기존 axios 인스턴스
import type {
  MeetingRoomSummary, MeetingRoomDetail, JoinMeetingResponse,
  MinutesData, InviteResponse, ChatMessage
} from '@/types/meeting'

export const meetingService = {
  getList: () =>
    api.get<{ data: MeetingRoomSummary[] }>('/api/meetings').then(r => r.data.data),

  getDetail: (id: number) =>
    api.get<{ data: MeetingRoomDetail }>(`/api/meetings/${id}`).then(r => r.data.data),

  create: (title: string, description: string) =>
    api.post<{ data: MeetingRoomDetail }>('/api/meetings', { title, description }).then(r => r.data.data),

  join: (id: number) =>
    api.post<{ data: JoinMeetingResponse }>(`/api/meetings/${id}/join`).then(r => r.data.data),

  leave: (id: number) =>
    api.post(`/api/meetings/${id}/leave`),

  end: (id: number) =>
    api.post(`/api/meetings/${id}/end`),

  delete: (id: number) =>
    api.delete(`/api/meetings/${id}`),

  uploadTranscriptChunk: (id: number, audio: Blob, chunkIndex: number, durationSeconds: number) => {
    const form = new FormData()
    form.append('audio', audio, `chunk-${chunkIndex}.webm`)
    form.append('chunkIndex', String(chunkIndex))
    form.append('durationSeconds', String(durationSeconds))
    return api.post(`/api/meetings/${id}/transcript`, form)
  },

  getMinutes: (id: number) =>
    api.get<{ data: MinutesData }>(`/api/meetings/${id}/minutes`).then(r => r.data.data),

  updateMinutes: (id: number, content: string) =>
    api.put<{ data: MinutesData }>(`/api/meetings/${id}/minutes`, { content }).then(r => r.data.data),

  createInvite: (id: number, expiresInHours: number) =>
    api.post<{ data: InviteResponse }>(`/api/meetings/${id}/invite`, { expiresInHours }).then(r => r.data.data),

  resolveInvite: (token: string) =>
    api.get<{ data: number }>(`/api/invite/${token}`).then(r => r.data.data),

  getChatHistory: (id: number, page = 0) =>
    api.get<{ data: { content: ChatMessage[] } }>(`/api/meetings/${id}/chat?page=${page}&size=50`)
       .then(r => r.data.data.content),

  uploadChatFile: (id: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<{ data: ChatMessage }>(`/api/meetings/${id}/chat/files`, form).then(r => r.data.data)
  },

  subscribeNotification: (token: string) =>
    api.post('/api/notifications/subscribe', { token }),

  unsubscribeNotification: (token: string) =>
    api.delete('/api/notifications/subscribe', { data: { token } }),
}
```

- [ ] **Step 3: 타입 에러 확인**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

예상: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/types/meeting.ts frontend/src/services/meetingService.ts
git commit -m "feat: add meeting API service layer and TypeScript types"
```

---

### Task 3: 라우터 추가 + 회의방 목록/생성 페이지

**Files:**
- Modify: `frontend/src/router/index.tsx` (또는 라우터 파일)
- Create: `frontend/src/features/meeting/pages/MeetingListPage.tsx`
- Create: `frontend/src/features/meeting/pages/MeetingCreatePage.tsx`
- Create: `frontend/src/pages/invite/InviteRedirectPage.tsx`

- [ ] **Step 1: 라우터에 회의방 경로 추가**

`AppRouter` 내 `<PrivateRoute>` 블록에 추가:

```tsx
import MeetingListPage from '@/features/meeting/pages/MeetingListPage'
import MeetingCreatePage from '@/features/meeting/pages/MeetingCreatePage'
import MeetingRoomPage from '@/features/meeting/pages/MeetingRoomPage'
import MinutesPage from '@/features/meeting/pages/MinutesPage'
import InviteRedirectPage from '@/pages/invite/InviteRedirectPage'

// PrivateRoute 블록 안에 추가
<Route path="meetings" element={<MeetingListPage />} />
<Route path="meetings/new" element={<MeetingCreatePage />} />
<Route path="meetings/:id" element={<MeetingRoomPage />} />
<Route path="meetings/:id/minutes" element={<MinutesPage />} />

// PrivateRoute 블록 밖 (로그인 전 접근 가능)
<Route path="invite/:token" element={<InviteRedirectPage />} />
```

- [ ] **Step 2: MeetingListPage 구현**

```tsx
// src/features/meeting/pages/MeetingListPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { meetingService } from '@/services/meetingService'
import type { MeetingRoomSummary } from '@/types/meeting'

export default function MeetingListPage() {
  const [rooms, setRooms] = useState<MeetingRoomSummary[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    meetingService.getList()
      .then(setRooms)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>로딩 중...</div>

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>회의방</h1>
        <button onClick={() => navigate('/meetings/new')}>+ 회의 개설</button>
      </div>
      {rooms.length === 0 ? (
        <p style={{ color: '#666' }}>진행 중인 회의가 없습니다.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {rooms.map(room => (
            <li key={room.id}
                onClick={() => navigate(`/meetings/${room.id}`)}
                style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px',
                         marginBottom: '12px', cursor: 'pointer' }}>
              <strong>{room.title}</strong>
              <span style={{ marginLeft: '12px', fontSize: '12px',
                             color: room.status === 'ACTIVE' ? '#22c55e' : '#888' }}>
                {room.status === 'ACTIVE' ? '● 진행 중' : '대기 중'}
              </span>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                개설: {room.hostName}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 3: MeetingCreatePage 구현**

```tsx
// src/features/meeting/pages/MeetingCreatePage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { meetingService } from '@/services/meetingService'

export default function MeetingCreatePage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    try {
      const room = await meetingService.create(title, description)
      navigate(`/meetings/${room.id}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>회의 개설</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label htmlFor="title">회의 제목 *</label>
          <input id="title" value={title} onChange={e => setTitle(e.target.value)}
                 required maxLength={100}
                 style={{ display: 'block', width: '100%', marginTop: '4px', padding: '8px' }} />
        </div>
        <div>
          <label htmlFor="description">설명 (선택)</label>
          <textarea id="description" value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    style={{ display: 'block', width: '100%', marginTop: '4px', padding: '8px' }} />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" disabled={submitting}>
            {submitting ? '생성 중...' : '회의 개설'}
          </button>
          <button type="button" onClick={() => navigate('/meetings')}>취소</button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: InviteRedirectPage 구현**

```tsx
// src/pages/invite/InviteRedirectPage.tsx
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { meetingService } from '@/services/meetingService'
import { useAuthStore } from '@/store/authStore'  // 기존 auth store

export default function InviteRedirectPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const isLoggedIn = useAuthStore(s => s.isLoggedIn)  // 기존 auth 상태

  useEffect(() => {
    if (!token) return
    if (!isLoggedIn) {
      navigate(`/login?redirect=/invite/${token}`)
      return
    }
    meetingService.resolveInvite(token)
      .then(roomId => navigate(`/meetings/${roomId}`))
      .catch(() => navigate('/meetings'))
  }, [token, isLoggedIn, navigate])

  return <div style={{ padding: '24px' }}>초대 링크 확인 중...</div>
}
```

- [ ] **Step 5: 빌드 확인**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 6: 커밋**

```bash
git add frontend/src/router/ \
        frontend/src/features/meeting/pages/MeetingListPage.tsx \
        frontend/src/features/meeting/pages/MeetingCreatePage.tsx \
        frontend/src/pages/invite/InviteRedirectPage.tsx
git commit -m "feat: add meeting list/create pages and invite redirect page"
```

---

### Task 4: useLiveKit 훅 + 회의방 UI

**Files:**
- Create: `frontend/src/features/meeting/hooks/useLiveKit.ts`
- Create: `frontend/src/features/meeting/pages/MeetingRoomPage.tsx`
- Create: `frontend/src/features/meeting/components/ParticipantGrid.tsx`

**Interfaces:**
- Produces:
  - `useLiveKit(token, serverUrl)` → `{ room, participants, isConnected, connect, disconnect }`

- [ ] **Step 1: useLiveKit 훅 구현**

```typescript
// src/features/meeting/hooks/useLiveKit.ts
import { useCallback, useEffect, useRef, useState } from 'react'
import { Room, RoomEvent, RemoteParticipant, LocalParticipant } from '@livekit/client'

interface UseLiveKitReturn {
  room: Room | null
  participants: (RemoteParticipant | LocalParticipant)[]
  isConnected: boolean
  connect: (token: string, serverUrl: string) => Promise<void>
  disconnect: () => void
}

export function useLiveKit(): UseLiveKitReturn {
  const roomRef = useRef<Room | null>(null)
  const [participants, setParticipants] = useState<(RemoteParticipant | LocalParticipant)[]>([])
  const [isConnected, setIsConnected] = useState(false)

  const updateParticipants = useCallback(() => {
    const r = roomRef.current
    if (!r) return
    setParticipants([r.localParticipant, ...Array.from(r.remoteParticipants.values())])
  }, [])

  const connect = useCallback(async (token: string, serverUrl: string) => {
    const room = new Room()
    roomRef.current = room
    room.on(RoomEvent.ParticipantConnected, updateParticipants)
    room.on(RoomEvent.ParticipantDisconnected, updateParticipants)
    room.on(RoomEvent.Connected, () => { setIsConnected(true); updateParticipants() })
    room.on(RoomEvent.Disconnected, () => setIsConnected(false))
    await room.connect(serverUrl, token, { audio: true, video: true })
  }, [updateParticipants])

  const disconnect = useCallback(() => {
    roomRef.current?.disconnect()
    roomRef.current = null
  }, [])

  useEffect(() => () => { roomRef.current?.disconnect() }, [])

  return { room: roomRef.current, participants, isConnected, connect, disconnect }
}
```

- [ ] **Step 2: ParticipantGrid 컴포넌트 구현**

```tsx
// src/features/meeting/components/ParticipantGrid.tsx
import { RemoteParticipant, LocalParticipant } from '@livekit/client'
import { VideoTrack, AudioTrack } from '@livekit/components-react'

interface Props {
  participants: (RemoteParticipant | LocalParticipant)[]
}

export default function ParticipantGrid({ participants }: Props) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '12px',
      padding: '12px'
    }}>
      {participants.map(p => (
        <div key={p.identity} style={{ position: 'relative', background: '#1a1a1a',
                                        borderRadius: '8px', overflow: 'hidden', aspectRatio: '16/9' }}>
          {p.videoTrackPublications.size > 0 ? (
            <VideoTrack participant={p} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                          height: '100%', color: '#fff', fontSize: '32px' }}>
              {p.name?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          {p.audioTrackPublications.size > 0 && <AudioTrack participant={p} />}
          <div style={{ position: 'absolute', bottom: '8px', left: '8px',
                        color: '#fff', fontSize: '12px', background: 'rgba(0,0,0,0.5)',
                        padding: '2px 6px', borderRadius: '4px' }}>
            {p.name ?? p.identity}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: MeetingRoomPage 구현**

```tsx
// src/features/meeting/pages/MeetingRoomPage.tsx
import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { LiveKitRoom } from '@livekit/components-react'
import { meetingService } from '@/services/meetingService'
import { useAuthStore } from '@/store/authStore'
import ParticipantGrid from '../components/ParticipantGrid'
import TranscriptPanel from '../components/TranscriptPanel'
import ChatPanel from '../components/ChatPanel'
import { useLiveKit } from '../hooks/useLiveKit'
import type { MeetingRoomDetail, JoinMeetingResponse } from '@/types/meeting'

export default function MeetingRoomPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const userId = useAuthStore(s => s.user?.id)
  const [room, setRoom] = useState<MeetingRoomDetail | null>(null)
  const [joinData, setJoinData] = useState<JoinMeetingResponse | null>(null)
  const [activeTab, setActiveTab] = useState<'transcript' | 'chat'>('transcript')
  const { participants, isConnected, connect, disconnect } = useLiveKit()

  const roomId = Number(id)

  useEffect(() => {
    if (!id) return
    meetingService.getDetail(roomId)
      .then(setRoom)
    meetingService.join(roomId)
      .then(data => {
        setJoinData(data)
        return connect(data.livekitToken, import.meta.env.VITE_LIVEKIT_SERVER_URL)
      })
    return () => {
      meetingService.leave(roomId)
      disconnect()
    }
  }, [id])

  const handleEnd = async () => {
    if (!confirm('회의를 종료하시겠습니까?')) return
    await meetingService.end(roomId)
    navigate('/meetings')
  }

  if (!room || !joinData) return <div style={{ padding: '24px' }}>연결 중...</div>

  const isHost = room.hostId === userId

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
      {/* 좌측: 참가자 그리드 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#111' }}>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <ParticipantGrid participants={participants} />
        </div>
        {/* 하단 컨트롤 */}
        <div style={{ padding: '16px', display: 'flex', gap: '12px', justifyContent: 'center',
                      background: '#1a1a1a' }}>
          <button onClick={() => navigate(`/meetings/${roomId}/minutes`)}
                  style={{ color: '#fff', background: '#333' }}>
            회의록
          </button>
          {isHost && (
            <button onClick={handleEnd} style={{ color: '#fff', background: '#dc2626' }}>
              회의 종료
            </button>
          )}
        </div>
      </div>

      {/* 우측: 자막 + 채팅 패널 */}
      <div style={{ width: '320px', display: 'flex', flexDirection: 'column',
                    borderLeft: '1px solid #333', background: '#fff' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0' }}>
          {(['transcript', 'chat'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
                    style={{ flex: 1, padding: '12px',
                             fontWeight: activeTab === tab ? 'bold' : 'normal',
                             borderBottom: activeTab === tab ? '2px solid #1a73e8' : 'none' }}>
              {tab === 'transcript' ? '실시간 자막' : '채팅'}
            </button>
          ))}
        </div>
        {activeTab === 'transcript'
          ? <TranscriptPanel roomId={roomId} />
          : <ChatPanel roomId={roomId} />}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: .env에 LiveKit URL 추가**

`frontend/.env.example`에 추가:
```
VITE_LIVEKIT_SERVER_URL=wss://your-project.livekit.cloud
```

- [ ] **Step 5: 빌드 확인**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 6: 커밋**

```bash
git add frontend/src/features/meeting/
git commit -m "feat: add LiveKit hooks, participant grid, and meeting room page"
```

---

### Task 5: useAudioCapture 훅 (VAD + 청크 업로드)

**Files:**
- Create: `frontend/src/features/meeting/hooks/useAudioCapture.ts`
- Create: `frontend/public/audio-processor.js` (AudioWorklet 프로세서)
- Modify: `frontend/src/features/meeting/pages/MeetingRoomPage.tsx` (훅 연결)

- [ ] **Step 1: AudioWorklet 프로세서 구현**

```javascript
// public/audio-processor.js
class VadProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this._silenceCount = 0
    this._isSpeaking = false
    this._SILENCE_THRESHOLD = 0.01  // RMS 임계값
    this._SILENCE_FRAMES = 72       // ~1.5초 at 48kHz/128 samples
  }

  process(inputs) {
    const input = inputs[0]
    if (!input || !input[0]) return true

    const samples = input[0]
    const rms = Math.sqrt(samples.reduce((sum, s) => sum + s * s, 0) / samples.length)

    if (rms > this._SILENCE_THRESHOLD) {
      if (!this._isSpeaking) {
        this._isSpeaking = true
        this.port.postMessage({ type: 'speech_start' })
      }
      this._silenceCount = 0
    } else {
      if (this._isSpeaking) {
        this._silenceCount++
        if (this._silenceCount >= this._SILENCE_FRAMES) {
          this._isSpeaking = false
          this._silenceCount = 0
          this.port.postMessage({ type: 'speech_end' })
        }
      }
    }
    return true
  }
}

registerProcessor('vad-processor', VadProcessor)
```

- [ ] **Step 2: useAudioCapture 훅 구현**

```typescript
// src/features/meeting/hooks/useAudioCapture.ts
import { useCallback, useRef, useState } from 'react'
import { meetingService } from '@/services/meetingService'

const MAX_CHUNK_DURATION_MS = 30_000  // 30초 하드캡

interface UseAudioCaptureReturn {
  isCapturing: boolean
  startCapture: (roomId: number) => Promise<void>
  stopCapture: () => void
}

export function useAudioCapture(): UseAudioCaptureReturn {
  const [isCapturing, setIsCapturing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const chunkIndexRef = useRef(0)
  const chunkStartRef = useRef<number>(0)
  const chunksRef = useRef<BlobPart[]>([])

  const flushChunk = useCallback(async (roomId: number) => {
    if (chunksRef.current.length === 0) return
    const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' })
    chunksRef.current = []
    const durationSeconds = Math.round((Date.now() - chunkStartRef.current) / 1000)
    const index = chunkIndexRef.current++
    chunkStartRef.current = Date.now()
    try {
      await meetingService.uploadTranscriptChunk(roomId, blob, index, durationSeconds)
    } catch (e) {
      console.warn('청크 업로드 실패:', e)
    }
  }, [])

  const startCapture = useCallback(async (roomId: number) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const audioContext = new AudioContext()
    audioContextRef.current = audioContext

    await audioContext.audioWorklet.addModule('/audio-processor.js')
    const source = audioContext.createMediaStreamSource(stream)
    const processor = new AudioWorkletNode(audioContext, 'vad-processor')

    let maxChunkTimer: ReturnType<typeof setTimeout> | null = null

    processor.port.onmessage = async (e) => {
      if (e.data.type === 'speech_start') {
        if (mediaRecorderRef.current?.state !== 'recording') {
          chunksRef.current = []
          chunkStartRef.current = Date.now()
          mediaRecorderRef.current!.start(100)
          // 30초 하드캡
          maxChunkTimer = setTimeout(() => {
            mediaRecorderRef.current?.stop()
          }, MAX_CHUNK_DURATION_MS)
        }
      } else if (e.data.type === 'speech_end') {
        if (maxChunkTimer) clearTimeout(maxChunkTimer)
        mediaRecorderRef.current?.stop()
      }
    }

    source.connect(processor)
    processor.connect(audioContext.destination)

    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
    mediaRecorderRef.current = mediaRecorder
    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    mediaRecorder.onstop = () => flushChunk(roomId)

    setIsCapturing(true)
  }, [flushChunk])

  const stopCapture = useCallback(() => {
    mediaRecorderRef.current?.stop()
    audioContextRef.current?.close()
    setIsCapturing(false)
  }, [])

  return { isCapturing, startCapture, stopCapture }
}
```

- [ ] **Step 3: MeetingRoomPage에 AudioCapture 연결**

`MeetingRoomPage.tsx`에 추가:

```tsx
// import 추가
import { useAudioCapture } from '../hooks/useAudioCapture'

// 컴포넌트 내 추가
const { isCapturing, startCapture, stopCapture } = useAudioCapture()

// 하단 컨트롤 버튼에 추가
<button onClick={() => isCapturing ? stopCapture() : startCapture(roomId)}
        style={{ color: '#fff', background: isCapturing ? '#dc2626' : '#22c55e' }}>
  {isCapturing ? '🎤 전사 중지' : '🎤 전사 시작'}
</button>
```

- [ ] **Step 4: 커밋**

```bash
git add frontend/public/audio-processor.js \
        frontend/src/features/meeting/hooks/useAudioCapture.ts \
        frontend/src/features/meeting/pages/MeetingRoomPage.tsx
git commit -m "feat: add AudioWorklet VAD and audio chunk upload for real-time transcription"
```

---

### Task 6: useTranscriptWS + TranscriptPanel + ChatPanel

**Files:**
- Create: `frontend/src/features/meeting/hooks/useStompWS.ts`
- Create: `frontend/src/features/meeting/components/TranscriptPanel.tsx`
- Create: `frontend/src/features/meeting/components/ChatPanel.tsx`

- [ ] **Step 1: useStompWS 훅 구현**

```typescript
// src/features/meeting/hooks/useStompWS.ts
import { useEffect, useRef, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

interface SubscribeOptions<T> {
  topic: string
  onMessage: (data: T) => void
}

export function useStompWS<T>(options: SubscribeOptions<T>) {
  const clientRef = useRef<Client | null>(null)

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(options.topic, frame => {
          try {
            options.onMessage(JSON.parse(frame.body) as T)
          } catch (e) {
            console.warn('STOMP 메시지 파싱 오류', e)
          }
        })
      }
    })
    client.activate()
    clientRef.current = client
    return () => { client.deactivate() }
  }, [options.topic])

  const publish = useCallback((destination: string, body: unknown) => {
    clientRef.current?.publish({ destination, body: JSON.stringify(body) })
  }, [])

  return { publish }
}
```

- [ ] **Step 2: TranscriptPanel 구현**

```tsx
// src/features/meeting/components/TranscriptPanel.tsx
import { useState, useEffect, useRef } from 'react'
import { useStompWS } from '../hooks/useStompWS'
import type { TranscriptChunk } from '@/types/meeting'

interface Props { roomId: number }

export default function TranscriptPanel({ roomId }: Props) {
  const [chunks, setChunks] = useState<TranscriptChunk[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useStompWS<TranscriptChunk>({
    topic: `/topic/meetings/${roomId}/transcript`,
    onMessage: chunk => setChunks(prev => [...prev, chunk])
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chunks])

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {chunks.length === 0 && (
        <p style={{ color: '#999', fontSize: '13px', textAlign: 'center' }}>
          전사 시작 버튼을 누르면 실시간 자막이 표시됩니다.
        </p>
      )}
      {chunks.map(chunk => (
        <div key={chunk.transcriptId}>
          <div style={{ fontSize: '11px', color: '#888' }}>{chunk.speakerName}</div>
          <div style={{ fontSize: '14px' }}>{chunk.text}</div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
```

- [ ] **Step 3: ChatPanel 구현**

```tsx
// src/features/meeting/components/ChatPanel.tsx
import { useState, useEffect, useRef } from 'react'
import { useStompWS } from '../hooks/useStompWS'
import { meetingService } from '@/services/meetingService'
import { useAuthStore } from '@/store/authStore'
import type { ChatMessage } from '@/types/meeting'

interface Props { roomId: number }

export default function ChatPanel({ roomId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const userId = useAuthStore(s => s.user?.id)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    meetingService.getChatHistory(roomId).then(setMessages)
  }, [roomId])

  const { publish } = useStompWS<ChatMessage>({
    topic: `/topic/meetings/${roomId}/chat`,
    onMessage: msg => setMessages(prev => [...prev, msg])
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    publish(`/app/meetings/${roomId}/chat`, { content: input })
    setInput('')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await meetingService.uploadChatFile(roomId, file)
    e.target.value = ''
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ alignSelf: msg.userId === userId ? 'flex-end' : 'flex-start',
                                      maxWidth: '80%' }}>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>{msg.userName}</div>
            {msg.type === 'TEXT' ? (
              <div style={{ background: msg.userId === userId ? '#1a73e8' : '#f0f0f0',
                            color: msg.userId === userId ? '#fff' : '#000',
                            padding: '8px 12px', borderRadius: '12px', fontSize: '14px' }}>
                {msg.content}
              </div>
            ) : (
              <a href={msg.fileUrl ?? '#'} target="_blank" rel="noopener noreferrer"
                 style={{ display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '8px 12px', background: '#f0f0f0', borderRadius: '8px',
                          textDecoration: 'none', color: '#333', fontSize: '13px' }}>
                📎 {msg.fileName}
              </a>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '12px', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '8px' }}>
        <input value={input} onChange={e => setInput(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && handleSend()}
               placeholder="메시지 입력..."
               style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }} />
        <button onClick={() => fileInputRef.current?.click()} title="파일 첨부">📎</button>
        <button onClick={handleSend}>전송</button>
        <input ref={fileInputRef} type="file" hidden onChange={handleFileUpload} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 빌드 확인**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/features/meeting/hooks/useStompWS.ts \
        frontend/src/features/meeting/components/TranscriptPanel.tsx \
        frontend/src/features/meeting/components/ChatPanel.tsx
git commit -m "feat: add STOMP WebSocket hooks and TranscriptPanel, ChatPanel components"
```

---

### Task 7: 회의록 뷰어/에디터 + 초대 링크 UI

**Files:**
- Create: `frontend/src/features/meeting/pages/MinutesPage.tsx`
- Create: `frontend/src/features/meeting/components/InviteModal.tsx`
- Modify: `frontend/src/features/meeting/pages/MeetingRoomPage.tsx`

- [ ] **Step 1: MinutesPage 구현**

```tsx
// src/features/meeting/pages/MinutesPage.tsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { meetingService } from '@/services/meetingService'
import type { MinutesData } from '@/types/meeting'

export default function MinutesPage() {
  const { id } = useParams<{ id: string }>()
  const roomId = Number(id)
  const [minutes, setMinutes] = useState<MinutesData | null>(null)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    meetingService.getMinutes(roomId)
      .then(m => { setMinutes(m); setEditContent(m.content) })
      .catch(() => setError('회의록이 아직 생성되지 않았습니다.'))
      .finally(() => setLoading(false))
  }, [roomId])

  const handleSave = async () => {
    const updated = await meetingService.updateMinutes(roomId, editContent)
    setMinutes(updated)
    setEditing(false)
  }

  if (loading) return <div style={{ padding: '24px' }}>로딩 중...</div>
  if (error) return <div style={{ padding: '24px', color: '#666' }}>{error}</div>

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: '24px' }}>
        <h1>회의록</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          {editing ? (
            <>
              <button onClick={handleSave}>저장</button>
              <button onClick={() => setEditing(false)}>취소</button>
            </>
          ) : (
            <button onClick={() => setEditing(true)}>수정</button>
          )}
        </div>
      </div>
      {minutes?.isEdited && (
        <p style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>
          ✏️ 수동으로 편집된 회의록
        </p>
      )}
      {editing ? (
        <textarea
          value={editContent}
          onChange={e => setEditContent(e.target.value)}
          rows={30}
          style={{ width: '100%', padding: '12px', fontFamily: 'monospace',
                   border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
        />
      ) : (
        <div style={{ lineHeight: '1.8' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {minutes?.content ?? ''}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: InviteModal 구현**

```tsx
// src/features/meeting/components/InviteModal.tsx
import { useState } from 'react'
import { meetingService } from '@/services/meetingService'

interface Props {
  roomId: number
  onClose: () => void
}

export default function InviteModal({ roomId, onClose }: Props) {
  const [expiresInHours, setExpiresInHours] = useState(24)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const result = await meetingService.createInvite(roomId, expiresInHours)
      setInviteUrl(result.inviteUrl)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#fff', padding: '24px', borderRadius: '12px',
                    width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ margin: 0 }}>초대 링크 생성</h2>
        <div>
          <label>만료 시간</label>
          <select value={expiresInHours} onChange={e => setExpiresInHours(Number(e.target.value))}
                  style={{ display: 'block', marginTop: '4px', padding: '8px', width: '100%' }}>
            <option value={1}>1시간</option>
            <option value={24}>24시간</option>
            <option value={72}>3일</option>
            <option value={168}>7일</option>
          </select>
        </div>
        {inviteUrl ? (
          <div>
            <input readOnly value={inviteUrl}
                   style={{ width: '100%', padding: '8px', border: '1px solid #ddd',
                            borderRadius: '6px', fontSize: '13px' }} />
            <button onClick={handleCopy} style={{ marginTop: '8px', width: '100%' }}>
              {copied ? '✓ 복사됨' : '링크 복사'}
            </button>
          </div>
        ) : (
          <button onClick={handleGenerate} disabled={loading}>
            {loading ? '생성 중...' : '링크 생성'}
          </button>
        )}
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          닫기
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: MeetingRoomPage에 InviteModal 연결**

`MeetingRoomPage.tsx`에 추가:

```tsx
import InviteModal from '../components/InviteModal'

// state 추가
const [showInviteModal, setShowInviteModal] = useState(false)

// 하단 컨트롤에 버튼 추가
{isHost && (
  <button onClick={() => setShowInviteModal(true)} style={{ color: '#fff', background: '#555' }}>
    초대 링크
  </button>
)}

// return 블록에 추가
{showInviteModal && (
  <InviteModal roomId={roomId} onClose={() => setShowInviteModal(false)} />
)}
```

- [ ] **Step 4: 빌드 확인**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/features/meeting/pages/MinutesPage.tsx \
        frontend/src/features/meeting/components/InviteModal.tsx \
        frontend/src/features/meeting/pages/MeetingRoomPage.tsx
git commit -m "feat: add minutes viewer/editor and invite link modal"
```

---

### Task 8: PWA + Firebase FCM 설정

**Files:**
- Create: `frontend/public/firebase-messaging-sw.js`
- Create: `frontend/src/features/notification/useFcmToken.ts`
- Create: `frontend/src/lib/firebase.ts`
- Modify: `frontend/src/App.tsx` (또는 최상위 컴포넌트 — FCM 초기화)

- [ ] **Step 1: .env에 Firebase 설정 추가**

`frontend/.env.example`에 추가:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
```

- [ ] **Step 2: firebase.ts 구현**

```typescript
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app'
import { getMessaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseApp = initializeApp(firebaseConfig)
export const messaging = getMessaging(firebaseApp)
```

- [ ] **Step 3: firebase-messaging-sw.js (Service Worker) 구현**

```javascript
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: self.__FIREBASE_API_KEY,
  authDomain: self.__FIREBASE_AUTH_DOMAIN,
  projectId: self.__FIREBASE_PROJECT_ID,
  messagingSenderId: self.__FIREBASE_MESSAGING_SENDER_ID,
  appId: self.__FIREBASE_APP_ID,
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification ?? {}
  const link = payload.data?.link ?? '/'
  self.registration.showNotification(title ?? 'HYEnd', {
    body: body ?? '',
    icon: '/icons/icon-192.png',
    data: { link }
  })
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data.link))
})
```

- [ ] **Step 4: useFcmToken 훅 구현**

```typescript
// src/features/notification/useFcmToken.ts
import { useEffect } from 'react'
import { getToken, onMessage } from 'firebase/messaging'
import { messaging } from '@/lib/firebase'
import { meetingService } from '@/services/meetingService'

export function useFcmToken(isLoggedIn: boolean) {
  useEffect(() => {
    if (!isLoggedIn) return
    if (!('Notification' in window)) return

    Notification.requestPermission().then(permission => {
      if (permission !== 'granted') return
      getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: undefined
      })
        .then(token => {
          if (token) meetingService.subscribeNotification(token)
        })
        .catch(e => console.warn('FCM 토큰 획득 실패:', e))
    })

    const unsubscribe = onMessage(messaging, payload => {
      const { title, body } = payload.notification ?? {}
      if (title && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body: body ?? '' })
      }
    })

    return unsubscribe
  }, [isLoggedIn])
}
```

- [ ] **Step 5: App.tsx에 FCM 훅 연결**

앱 최상위 컴포넌트에서:

```tsx
import { useFcmToken } from '@/features/notification/useFcmToken'
import { useAuthStore } from '@/store/authStore'

// 컴포넌트 내부
const isLoggedIn = useAuthStore(s => s.isLoggedIn)
useFcmToken(isLoggedIn)
```

- [ ] **Step 6: 최종 빌드 확인**

```bash
cd frontend && npm run build 2>&1 | tail -10
```

예상: `✓ built in`

- [ ] **Step 7: TypeScript 타입 확인**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

예상: 에러 없음

- [ ] **Step 8: 커밋**

```bash
git add frontend/public/firebase-messaging-sw.js \
        frontend/src/lib/firebase.ts \
        frontend/src/features/notification/useFcmToken.ts \
        frontend/src/App.tsx \
        frontend/.env.example
git commit -m "feat: add PWA manifest and Firebase FCM push notification support"
```

---

**Plan D 완료 기준:** `npm run build` 성공 + `npx tsc --noEmit` 에러 없음 + 브라우저에서 `/meetings` 접속 시 목록 렌더링 + 회의 참가 시 LiveKit 연결 확인
