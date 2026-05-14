import styled from 'styled-components';
import { Outlet } from 'react-router-dom';
import BackgroundCircles from '@/components/common/BackgroundCircles';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

const PageWrapper = styled.div`
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.background};
`;

const Main = styled.main`
  flex: 1;
  padding-top: 64px;
  position: relative;
  z-index: 1;
`;

export default function RootLayout() {
  return (
    <PageWrapper>
      <BackgroundCircles />
      <Header />
      <Main>
        <Outlet />
      </Main>
      <Footer />
    </PageWrapper>
  );
}
