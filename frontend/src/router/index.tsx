import { Routes, Route } from 'react-router-dom';
import RootLayout from '@/components/layout/RootLayout';
import PrivateRoute from '@/components/common/PrivateRoute';
import LandingPage from '@/pages/LandingPage';
import HomePage from '@/pages/HomePage';
import GreetingPage from '@/pages/about/GreetingPage';
import VisionPage from '@/pages/about/VisionPage';
import GalleryPage from '@/pages/about/GalleryPage';
import NoticePage from '@/pages/board/NoticePage';
import NoticeNewPage from '@/pages/board/NoticeNewPage';
import NoticeDetailPage from '@/pages/board/NoticeDetailPage';
import ContestPage from '@/pages/board/ContestPage';
import SubmissionPage from '@/pages/board/SubmissionPage';
import FreeBoardPage from '@/pages/board/FreeBoardPage';
import PostNewPage from '@/pages/board/PostNewPage';
import PostDetailPage from '@/pages/board/PostDetailPage';
import MyPostsPage from '@/pages/my/MyPostsPage';
import MyProfilePage from '@/pages/my/MyProfilePage';
import MyAssignmentsPage from '@/pages/my/MyAssignmentsPage';
import MyScrapsPage from '@/pages/my/MyScrapsPage';
import ContactPage from '@/pages/ContactPage';
import BooksPage from '@/pages/BooksPage';
import MeetingListPage from '@/pages/meeting/MeetingListPage';
import MeetingDetailPage from '@/pages/meeting/MeetingDetailPage';
import MeetingCreatePage from '@/pages/meeting/MeetingCreatePage';
import MeetingLobbyPage from '@/pages/meeting/MeetingLobbyPage';
import MeetingRoomPage from '@/pages/meeting/MeetingRoomPage';
import MeetingMinutesPage from '@/pages/meeting/MeetingMinutesPage';

export function AppRouter() {
  return (
    <Routes>
      {/* 풀스크린 회의 화면 — Header/Footer 없음 */}
      <Route path="meeting/:id/room" element={<MeetingRoomPage />} />

      <Route path="/" element={<RootLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="about/greeting" element={<GreetingPage />} />
        <Route path="about/vision" element={<VisionPage />} />
        <Route path="about/gallery" element={<GalleryPage />} />
        <Route path="contact" element={<ContactPage />} />

        <Route element={<PrivateRoute />}>
          <Route path="home" element={<HomePage />} />
          <Route path="board/notice" element={<NoticePage />} />
          <Route path="board/notice/new" element={<NoticeNewPage />} />
          <Route path="board/notice/:id" element={<NoticeDetailPage />} />
          <Route path="board/contest" element={<ContestPage />} />
          <Route path="board/contest/new" element={<PostNewPage />} />
          <Route path="board/contest/:id" element={<PostDetailPage />} />
          <Route path="board/submission" element={<SubmissionPage />} />
          <Route path="board/submission/new" element={<PostNewPage />} />
          <Route path="board/submission/:id" element={<PostDetailPage />} />
          <Route path="board/free" element={<FreeBoardPage />} />
          <Route path="board/free/new" element={<PostNewPage />} />
          <Route path="board/free/:id" element={<PostDetailPage />} />
          <Route path="my/profile" element={<MyProfilePage />} />
          <Route path="my/posts" element={<MyPostsPage />} />
          <Route path="my/assignments" element={<MyAssignmentsPage />} />
          <Route path="my/scraps" element={<MyScrapsPage />} />
          <Route path="books" element={<BooksPage />} />
          {/* 회의방 */}
          <Route path="meeting" element={<MeetingListPage />} />
          <Route path="meeting/new" element={<MeetingCreatePage />} />
          <Route path="meeting/:id" element={<MeetingDetailPage />} />
          <Route path="meeting/:id/lobby" element={<MeetingLobbyPage />} />
          <Route path="meeting/:id/minutes" element={<MeetingMinutesPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
