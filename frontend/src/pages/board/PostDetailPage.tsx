import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useAuthStore } from '@/store/authStore';
import { postService, PostDetail, PostComment, BoardType } from '@/services/postService';

const BOARD_LABELS: Record<BoardType, string> = {
  CONTEST: '공모전 게시판',
  SUBMISSION: '제출 게시판',
  FREE: '자유 게시판',
};

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const boardType: BoardType = pathname.includes('contest')
    ? 'CONTEST'
    : pathname.includes('submission')
    ? 'SUBMISSION'
    : 'FREE';
  const backPath = `/board/${pathname.includes('contest') ? 'contest' : pathname.includes('submission') ? 'submission' : 'free'}`;

  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    postService.getDetail(Number(id)).then((p) => {
      setPost(p);
      setLoading(false);
    });
    postService.getComments(Number(id)).then(setComments);
  }, [id]);

  const handleAddComment = async () => {
    if (!commentText.trim() || !id) return;
    const added = await postService.addComment(Number(id), {
      authorName: user?.fullName || '익명',
      content: commentText.trim(),
    });
    setComments((prev) => [...prev, added]);
    setCommentText('');
  };

  const handleDeleteComment = async (commentId: number) => {
    await postService.removeComment(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const handleDeletePost = async () => {
    if (!id || !confirm('게시글을 삭제하시겠습니까?')) return;
    await postService.remove(Number(id));
    navigate(backPath);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  if (loading) return <Wrapper><Card><EmptyText>불러오는 중...</EmptyText></Card></Wrapper>;
  if (!post) return <Wrapper><Card><EmptyText>게시글을 찾을 수 없습니다.</EmptyText></Card></Wrapper>;

  return (
    <Wrapper>
      <Card>
        <PageHeader>
          <BackButton onClick={() => navigate(backPath)}>← {BOARD_LABELS[boardType]}</BackButton>
          {isAdmin && <DeletePostBtn onClick={handleDeletePost}>삭제</DeletePostBtn>}
        </PageHeader>

        <PostTitle>{post.title}</PostTitle>
        <PostMeta>
          <span>{post.authorName}</span>
          <span>{formatDate(post.createdAt)}</span>
          <span>조회 {post.viewCount}</span>
        </PostMeta>

        <Divider />

        <PostContent>{post.content}</PostContent>

        {(post.images?.length ?? 0) > 0 && (
          <ImageGrid>
            {(post.images ?? []).map((src, i) => (
              <ImageThumb key={i} onClick={() => setSelectedImage(src)}>
                <img src={src} alt={`이미지 ${i + 1}`} />
              </ImageThumb>
            ))}
          </ImageGrid>
        )}

        <Divider />

        <CommentSection>
          <CommentHeader>댓글 {comments.length}</CommentHeader>
          {comments.length === 0 ? (
            <EmptyText style={{ padding: '20px 0', fontSize: '0.875rem' }}>첫 댓글을 남겨보세요.</EmptyText>
          ) : (
            comments.map((c) => (
              <CommentItem key={c.id}>
                <CommentBody>
                  <CommentAuthor>{c.authorName}</CommentAuthor>
                  <CommentText>{c.content}</CommentText>
                  <CommentDate>{formatDate(c.createdAt)}</CommentDate>
                </CommentBody>
                {(isAdmin || c.authorName === (user?.fullName || '익명')) && (
                  <CommentDeleteBtn onClick={() => handleDeleteComment(c.id)}>삭제</CommentDeleteBtn>
                )}
              </CommentItem>
            ))
          )}
          <CommentInputRow>
            <CommentInput
              placeholder="댓글을 입력하세요"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); handleAddComment(); } }}
              rows={2}
            />
            <CommentSubmitBtn onClick={handleAddComment} disabled={!commentText.trim()}>등록</CommentSubmitBtn>
          </CommentInputRow>
        </CommentSection>
      </Card>

      {selectedImage && (
        <LightboxOverlay onClick={() => setSelectedImage(null)}>
          <LightboxImg src={selectedImage} onClick={(e) => e.stopPropagation()} />
        </LightboxOverlay>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    padding: 60px 40px;
    min-height: calc(100vh - 64px);
    background: ${({ theme }) => theme.colors.background};
`;

const Card = styled.div`
    width: 100%;
    max-width: 860px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.04);
    padding: 40px;
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const PageHeader = styled.div`display: flex; justify-content: space-between; align-items: center;`;

const BackButton = styled.button`
    background: none; border: none;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 0.875rem; cursor: pointer; padding: 0; font-family: inherit;
    &:hover { color: ${({ theme }) => theme.colors.neonGreen}; }
`;

const DeletePostBtn = styled.button`
    background: none; border: 1px solid rgba(255,80,80,0.4);
    color: rgba(255,120,120,0.8); border-radius: 6px;
    padding: 4px 12px; font-size: 0.8125rem; cursor: pointer; font-family: inherit;
    &:hover { background: rgba(255,80,80,0.15); }
`;

const PostTitle = styled.h1`
    font-size: 1.5rem;
    font-weight: ${({ theme }) => theme.typography.fontWeight.black};
    color: ${({ theme }) => theme.colors.text.primary};
    margin: 0;
    line-height: 1.4;
`;

const PostMeta = styled.div`
    display: flex; gap: 16px;
    font-size: 0.8125rem;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

const Divider = styled.hr`border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 0;`;

const PostContent = styled.p`
    font-size: 0.9375rem;
    color: ${({ theme }) => theme.colors.text.primary};
    line-height: 1.85;
    margin: 0;
    white-space: pre-wrap;
`;

const ImageGrid = styled.div`display: flex; flex-wrap: wrap; gap: 10px;`;

const ImageThumb = styled.div`
    width: 120px; height: 120px; border-radius: 8px; overflow: hidden;
    border: 1px solid rgba(255,255,255,0.12); cursor: pointer;
    transition: opacity 0.15s;
    &:hover { opacity: 0.8; }
    img { width: 100%; height: 100%; object-fit: cover; }
`;

const CommentSection = styled.div`display: flex; flex-direction: column; gap: 12px;`;

const CommentHeader = styled.h3`
    font-size: 1rem; font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    color: ${({ theme }) => theme.colors.neonGreen}; margin: 0;
`;

const CommentItem = styled.div`
    display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
    padding: 12px 16px; border-radius: 8px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
`;

const CommentBody = styled.div`display: flex; flex-direction: column; gap: 4px; flex: 1;`;

const CommentAuthor = styled.span`
    font-size: 0.8125rem; font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    color: ${({ theme }) => theme.colors.text.primary};
`;

const CommentText = styled.p`
    font-size: 0.9rem; color: ${({ theme }) => theme.colors.text.primary};
    margin: 0; line-height: 1.6; white-space: pre-wrap;
`;

const CommentDate = styled.span`
    font-size: 0.75rem; color: ${({ theme }) => theme.colors.text.secondary};
`;

const CommentDeleteBtn = styled.button`
    background: none; border: 1px solid rgba(255,80,80,0.3);
    color: rgba(255,100,100,0.7); border-radius: 4px;
    padding: 2px 8px; font-size: 0.75rem; cursor: pointer;
    font-family: inherit; flex-shrink: 0; align-self: flex-start;
    &:hover { background: rgba(255,80,80,0.1); }
`;

const CommentInputRow = styled.div`display: flex; gap: 10px; align-items: flex-end; margin-top: 4px;`;

const CommentInput = styled.textarea`
    flex: 1; padding: 10px 14px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.07);
    color: white; font-size: 0.9rem; font-family: inherit; outline: none; resize: none;
    &::placeholder { color: rgba(255,255,255,0.3); }
    &:focus { border-color: rgba(95,251,122,0.6); }
`;

const CommentSubmitBtn = styled.button`
    height: 44px; padding: 0 20px; border-radius: 8px; border: none;
    background: ${({ theme }) => theme.colors.neonGreen}; color: #000;
    font-size: 0.875rem; font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    font-family: inherit; cursor: pointer; white-space: nowrap;
    &:hover { opacity: 0.85; }
    &:disabled { opacity: 0.4; cursor: default; }
`;

const EmptyText = styled.p`
    text-align: center; color: ${({ theme }) => theme.colors.text.secondary}; margin: 0;
`;

const LightboxOverlay = styled.div`
    position: fixed; inset: 0; background: rgba(0,0,0,0.85);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; cursor: pointer;
`;

const LightboxImg = styled.img`
    max-width: 90vw; max-height: 90vh;
    border-radius: 8px; cursor: default;
`;
