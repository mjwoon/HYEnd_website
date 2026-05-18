import { Routes, Route } from 'react-router-dom';
import RootLayout from '@/components/layout/RootLayout';
import LandingPage from '@/pages/LandingPage';
import HomePage from '@/pages/HomePage';
import GreetingPage from '@/pages/about/GreetingPage';
import VisionPage from '@/pages/about/VisionPage';
import GalleryPage from '@/pages/about/GalleryPage';
import NoticePage from '@/pages/board/NoticePage';
import ContestPage from '@/pages/board/ContestPage';
import SubmissionPage from '@/pages/board/SubmissionPage';
import FreeBoardPage from '@/pages/board/FreeBoardPage';
import MyPostsPage from '@/pages/my/MyPostsPage';
import MyAssignmentsPage from '@/pages/my/MyAssignmentsPage';
import MyScrapsPage from '@/pages/my/MyScrapsPage';
import ContactPage from '@/pages/ContactPage';
import BooksPage from '@/pages/BooksPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="home" element={<HomePage />} />
        <Route path="about/greeting" element={<GreetingPage />} />
        <Route path="about/vision" element={<VisionPage />} />
        <Route path="about/gallery" element={<GalleryPage />} />
        <Route path="board/notice" element={<NoticePage />} />
        <Route path="board/contest" element={<ContestPage />} />
        <Route path="board/submission" element={<SubmissionPage />} />
        <Route path="board/free" element={<FreeBoardPage />} />
        <Route path="my/posts" element={<MyPostsPage />} />
        <Route path="my/assignments" element={<MyAssignmentsPage />} />
        <Route path="my/scraps" element={<MyScrapsPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="books" element={<BooksPage />} />
      </Route>
    </Routes>
  );
}
