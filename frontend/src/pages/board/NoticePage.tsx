import {useState} from 'react';
import styled from 'styled-components';
import BoardTabs from '@/components/board/BoardTabs';
import {useAuthStore} from '@/store/authStore';

const MOCK_NOTICES = [
    {id: 1, title: '안드로이드 스튜디오 설치 관련 질문입니다', date: '2025.04.20', views: 15},
    {id: 2, title: '안드로이드 스튜디오 설치 관련 질문입니다', date: '2025.04.20', views: 15},
    {id: 3, title: '안드로이드 스튜디오 설치 관련 질문입니다', date: '2025.04.20', views: 15},
    {id: 4, title: '안드로이드 스튜디오 설치 관련 질문입니다', date: '2025.04.20', views: 15},
    {id: 5, title: '안드로이드 스튜디오 설치 관련 질문입니다', date: '2025.04.19', views: 8},
    {id: 6, title: '안드로이드 스튜디오 설치 관련 질문입니다', date: '2025.04.19', views: 3},
    {id: 7, title: '안드로이드 스튜디오 설치 관련 질문입니다', date: '2025.04.18', views: 22},
    {id: 8, title: '안드로이드 스튜디오 설치 관련 질문입니다', date: '2025.04.18', views: 11},
];

const PAGE_SIZE_OPTIONS = [10, 25, 50];

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
    background: ${({theme}) => theme.colors.border};
`;

const TableWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    align-self: stretch;
    border-radius: 8px;
    overflow: hidden;
`

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
`;

const Thead = styled.thead`
    background: rgba(255, 255, 255, 0.04);
`;

const Th = styled.th<{ $align?: string }>`
    padding: 12px 40px;
    font-size: ${({theme}) => theme.typography.fontSize.body};
    font-weight: ${({theme}) => theme.typography.fontWeight.bold};
    color: ${({theme}) => theme.colors.neonGreen};
    text-align: ${({$align}) => $align ?? 'left'};
    white-space: nowrap;
`;

const TitleTh = styled(Th)`
    padding: 14px 16px
`

const Tr = styled.tr`
    //border-top: 1px solid ${({theme}) => theme.colors.border};
    cursor: pointer;
    transition: background 0.15s;

    &:hover {
        background: rgba(95, 251, 122, 0.07);

        td:first-child {
            color: ${({theme}) => theme.colors.neonGreen};
            text-decoration: underline;
            text-underline-offset: 3px;
        }
    }
`;

const Td = styled.td<{ $align?: string }>`
    padding: 14px 16px;
    font-size: ${({theme}) => theme.typography.fontSize.bodyMin};
    font-weight: ${({theme}) => theme.typography.fontWeight.medium};
    color: ${({theme}) => theme.colors.text.secondary};
    text-align: ${({$align}) => $align ?? 'left'};
    white-space: nowrap;
`;

const TitleTd = styled(Td)`
    color: ${({theme}) => theme.colors.text.primary};
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 0;
`;

const BottomBar = styled.div`
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    gap: 8px;
`;

const PageSizeWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: ${({theme}) => theme.typography.fontSize.bodyMin};
    font-weight: ${({theme}) => theme.typography.fontWeight.medium};
    color: ${({theme}) => theme.colors.text.secondary};
    white-space: nowrap;
`;

const PageSizeSelect = styled.select`
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid ${({theme}) => theme.colors.border};
    border-radius: 6px;
    color: ${({theme}) => theme.colors.text.primary};
    font-family: ${({theme}) => theme.typography.fontFamily};
    font-size: ${({theme}) => theme.typography.fontSize.bodyMin};
    font-weight: ${({theme}) => theme.typography.fontWeight.medium};
    padding: 4px 8px;
    cursor: pointer;
    outline: none;
`;

const Pagination = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
`;

const PageBtn = styled.button<{ $active?: boolean }>`
    width: 30px;
    height: 30px;
    border-radius: 6px;
    border: none;
    background: ${({$active, theme}) => ($active ? theme.colors.neonGreen : 'transparent')};
    color: ${({$active, theme}) => ($active ? '#000' : theme.colors.text.secondary)};
    font-family: ${({theme}) => theme.typography.fontFamily};
    font-size: ${({theme}) => theme.typography.fontSize.bodyMin};
    font-weight: ${({$active, theme}) =>
            $active ? theme.typography.fontWeight.bold : theme.typography.fontWeight.medium};
    cursor: pointer;
    transition: background 0.15s, color 0.15s;

    &:hover:not(:disabled) {
        background: ${({$active}) => ($active ? undefined : 'rgba(255,255,255,0.08)')};
        color: ${({$active, theme}) => ($active ? '#000' : theme.colors.text.primary)};
    }

    &:disabled {
        opacity: 0.3;
        cursor: default;
    }
`;

const WriteButton = styled.button`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    background: ${({theme}) => theme.colors.neonGreen};
    color: #000;
    border: none;
    border-radius: 8px;
    font-family: ${({theme}) => theme.typography.fontFamily};
    font-size: ${({theme}) => theme.typography.fontSize.bodyMin};
    font-weight: ${({theme}) => theme.typography.fontWeight.bold};
    cursor: pointer;
    white-space: nowrap;
    transition: opacity 0.2s;

    &:hover {
        opacity: 0.85;
    }
