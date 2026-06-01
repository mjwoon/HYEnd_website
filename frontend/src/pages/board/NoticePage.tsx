import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import styled from 'styled-components';
import {motion, AnimatePresence} from 'motion/react';
import BoardLayout from '@/components/board/BoardLayout';
import {announcementService, AnnouncementSummary, AnnouncementResponse} from '@/services/announcementService';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export default function NoticePage() {
    const navigate = useNavigate();
    const [list, setList] = useState<AnnouncementSummary[]>([]);
    const [pinned, setPinned] = useState<AnnouncementSummary[]>([]);
    const [selected, setSelected] = useState<AnnouncementResponse | null>(null);
    /*const [keyword, setKeyword] = useState('');*/
    const [search, ] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(4);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        announcementService.getPinned().then(res => setPinned(res.data.data)).catch(() => {});
    }, []);

    useEffect(() => {
        setLoading(true);
        announcementService.getList({keyword: search || undefined, page, size: pageSize})
            .then(res => {
                setList(res.data.data.content);
                setTotalPages(Math.max(1, res.data.data.totalPages));
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [search, page, pageSize]);

    const handleRowClick = async (id: number) => {
        if (selected?.id === id) { setSelected(null); return; }
        try {
            const res = await announcementService.getDetail(id);
            setSelected(res.data.data);
        } catch {}
    };

    /*const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        setSearch(keyword);
    };*/

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString('ko-KR', {year: 'numeric', month: '2-digit', day: '2-digit'})
            .replace(/\. /g, '.').replace('.', '');

    return (
        <BoardLayout>
            <TableHeader>
                <ColTitle>제목</ColTitle>
                <ColDate>작성일</ColDate>
                <ColView>조회</ColView>
            </TableHeader>

            <TableBody>
                {pinned.map(item => (
                    <RowWrapper key={`pin-${item.id}`}>
                        <Row $pinned onClick={() => handleRowClick(item.id)} $active={selected?.id === item.id}>
                            <ColTitle>
                                <PinMark>📌</PinMark>
                                <TitleText $active={selected?.id === item.id}>{item.title}</TitleText>
                            </ColTitle>
                            <ColDate>{formatDate(item.createdAt)}</ColDate>
                            <ColView>-</ColView>
                        </Row>
                        <DetailPanel id={item.id} selected={selected}/>
                    </RowWrapper>
                ))}

                {loading ? (
                    <EmptyRow>불러오는 중...</EmptyRow>
                ) : list.length === 0 ? (
                    <EmptyRow>공지사항이 없습니다.</EmptyRow>
                ) : (
                    list.map(item => (
                        <RowWrapper key={item.id}>
                            <Row onClick={() => handleRowClick(item.id)} $active={selected?.id === item.id}>
                                <ColTitle>
                                    <TitleText $active={selected?.id === item.id}>{item.title}</TitleText>
                                </ColTitle>
                                <ColDate>{formatDate(item.createdAt)}</ColDate>
                                <ColView>{item.id}</ColView>
                            </Row>
                            <DetailPanel id={item.id} selected={selected}/>
                        </RowWrapper>
                    ))
                )}
            </TableBody>

            <Footer>
                <FooterLeft>
                    <label>페이지당</label>
                    <SizeSelect
                        value={pageSize}
                        onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}
                    >
                        {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}개</option>)}
                    </SizeSelect>
                    {/*<SearchForm onSubmit={handleSearch}>
                        <SearchInput
                            placeholder="검색"
                            value={keyword}
                            onChange={e => setKeyword(e.target.value)}
                        />
                    </SearchForm>*/}
                </FooterLeft>

                <Pagination>
                    <PageBtn onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>‹</PageBtn>
                    {Array.from({length: totalPages}, (_, i) => (
                        <PageBtn key={i} $active={i === page} onClick={() => setPage(i)}>{i + 1}</PageBtn>
                    ))}
                    <PageBtn onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>›</PageBtn>
                </Pagination>

                <NewPostButton onClick={() => navigate('/board/notice/new')}>새글작성 +</NewPostButton>
            </Footer>
        </BoardLayout>
    );
}

