import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — JWT 토큰 자동 첨부
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminAccessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — 401 시 로그인 페이지로 리다이렉트
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminAccessToken');
      window.location.href = '/login';
    }
    if (error.response?.status === 403) {
      // 권한 부족 — admin/staff 권한 필요
      console.error('접근 권한이 없습니다.');
    }
    return Promise.reject(error);
  },
);

export default apiClient;