`;

export default function NoticePage() {
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const user = useAuthStore((state) => state.user);
    const isAdmin = user?.role === 'admin';

    const totalPages = Math.ceil(MOCK_NOTICES.length / pageSize);
    const paginated = MOCK_NOTICES.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <Wrapper>
            <Card>
                <BoardTabs/>
                <Divider/>
                <TableWrapper>
                    <Table>
                        <Thead>
                            <tr>
                                <TitleTh>제목</TitleTh>
                                <Th $align="center">작성일</Th>
                                <Th $align="center">조회</Th>
                            </tr>
                        </Thead>
                        <tbody>
                        {paginated.map((item) => (
                            <Tr key={item.id}>
                                <TitleTd>{item.title}</TitleTd>
                                <Td $align="center">{item.date}</Td>
                                <Td $align="center">{item.views}</Td>
                            </Tr>
                        ))}
                        </tbody>
                    </Table>
                </TableWrapper>
                <Divider/>
                <BottomBar>
                    <PageSizeWrapper>
                        페이지 당
                        <PageSizeSelect
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            {PAGE_SIZE_OPTIONS.map((n) => (
                                <option key={n} value={n}>{n}개</option>
                            ))}
                        </PageSizeSelect>
                        씩 보기
                    </PageSizeWrapper>
                    <Pagination>
                        <PageBtn disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                            ‹
                        </PageBtn>
                        {Array.from({length: totalPages}, (_, i) => i + 1).map((page) => (
                            <PageBtn key={page} $active={page === currentPage} onClick={() => setCurrentPage(page)}>
                                {page}
                            </PageBtn>
                        ))}
                        <PageBtn disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                            ›
                        </PageBtn>
                    </Pagination>
                    {isAdmin && <WriteButton>새 글 작성 +</WriteButton>}
                </BottomBar>
            </Card>
        </Wrapper>
    );
}

const TableHeader = styled.div`
    display: flex; align-items: center; padding: 12px 20px; margin-top: 20px;
    background: rgba(255,255,255,0.05);
    border-top: 1px solid rgba(255,255,255,0.1); border-bottom: 1px solid rgba(255,255,255,0.1);
    color: ${({ theme }) => theme.colors.neonGreen};
    font-size: 0.875rem; font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const TableBody = styled.div``;

const Row = styled.div<{ $pinned?: boolean }>`
    display: flex; align-items: center; padding: 14px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.06); cursor: pointer;
    background: ${({ $pinned }) => $pinned ? 'rgba(95,251,122,0.03)' : 'transparent'};
    transition: background 0.15s;
    &:hover { background: rgba(255,255,255,0.04); }
`;

const ColTitle = styled.div`flex: 1; display: flex; align-items: center; gap: 8px; overflow: hidden;`;
const ColDate = styled.div`
    width: 100px; text-align: center; font-size: 0.8125rem;
    color: ${({ theme }) => theme.colors.text.secondary}; flex-shrink: 0;
`;
const ColView = styled.div`
    width: 60px; text-align: center; font-size: 0.8125rem;
    color: ${({ theme }) => theme.colors.text.secondary}; flex-shrink: 0;
`;
const ColAction = styled.div`width: 50px; text-align: center; flex-shrink: 0;`;

const DeleteBtn = styled.button`
    background: none; border: 1px solid rgba(255,80,80,0.4);
    color: rgba(255,120,120,0.8); border-radius: 4px;
    padding: 2px 8px; font-size: 0.75rem; cursor: pointer; font-family: inherit;
    &:hover { background: rgba(255,80,80,0.15); }
`;

const TitleText = styled.span<{ $pinned?: boolean }>`
    font-size: 0.9375rem;
    color: ${({ $pinned, theme }) => $pinned ? theme.colors.neonGreen : theme.colors.text.primary};
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    ${Row}:hover & { color: ${({ theme }) => theme.colors.neonGreen}; }
`;

const PinMark = styled.span`font-size: 0.75rem; flex-shrink: 0;`;

const EmptyRow = styled.div`
    padding: 48px; text-align: center;
    color: ${({ theme }) => theme.colors.text.secondary}; font-size: 0.875rem;
`;

const Footer = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 20px; border-top: 1px solid rgba(255,255,255,0.06); gap: 12px;
`;
const FooterLeft = styled.div`
    display: flex; align-items: center; gap: 8px;
    font-size: 0.8125rem; color: ${({ theme }) => theme.colors.text.secondary};
`;
const SizeSelect = styled.select`
    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
    border-radius: 6px; color: white; padding: 4px 8px; font-size: 0.8125rem;
    cursor: pointer; outline: none; option { background: #1a1a1a; }
`;
const Pagination = styled.div`display: flex; gap: 4px;`;
const PageBtn = styled.button<{ $active?: boolean }>`
    width: 32px; height: 32px; border-radius: 6px;
    border: 1px solid ${({ $active, theme }) => $active ? theme.colors.neonGreen : 'rgba(255,255,255,0.15)'};
    background: ${({ $active, theme }) => $active ? theme.colors.neonGreen : 'transparent'};
    color: ${({ $active }) => $active ? '#000' : 'white'};
    font-size: 0.875rem; cursor: pointer; transition: all 0.15s; font-family: inherit;
    &:hover:not(:disabled) { border-color: ${({ theme }) => theme.colors.neonGreen}; }
    &:disabled { opacity: 0.3; cursor: default; }
`;
const NewPostButton = styled.button`
    background: ${({ theme }) => theme.colors.neonGreen}; color: #000;
    border: none; border-radius: 8px; padding: 8px 16px; font-size: 0.875rem;
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    cursor: pointer; font-family: inherit; white-space: nowrap;
    &:hover { opacity: 0.85; }
`;