function DetailPanel({id, selected}: {id: number; selected: AnnouncementResponse | null}) {
    return (
        <AnimatePresence>
            {selected?.id === id && (
                <motion.div
                    initial={{opacity: 0, height: 0}}
                    animate={{opacity: 1, height: 'auto'}}
                    exit={{opacity: 0, height: 0}}
                    transition={{duration: 0.22, ease: 'easeInOut'}}
                    style={{overflow: 'hidden'}}
                >
                    <DetailBox>
                        <DetailMeta>
                            <span>작성자: {selected.writer}</span>
                            <span>조회수: {selected.viewCount}</span>
                            <span>{new Date(selected.createdAt).toLocaleDateString('ko-KR')}</span>
                        </DetailMeta>
                        <DetailContent>{selected.content}</DetailContent>
                    </DetailBox>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

const TableHeader = styled.div`
    display: flex;
    align-items: center;
    padding: 12px 20px;
    margin-top: 20px;
    background: rgba(255,255,255,0.05);
    border-top: 1px solid rgba(255,255,255,0.1);
    border-bottom: 1px solid rgba(255,255,255,0.1);
    color: ${({theme}) => theme.colors.neonGreen};
    font-size: 0.875rem;
    font-weight: ${({theme}) => theme.typography.fontWeight.bold};
`;

const TableBody = styled.div``;

const RowWrapper = styled.div``;

const Row = styled.div<{ $pinned?: boolean; $active?: boolean }>`
    display: flex;
    align-items: center;
    padding: 14px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    cursor: pointer;
    background: ${({$active}) => $active ? 'rgba(95,251,122,0.05)' : 'transparent'};
    transition: background 0.15s;

    &:hover { background: rgba(255,255,255,0.04); }
`;

const ColTitle = styled.div`
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;
`;

const ColDate = styled.div`
    width: 100px;
    text-align: center;
    font-size: 0.8125rem;
    color: ${({theme}) => theme.colors.text.secondary};
    flex-shrink: 0;
`;

const ColView = styled.div`
    width: 60px;
    text-align: center;
    font-size: 0.8125rem;
    color: ${({theme}) => theme.colors.text.secondary};
    flex-shrink: 0;
`;

const TitleText = styled.span<{ $active?: boolean }>`
    font-size: 0.9375rem;
    color: ${({$active, theme}) => $active ? theme.colors.neonGreen : theme.colors.text.primary};
    text-decoration: ${({$active}) => $active ? 'underline' : 'none'};
    text-underline-offset: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.15s;

    ${Row}:hover & {
        color: ${({theme}) => theme.colors.neonGreen};
    }
`;

const PinMark = styled.span`
    font-size: 0.75rem;
    flex-shrink: 0;
`;

const EmptyRow = styled.div`
    padding: 48px;
    text-align: center;
    color: ${({theme}) => theme.colors.text.secondary};
    font-size: 0.875rem;
`;

const DetailBox = styled.div`
    padding: 20px 28px;
    background: rgba(0,0,0,0.2);
    border-bottom: 1px solid rgba(255,255,255,0.06);
`;

const DetailMeta = styled.div`
    display: flex;
    gap: 20px;
    font-size: 0.8rem;
    color: ${({theme}) => theme.colors.text.secondary};
    margin-bottom: 14px;
`;

const DetailContent = styled.p`
    font-size: 0.9375rem;
    color: ${({theme}) => theme.colors.text.primary};
    line-height: 1.75;
    margin: 0;
    white-space: pre-wrap;
`;

const Footer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-top: 1px solid rgba(255,255,255,0.06);
    gap: 12px;
`;

const FooterLeft = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8125rem;
    color: ${({theme}) => theme.colors.text.secondary};
`;

const SizeSelect = styled.select`
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 6px;
    color: white;
    padding: 4px 8px;
    font-size: 0.8125rem;
    cursor: pointer;
    outline: none;

    option { background: #1a1a1a; }
`;

/*const SearchForm = styled.form``;

const SearchInput = styled.input`
    height: 30px;
    padding: 0 10px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.06);
    color: white;
    font-size: 0.8125rem;
    outline: none;
    width: 140px;

    &::placeholder { color: rgba(255,255,255,0.35); }
    &:focus { border-color: rgba(95,251,122,0.6); }
`;*/

const Pagination = styled.div`
    display: flex;
    gap: 4px;
`;

const PageBtn = styled.button<{ $active?: boolean }>`
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: 1px solid ${({$active, theme}) => $active ? theme.colors.neonGreen : 'rgba(255,255,255,0.15)'};
    background: ${({$active, theme}) => $active ? theme.colors.neonGreen : 'transparent'};
    color: ${({$active}) => $active ? '#000' : 'white'};
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;

    &:hover:not(:disabled) { border-color: ${({theme}) => theme.colors.neonGreen}; }
    &:disabled { opacity: 0.3; cursor: default; }
`;

const NewPostButton = styled.button`
    background: ${({theme}) => theme.colors.neonGreen};
    color: #000;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 0.875rem;
    font-weight: ${({theme}) => theme.typography.fontWeight.bold};
    cursor: pointer;
    font-family: inherit;
    white-space: nowrap;
    &:hover { opacity: 0.85; }
`;
