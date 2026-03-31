/** 사용자 */
export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  studentId?: string;
  department?: string;
  role: 'student' | 'staff' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 공지사항 */
export interface Announcement {
  id: number;
  title: string;
  content: string;
  authorId: number;
  categoryId: number;
  priority: 'normal' | 'high' | 'urgent';
  status: 'draft' | 'published';
  isPinned: boolean;
  viewCount: number;
  publishedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** 일정 */
export interface Event {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  requiresRsvp: boolean;
  createdBy: number;
  createdAt: string;
}

/** 도서 */
export interface Book {
  id: number;
  title: string;
  author?: string;
  totalQuantity: number;
  availableQuantity: number;
  isActive: boolean;
  createdAt: string;
}

/** 도서 대여 */
export interface BookRental {
  id: number;
  userId: number;
  bookId: number;
  rentalDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'pending' | 'approved' | 'rented' | 'returned' | 'overdue';
  approvedBy?: number;
  createdAt: string;
}

/** 문의 */
export interface Inquiry {
  id: number;
  title: string;
  content: string;
  authorId: number;
  category?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  isPrivate: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

/** 카테고리 */
export interface Category {
  id: number;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

/** 대시보드 통계 */
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalAnnouncements: number;
  pendingRentals: number;
  openInquiries: number;
  todayEvents: number;
}

/** API 공통 응답 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/** 페이지네이션 응답 */
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
