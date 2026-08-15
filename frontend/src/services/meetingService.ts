import apiClient from '@/services/apiClient';
import type {
  CreateMeetingRequest,
  JoinMeetingResponse,
  MeetingRoomDetail,
  MeetingRoomSummary,
} from '@/types/meeting';

type ApiResponse<T> = { success: boolean; message?: string; data: T };

export const meetingService = {
  getList: () =>
    apiClient.get<ApiResponse<MeetingRoomSummary[]>>('/meetings'),

  getDetail: (id: number) =>
    apiClient.get<ApiResponse<MeetingRoomDetail>>(`/meetings/${id}`),

  create: (payload: CreateMeetingRequest) =>
    apiClient.post<ApiResponse<MeetingRoomDetail>>('/meetings', payload),

  join: (id: number) =>
    apiClient.post<ApiResponse<JoinMeetingResponse>>(`/meetings/${id}/join`),

  leave: (id: number) =>
    apiClient.post<ApiResponse<void>>(`/meetings/${id}/leave`),

  end: (id: number) =>
    apiClient.post<ApiResponse<void>>(`/meetings/${id}/end`),

  remove: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/meetings/${id}`),
};
