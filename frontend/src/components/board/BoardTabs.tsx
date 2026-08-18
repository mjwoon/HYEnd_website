import { NavLink } from 'react-router-dom';
import styled from 'styled-components';

const TabsWrapper = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
`;

const Tab = styled(NavLink)`
  padding: 8px 20px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.2s, color 0.2s, border-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: ${({ theme }) => theme.colors.text.primary};
  }

  &.active {
    background: rgba(95, 251, 122, 0.12);
    border-color: rgba(95, 251, 122, 0.35);
    color: ${({ theme }) => theme.colors.neonGreen};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }
`;

const tabs = [
  { label: '공지사항', to: '/board/notice' },
  { label: '공모전', to: '/board/contest' },
  { label: '제출게시판', to: '/board/submission' },
  { label: '자유게시판', to: '/board/free' },
];

export default function BoardTabs() {
  return (
    <TabsWrapper>
      {tabs.map((tab) => (
        <Tab key={tab.to} to={tab.to}>
          {tab.label}
        </Tab>
      ))}
    </TabsWrapper>
  );
}
