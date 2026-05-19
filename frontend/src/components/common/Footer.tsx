import styled from 'styled-components';

const FooterWrapper = styled.footer`
    width: 100%;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 40px;
    box-sizing: border-box;
    border-top: 1px solid ${({theme}) => theme.colors.border};
`;

const Copyright = styled.p`
    font-size: 0.75rem;
    color: ${({theme}) => theme.colors.text.secondary};
    margin: 0;
`;

const SocialLinks = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
`;

const SocialLink = styled.a`
    font-size: 0.75rem;
    color: ${({theme}) => theme.colors.text.secondary};
    text-decoration: none;
    transition: color 0.2s;
    display: flex;
    align-items: center;
    gap: 4px;

    &:hover {
        color: ${({theme}) => theme.colors.text.primary};
    }
`;

const InstagramIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
);

const KakaoIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C6.477 3 2 6.582 2 11c0 2.809 1.676 5.28 4.2 6.8L5.1 21l4.15-2.17C9.74 18.94 10.86 19 12 19c5.523 0 10-3.582 10-8s-4.477-8-10-8z"/>
    </svg>
);

export default function Footer() {
    return (
        <FooterWrapper>
            <Copyright>
                Copyright © 2023 BRIX Templates | All Rights Reserved | hyend@afsIdf.com
            </Copyright>
            <SocialLinks>
                <SocialLink href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                    <InstagramIcon/>
                    {/*Instagram*/}
                </SocialLink>
                <SocialLink href="https://open.kakao.com" target="_blank" rel="noopener noreferrer">
                    <KakaoIcon/>
                    {/*KakaoTalk*/}
                </SocialLink>
            </SocialLinks>
        </FooterWrapper>
    );
}
