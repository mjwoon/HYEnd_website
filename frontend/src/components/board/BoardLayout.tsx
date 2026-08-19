import styled from 'styled-components';
import BoardTabs from '@/components/board/BoardTabs';

interface BoardLayoutProps {
    children: React.ReactNode;
}

export default function BoardLayout({ children }: BoardLayoutProps) {
    return (
        <Wrapper>
            <Card>
                <BoardTabs />
                <Divider />
                {children}
            </Card>
        </Wrapper>
    );
}

const Wrapper = styled.div`
    max-width: 1000px;
    margin: 40px auto;
    padding: 0 24px;
`;

const Card = styled.div`
    overflow: hidden;
    display: flex;
    width: 100%;
    padding: 20px;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 16px;
    border-radius: 14px;
    border: 1px solid #40423F;
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(3px);
`;

const Divider = styled.div`
    height: 1px;
    width: 100%;
    background: ${({ theme }) => theme.colors.border};
`;
