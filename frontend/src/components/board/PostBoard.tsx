import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import BoardLayout from '@/components/board/BoardLayout';
import { postService, PostSummary, BoardType } from '@/services/postService';
import { useAuthStore } from '@/store/authStore';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const BOARD_PATH: Record<BoardType, string> = {
  CONTEST: 'contest',
  SUBMISSION: 'submission',
  FREE: 'free',
};

interface PostBoardProps {
  boardType: BoardType;
  adminOnly?: boolean;
}

export default function PostBoard({ boardType, adminOnly = false }: PostBoardProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const canWrite = adminOnly ? isAdmin : !!user;
  const basePath = `/board/${BOARD_PATH[boardType]}`;

  const [list, setList] = useState<PostSummary[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  const refresh = () => setTick((n) => n + 1);

  useEffect(() => {
    setLoading(true);
    postService.getList({ boardType, page, size: pageSize })
      .then(res => {
        setList(res.content);
        setTotalPages(Math.max(1, res.totalPages));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, pageSize, tick]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('삭제하시겠습니까?')) return;
    await postService.remove(id);
    setPage(0);
    refresh();
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
      .replace(/\. /g, '.').replace('.', '');

  return (
    <BoardLayout>
      <ContentArea>
      <TableHeader>
        <ColTitle>제목</ColTitle>
        <ColAuthor>작성자</ColAuthor>
        <ColDate>작성일</ColDate>
        <ColView>조회</ColView>
        {isAdmin && <ColAction />}
      </TableHeader>

      <TableBody>
        {loading ? (
          <EmptyRow>불러오는 중...</EmptyRow>
        ) : list.length === 0 ? (
          <EmptyRow>게시글이 없습니다.</EmptyRow>
        ) : (
          list.map(item => (
            <Row key={item.id} onClick={() => navigate(`${basePath}/${item.id}`)}>
              <ColTitle><TitleText>{item.title}</TitleText></ColTitle>
              <ColAuthor>{item.authorName}</ColAuthor>
              <ColDate>{formatDate(item.createdAt)}</ColDate>
              <ColView>{item.viewCount}</ColView>
              {isAdmin && (
                <ColAction>
                  <DeleteBtn onClick={(e) => handleDelete(item.id, e)}>삭제</DeleteBtn>
                </ColAction>
              )}
            </Row>
          ))
        )}
      </TableBody>

      <Footer>
        <FooterLeft>
          <label>페이지당</label>
          <SizeSelect value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}>
            {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}개</option>)}
          </SizeSelect>
        </FooterLeft>

        <Pagination>
          <PageBtn onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>‹</PageBtn>
          {Array.from({ length: totalPages }, (_, i) => (
            <PageBtn key={i} $active={i === page} onClick={() => setPage(i)}>{i + 1}</PageBtn>
          ))}
          <PageBtn onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>›</PageBtn>
        </Pagination>

        {canWrite && (
          <NewPostButton onClick={() => navigate(`${basePath}/new`)}>새글작성 +</NewPostButton>
        )}
      </Footer>
      </ContentArea>
    </BoardLayout>
  );
}

const ContentArea = styled.div`width: 100%;`;

const TableHeader = styled.div`
    display: flex; align-items: center; padding: 12px 20px;
    background: rgba(255,255,255,0.05);
    border-top: 1px solid rgba(255,255,255,0.1); border-bottom: 1px solid rgba(255,255,255,0.1);
    color: ${({ theme }) => theme.colors.neonGreen};
    font-size: 0.875rem; font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const TableBody = styled.div``;

const Row = styled.div`
    display: flex; align-items: center; padding: 14px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.06); cursor: pointer;
    transition: background 0.15s;
    &:hover { background: rgba(255,255,255,0.04); }
`;

const ColTitle = styled.div`flex: 1; display: flex; align-items: center; gap: 8px; overflow: hidden;`;
const ColAuthor = styled.div`
    width: 80px; text-align: center; font-size: 0.8125rem;
    color: ${({ theme }) => theme.colors.text.secondary}; flex-shrink: 0;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
`;
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

const TitleText = styled.span`
    font-size: 0.9375rem; color: ${({ theme }) => theme.colors.text.primary};
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    ${Row}:hover & { color: ${({ theme }) => theme.colors.neonGreen}; }
`;

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
