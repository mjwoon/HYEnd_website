import { MOCK_POSTS, MOCK_COMMENTS, type MockPost, type MockComment } from './mockData';

export type BoardType = 'CONTEST' | 'SUBMISSION' | 'FREE';

export interface PostSummary {
  id: number;
  title: string;
  authorName: string;
  viewCount: number;
  createdAt: string;
}

export interface PostDetail extends PostSummary {
  content: string;
  images: string[];
  updatedAt: string;
}

export interface PostComment {
  id: number;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface PostListParams {
  boardType: BoardType;
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
}

// TODO: replace with real API calls when backend is ready
// import apiClient from './apiClient';
// export const postService = {
//   getList: (params) => apiClient.get('/posts', { params }),
//   getDetail: (id) => apiClient.get(`/posts/${id}`),
//   create: (payload) => apiClient.post('/posts', payload),
//   remove: (id) => apiClient.delete(`/posts/${id}`),
//   getComments: (id) => apiClient.get(`/posts/${id}/comments`),
//   addComment: (id, payload) => apiClient.post(`/posts/${id}/comments`, payload),
//   removeComment: (postId, commentId) => apiClient.delete(`/posts/${postId}/comments/${commentId}`),
// };

const POSTS_KEY = 'mock_posts';
const COMMENTS_KEY = 'mock_comments';

function loadPosts(): MockPost[] {
  try {
    const raw = localStorage.getItem(POSTS_KEY);
    if (raw) return JSON.parse(raw) as MockPost[];
  } catch {}
  localStorage.setItem(POSTS_KEY, JSON.stringify(MOCK_POSTS));
  return MOCK_POSTS;
}

function savePosts(posts: MockPost[]) {
  try {
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  } catch {
    // localStorage 용량 초과 시 이미지 제거 후 재시도
    const stripped = posts.map((p) => ({ ...p, images: [] }));
    try { localStorage.setItem(POSTS_KEY, JSON.stringify(stripped)); } catch {}
  }
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

export const postService = {
  getList: (params: PostListParams): Promise<PageResponse<PostSummary>> => {
    const all = loadPosts().filter((p) => p.boardType === params.boardType);
    const filtered = params.keyword
      ? all.filter((p) => p.title.includes(params.keyword!) || p.authorName.includes(params.keyword!))
      : all;
    const page = params.page ?? 0;
    const size = params.size ?? 10;
    const content = filtered.slice(page * size, page * size + size);
    return delay({ content, page, size, totalElements: filtered.length, totalPages: Math.max(1, Math.ceil(filtered.length / size)) });
  },

  getDetail: (id: number): Promise<PostDetail | null> => {
    const posts = loadPosts();
    const post = posts.find((p) => p.id === id) ?? null;
    if (post) {
      post.viewCount += 1;
      if (!post.images) post.images = [];
      savePosts(posts);
    }
    return delay(post);
  },

  create: (payload: { title: string; content: string; boardType: BoardType; authorName: string; images?: string[] }): Promise<PostDetail> => {
    const posts = loadPosts();
    const newPost: MockPost = {
      id: Date.now(),
      boardType: payload.boardType,
      title: payload.title,
      content: payload.content,
      authorName: payload.authorName,
      viewCount: 0,
      images: payload.images ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    savePosts([newPost, ...posts]);
    return delay(newPost);
  },

  remove: (id: number): Promise<void> => {
    savePosts(loadPosts().filter((p) => p.id !== id));
    saveComments(loadComments().filter((c) => !(c.targetId === id && c.targetType === 'post')));
    return delay(undefined);
  },

  getComments: (postId: number): Promise<PostComment[]> => {
    const comments = loadComments()
      .filter((c) => c.targetId === postId && c.targetType === 'post')
      .map(({ id, authorName, content, createdAt }) => ({ id, authorName, content, createdAt }));
    return delay(comments);
  },

  addComment: (postId: number, payload: { authorName: string; content: string }): Promise<PostComment> => {
    const comments = loadComments();
    const newComment: MockComment = {
      id: Date.now(),
      targetId: postId,
      targetType: 'post',
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
