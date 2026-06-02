import { MOCK_ANNOUNCEMENTS, MOCK_COMMENTS, type MockAnnouncement, type MockComment } from './mockData';

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
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementComment {
  id: number;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface AnnouncementListParams {
  categoryId?: number;
  keyword?: string;
  page?: number;
  size?: number;
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

// TODO: replace with real API calls when backend is ready
// import apiClient from './apiClient';
// export const announcementService = {
//   getList: (params) => apiClient.get('/announcements', { params }),
//   getDetail: (id) => apiClient.get(`/announcements/${id}`),
//   getPinned: () => apiClient.get('/announcements/pinned'),
//   create: (payload) => apiClient.post('/announcements', payload),
//   update: (id, payload) => apiClient.put(`/announcements/${id}`, payload),
//   remove: (id) => apiClient.delete(`/announcements/${id}`),
//   getComments: (id) => apiClient.get(`/announcements/${id}/comments`),
//   addComment: (id, payload) => apiClient.post(`/announcements/${id}/comments`, payload),
//   removeComment: (annId, commentId) => apiClient.delete(`/announcements/${annId}/comments/${commentId}`),
// };

const STORAGE_KEY = 'mock_announcements';
const COMMENTS_KEY = 'mock_comments';

function load(): MockAnnouncement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MockAnnouncement[];
  } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_ANNOUNCEMENTS));
  return MOCK_ANNOUNCEMENTS;
}

function save(items: MockAnnouncement[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function loadComments(): MockComment[] {
  try {
    const raw = localStorage.getItem(COMMENTS_KEY);
    if (raw) return JSON.parse(raw) as MockComment[];
  } catch {}
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(MOCK_COMMENTS));
  return MOCK_COMMENTS;
}

function saveComments(comments: MockComment[]) {
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
}

function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const announcementService = {
  getList: (params: AnnouncementListParams = {}): Promise<PageResponse<AnnouncementSummary>> => {
    const all = load();
    const pinnedIds = new Set(all.filter((a) => a.isImportant).map((a) => a.id));
    const nonPinned = all.filter((a) => !pinnedIds.has(a.id));
    const filtered = params.keyword
      ? nonPinned.filter((a) => a.title.includes(params.keyword!) || a.writer.includes(params.keyword!))
      : nonPinned;
    const page = params.page ?? 0;
    const size = params.size ?? 10;
    const start = page * size;
    const content = filtered.slice(start, start + size);
    return delay({ content, page, size, totalElements: filtered.length, totalPages: Math.max(1, Math.ceil(filtered.length / size)), first: page === 0, last: start + size >= filtered.length });
  },

  getDetail: (id: number): Promise<AnnouncementResponse> => {
    const items = load();
    const item = items.find((a) => a.id === id);
    if (!item) return Promise.reject(new Error('Not found'));
    item.viewCount += 1;
    save(items);
    return delay(item as AnnouncementResponse);
  },

  getPinned: (): Promise<AnnouncementSummary[]> => {
    return delay(load().filter((a) => a.isImportant));
  },

  create: (payload: { title: string; content: string; category?: string; isImportant?: boolean; writer: string; images?: string[] }): Promise<AnnouncementResponse> => {
    const items = load();
    const newItem: MockAnnouncement = {
      id: Date.now(),
      title: payload.title,
      content: payload.content,
      category: payload.category ?? '공지',
      writer: payload.writer,
      isImportant: payload.isImportant ?? false,
      viewCount: 0,
      images: payload.images ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    save([newItem, ...items]);
    return delay(newItem as AnnouncementResponse);
  },

  update: (id: number, payload: Partial<AnnouncementResponse>): Promise<AnnouncementResponse> => {
    const items = load();
    const idx = items.findIndex((a) => a.id === id);
    if (idx === -1) return Promise.reject(new Error('Not found'));
    const updated = { ...items[idx], ...(payload as Partial<MockAnnouncement>), updatedAt: new Date().toISOString() } as MockAnnouncement;
    items[idx] = updated;
    save(items);
    return delay(updated as AnnouncementResponse);
  },

  remove: (id: number): Promise<void> => {
    save(load().filter((a) => a.id !== id));
    saveComments(loadComments().filter((c) => !(c.targetId === id && c.targetType === 'announcement')));
    return delay(undefined);
  },

  getComments: (announcementId: number): Promise<AnnouncementComment[]> => {
    const comments = loadComments()
      .filter((c) => c.targetId === announcementId && c.targetType === 'announcement')
      .map(({ id, authorName, content, createdAt }) => ({ id, authorName, content, createdAt }));
    return delay(comments);
  },

  addComment: (announcementId: number, payload: { authorName: string; content: string }): Promise<AnnouncementComment> => {
    const comments = loadComments();
    const newComment: MockComment = {
      id: Date.now(),
      targetId: announcementId,
      targetType: 'announcement',
      authorName: payload.authorName,
      content: payload.content,
      createdAt: new Date().toISOString(),
    };
    saveComments([...comments, newComment]);
    return delay(newComment);
  },

  removeComment: (commentId: number): Promise<void> => {
    saveComments(loadComments().filter((c) => c.id !== commentId));
    return delay(undefined);
  },
};
