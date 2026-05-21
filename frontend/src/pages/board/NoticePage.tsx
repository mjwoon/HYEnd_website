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
