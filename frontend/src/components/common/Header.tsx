import {useState} from 'react';
import {Link, useLocation} from 'react-router-dom';
import styled from 'styled-components';
import {motion, AnimatePresence} from 'motion/react';
import {useAuthStore} from '@/store/authStore';

const Nav = styled.header`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 64px;
    z-index: 100;
    background: rgba(10, 10, 10, 0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid ${({theme}) => theme.colors.border};
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 40px;
    box-sizing: border-box;
`;

const Logo = styled(Link)`
    font-size: 1.25rem;
    font-weight: 700;
    color: ${({theme}) => theme.colors.neonGreen};
    text-decoration: none;
    letter-spacing: 0.05em;
`;

const NavLinks = styled.nav`
    display: flex;
    align-items: center;
    gap: 32px;
`;

const NavItem = styled.div`
    position: relative;
`;

const NavLink = styled(Link)<{ $active: boolean }>`
    font-size: 0.9375rem;
    color: ${({$active, theme}) => ($active ? theme.colors.text.primary : theme.colors.text.secondary)};
    font-weight: ${({$active, theme}) => ($active ? theme.typography.fontWeight.bold : theme.typography.fontWeight.medium)};
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        color: ${({theme}) => theme.colors.neonGreen};
    }
`;

const DropdownTrigger = styled.span<{ $active: boolean }>`
    font-size: 0.9375rem;
    color: ${({$active, theme}) => ($active ? theme.colors.text.primary : theme.colors.text.secondary)};
    font-weight: ${({$active, theme}) => ($active ? theme.typography.fontWeight.bold : theme.typography.fontWeight.medium)};
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;

    &:hover {
        color: ${({theme}) => theme.colors.neonGreen};
    }
`;

const DropdownWrapper = styled.div`
    position: absolute;
    top: calc(100% + 12px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 200;
`;

const DropdownMenu = styled(motion.div)`
    background: ${({theme}) => theme.colors.surface};
    border: 1px solid ${({theme}) => theme.colors.border};
    border-radius: 8px;
    padding: 8px 0;
    min-width: 160px;
    overflow: hidden;
`;

const DropdownItem = styled(Link)<{ $active: boolean }>`
    display: block;
    padding: 10px 16px;
    font-size: 0.875rem;
    color: ${({$active, theme}) => ($active ? theme.colors.neonGreen : theme.colors.text.primary)};
    text-decoration: none;
    white-space: nowrap;
    transition: background 0.15s, color 0.15s;

    &:hover {
        background: rgba(57, 255, 20, 0.08);
        color: ${({theme}) => theme.colors.neonGreen};
    }
`;

const JoinUsLink = styled(Link)`
    font-size: 0.9375rem;
    color: ${({theme}) => theme.colors.neonGreen};
    text-decoration: none;
    font-weight: 600;
    transition: opacity 0.2s;

    &:hover {
        opacity: 0.8;
    }
`;

const aboutItems = [
    {label: '인사말', to: '/about/greeting'},
    {label: '비전&목표', to: '/about/vision'},
    {label: '전시관', to: '/about/gallery'},
];

const boardItems = [
    {label: '공지사항', to: '/board/notice'},
    {label: '공모전 소식', to: '/board/contest'},
    {label: '과제 제출', to: '/board/submission'},
    {label: '자유 게시판', to: '/board/free'},
];

export default function Header() {
    const {pathname} = useLocation();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const [openDropdown, setOpenDropdown] = useState<'about' | 'board' | null>(null);

    const isAboutActive = pathname.startsWith('/about');
    const isBoardActive = pathname.startsWith('/board');

    return (
        <Nav>
            <Logo to="/">HY-END</Logo>

            <NavLinks>
                <NavItem>
                    <NavLink to="/home" $active={pathname === '/home'}>
                        Home
                    </NavLink>
                </NavItem>

                <NavItem
                    onMouseEnter={() => setOpenDropdown('about')}
                    onMouseLeave={() => setOpenDropdown(null)}
                >
                    <DropdownTrigger $active={isAboutActive}>About ▾</DropdownTrigger>
                    <AnimatePresence>
                        {openDropdown === 'about' && (
                            <DropdownWrapper>
                                <DropdownMenu
                                    initial={{opacity: 0, y: -6}}
                                    animate={{opacity: 1, y: 0}}
                                    exit={{opacity: 0, y: -6}}
                                    transition={{duration: 0.18}}
                                >
                                    {aboutItems.map((item) => (
                                        <DropdownItem key={item.to} to={item.to} $active={pathname === item.to}>
                                            {item.label}
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </DropdownWrapper>
                        )}
                    </AnimatePresence>
                </NavItem>

                <NavItem
                    onMouseEnter={() => setOpenDropdown('board')}
                    onMouseLeave={() => setOpenDropdown(null)}
                >
                    <DropdownTrigger $active={isBoardActive}>Board ▾</DropdownTrigger>
                    <AnimatePresence>
                        {openDropdown === 'board' && (
                            <DropdownWrapper>
                                <DropdownMenu
                                    initial={{opacity: 0, y: -6}}
                                    animate={{opacity: 1, y: 0}}
                                    exit={{opacity: 0, y: -6}}
                                    transition={{duration: 0.18}}
                                >
                                    {boardItems.map((item) => (
                                        <DropdownItem key={item.to} to={item.to} $active={pathname === item.to}>
                                            {item.label}
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </DropdownWrapper>
                        )}
                    </AnimatePresence>
                </NavItem>

                <NavItem>
                    <NavLink to="/contact" $active={pathname === '/contact'}>
                        Contact
                    </NavLink>
                </NavItem>

                {!isAuthenticated && <JoinUsLink to="/join">Join Us →</JoinUsLink>}
            </NavLinks>
        </Nav>
    );
}
