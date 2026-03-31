import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from '@/pages/DashboardPage';
import LoginPage from '@/pages/LoginPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<DashboardPage />} />
      {/* TODO: 관리자 라우트 */}
      {/* <Route path="/users" element={<UsersPage />} /> */}
      {/* <Route path="/announcements" element={<AnnouncementsPage />} /> */}
      {/* <Route path="/events" element={<EventsPage />} /> */}
      {/* <Route path="/books" element={<BooksPage />} /> */}
      {/* <Route path="/inquiries" element={<InquiriesPage />} /> */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
