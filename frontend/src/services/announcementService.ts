import apiClient from './apiClient';

export interface AnnouncementSummary {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementResponse {
  id: number;
  title: string;
  content: string;
  category: string;
  writer: string;
  isImportant: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementRequest {
  title: string;
  content: string;
  category: string;
  isImportant?: boolean;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface AnnouncementListParams {
  categoryId?: number;
  keyword?: string;
  page?: number;
  size?: number;
}

export const announcementService = {
  getList: (params: AnnouncementListParams = {}) =>
    apiClient.get<{ success: boolean; data: PageResponse<AnnouncementSummary> }>('/announcements', {
      params: {
        categoryId: params.categoryId,
        keyword: params.keyword,
        'pageable.page': params.page ?? 0,
        'pageable.size': params.size ?? 15,
      },
    }),

  getDetail: (id: number) =>
    apiClient.get<{ success: boolean; data: AnnouncementResponse }>(`/announcements/${id}`),

  getPinned: () =>
    apiClient.get<{ success: boolean; data: AnnouncementSummary[] }>('/announcements/pinned'),

  create: (payload: AnnouncementRequest) =>
    apiClient.post<{ success: boolean; data: AnnouncementResponse }>('/announcements', payload),

  update: (id: number, payload: AnnouncementRequest) =>
    apiClient.put<{ success: boolean; data: AnnouncementResponse }>(`/announcements/${id}`, payload),

  remove: (id: number) =>
    apiClient.delete(`/announcements/${id}`),
};
