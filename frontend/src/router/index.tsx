import { Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {/* TODO: 추가 라우트 */}
      {/* <Route path="/announcements" element={<AnnouncementPage />} /> */}
      {/* <Route path="/calendar" element={<CalendarPage />} /> */}
      {/* <Route path="/board" element={<BoardPage />} /> */}
      {/* <Route path="/books" element={<BookPage />} /> */}
      {/* <Route path="/login" element={<LoginPage />} /> */}
    </Routes>
  );
}
