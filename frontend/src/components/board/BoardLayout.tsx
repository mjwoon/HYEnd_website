import {useNavigate, useLocation} from 'react-router-dom';
import styled from 'styled-components';

const tabs = [
    {label: '공지사항', to: '/board/notice'},
    {label: '공모전', to: '/board/contest'},
    {label: '제출게시판', to: '/board/submission'},
    {label: '자유게시판', to: '/board/free'},
];

interface BoardLayoutProps {
    children: React.ReactNode;
    onNewPost?: () => void;
    showNewPost?: boolean;
}

export default function BoardLayout({children, onNewPost, showNewPost}: BoardLayoutProps) {
    const navigate = useNavigate();
    const {pathname} = useLocation();

    return (
        <Wrapper>
            <Card>
                <Tabs>
                    {tabs.map(tab => (
                        <Tab
                            key={tab.to}
                            $active={pathname === tab.to}
                            onClick={() => navigate(tab.to)}
                        >
                            {tab.label}
                        </Tab>
                    ))}
                </Tabs>

                {children}

                {showNewPost && (
                    <NewPostButton onClick={onNewPost}>새글작성 +</NewPostButton>
                )}
            </Card>
        </Wrapper>
    );
}

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 60px 40px;
    min-height: calc(100vh - 64px);
    background: ${({theme}) => theme.colors.background};
`;

const Card = styled.div`
    width: 100%;
    max-width: 860px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.04);
    overflow: hidden;
`;

const Tabs = styled.div`
    display: flex;
    gap: 8px;
    padding: 20px 20px 0;
`;

const Tab = styled.button<{ $active: boolean }>`
    padding: 8px 20px;
    border-radius: 8px;
    border: 1px solid ${({$active, theme}) => $active ? theme.colors.neonGreen : 'rgba(255,255,255,0.15)'};
    background: ${({$active, theme}) => $active ? theme.colors.neonGreen : 'transparent'};
    color: ${({$active}) => $active ? '#000' : 'rgba(255,255,255,0.6)'};
    font-size: 0.875rem;
    font-weight: ${({$active, theme}) => $active ? theme.typography.fontWeight.bold : theme.typography.fontWeight.medium};
    cursor: pointer;
    transition: all 0.15s;
    font-family: ${({theme}) => theme.typography.fontFamily};

    &:hover {
        border-color: ${({theme}) => theme.colors.neonGreen};
        color: ${({$active}) => $active ? '#000' : 'white'};
    }
`;

const NewPostButton = styled.button`
    position: absolute;
    right: 0;
    bottom: 0;
    background: ${({theme}) => theme.colors.neonGreen};
    color: #000;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 0.875rem;
    font-weight: ${({theme}) => theme.typography.fontWeight.bold};
    cursor: pointer;
    font-family: ${({theme}) => theme.typography.fontFamily};
    &:hover { opacity: 0.85; }
`;
