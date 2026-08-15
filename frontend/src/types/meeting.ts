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
