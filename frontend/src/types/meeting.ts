export type MeetingStatus = 'WAITING' | 'ACTIVE' | 'ENDED';

export interface MeetingRoomSummary {
  id: number;
  title: string;
  status: MeetingStatus;
  hostName: string;
  createdAt: string;
}

export interface MeetingRoomDetail {
  id: number;
  title: string;
  description: string | null;
  hostId: number;
  hostName: string;
  status: MeetingStatus;
  livekitRoomName: string;
  createdAt: string;
  endedAt: string | null;
}

export interface CreateMeetingRequest {
  title: string;
  description?: string;
}

export interface JoinMeetingResponse {
  livekitToken: string;
  roomName: string;
  roomId: number;
}

export interface InviteResponse {
  inviteUrl: string;
  token: string;
  expiresAt: string;
}

export interface ChatMessage {
  id: number;
  userId: number;
  senderName: string;
  content: string;
  type: 'TEXT';
  createdAt: string;
}

export interface TranscriptMessage {
  transcriptId: number;
  chunkIndex: number;
  text: string;
  speakerName: string;
}
