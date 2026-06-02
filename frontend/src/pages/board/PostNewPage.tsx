import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import styled from 'styled-components';
import { postService, BoardType } from '@/services/postService';

const BOARD_LABELS: Record<BoardType, string> = {
  CONTEST: '공모전',
  SUBMISSION: '제출',
  FREE: '자유',
};

export default function PostNewPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);

  const boardType: BoardType = pathname.includes('contest')
    ? 'CONTEST'
    : pathname.includes('submission')
    ? 'SUBMISSION'
    : 'FREE';
  const backPath = `/board/${pathname.includes('contest') ? 'contest' : pathname.includes('submission') ? 'submission' : 'free'}`;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<{ file: File; dataUrl: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const imgInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const MAX = 800;
          const scale = Math.min(1, MAX / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
        img.src = ev.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'));
    e.target.value = '';
    for (const file of files) {
      try {
        const dataUrl = await compressImage(file);
        setImages((prev) => [...prev, { file, dataUrl, name: file.name }]);
      } catch {
        setError('이미지 처리 중 오류가 발생했습니다.');
      }
    }
  };

  const removeImage = (i: number) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) { setError('제목과 내용을 입력해 주세요.'); return; }
    setError('');
    setLoading(true);
    try {
      await postService.create({
        title: title.trim(),
        content: content.trim(),
        boardType,
        authorName: user?.fullName || '익명',
        images: images.map((i) => i.dataUrl),
      });
      navigate(backPath);
    } catch {
      setError('작성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <Card>
        <PageHeader>
          <BackButton onClick={() => navigate(backPath)}>← 목록으로</BackButton>
          <PageTitle>{BOARD_LABELS[boardType]} 게시판 글 작성</PageTitle>
        </PageHeader>

        <Field>
          <Label>제목</Label>
          <Input placeholder="제목을 입력하세요" value={title} onChange={e => setTitle(e.target.value)} maxLength={100} />
          <CharCount>{title.length} / 100</CharCount>
        </Field>

        <Field>
          <Label>내용</Label>
          <Textarea placeholder="내용을 입력하세요" value={content} onChange={e => setContent(e.target.value)} rows={12} />
        </Field>

        <Field>
          <Label>이미지</Label>
          <FileZone onClick={() => imgInputRef.current?.click()}>
            <span>🖼️</span>
            <FileHint>클릭하여 이미지 추가 (여러 장 가능)</FileHint>
            <input ref={imgInputRef} type="file" accept="image/*" multiple hidden onChange={handleImageChange} />
          </FileZone>
          {images.length > 0 && (
            <ImagePreviewList>
              {images.map((img, i) => (
                <ImagePreviewItem key={i}>
                  <img src={img.dataUrl} alt={img.name} />
                  <RemoveImageBtn onClick={() => removeImage(i)}>×</RemoveImageBtn>
                </ImagePreviewItem>
              ))}
            </ImagePreviewList>
          )}
        </Field>

        {error && <ErrorText>{error}</ErrorText>}

        <Actions>
          <CancelButton onClick={() => navigate(backPath)}>취소</CancelButton>
          <SubmitButton onClick={handleSubmit} disabled={loading}>{loading ? '등록 중...' : '등록하기'}</SubmitButton>
        </Actions>
      </Card>
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
    gap: 28px;
`;

const PageHeader = styled.div`display: flex; align-items: center; gap: 16px;`;

const BackButton = styled.button`
    background: none; border: none;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 0.875rem; cursor: pointer; padding: 0; font-family: inherit;
    transition: color 0.15s;
    &:hover { color: ${({ theme }) => theme.colors.neonGreen}; }
`;

const PageTitle = styled.h1`
    font-size: 1.5rem;
    font-weight: ${({ theme }) => theme.typography.fontWeight.black};
    color: ${({ theme }) => theme.colors.text.primary};
    margin: 0;
`;

const Field = styled.div`display: flex; flex-direction: column; gap: 8px; position: relative;`;

const Label = styled.label`
    font-size: 0.875rem;
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    color: ${({ theme }) => theme.colors.neonGreen};
`;

const Input = styled.input`
    width: 100%; height: 48px; padding: 0 16px;
    border-radius: 8px; border: 1px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.07); color: white;
    font-size: 0.9375rem; font-family: inherit; outline: none; box-sizing: border-box;
    &::placeholder { color: rgba(255,255,255,0.3); }
    &:focus { border-color: rgba(95,251,122,0.7); }
`;

const CharCount = styled.span`
    position: absolute; right: 12px; bottom: 12px;
    font-size: 0.75rem; color: rgba(255,255,255,0.3);
`;

const Textarea = styled.textarea`
    width: 100%; padding: 14px 16px;
    border-radius: 8px; border: 1px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.07); color: white;
    font-size: 0.9375rem; font-family: inherit; outline: none;
    resize: vertical; box-sizing: border-box; line-height: 1.7;
    &::placeholder { color: rgba(255,255,255,0.3); }
    &:focus { border-color: rgba(95,251,122,0.7); }
`;

const FileZone = styled.div`
    display: flex; align-items: center; gap: 10px;
    padding: 14px 16px; border-radius: 8px;
    border: 1px dashed rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.04); cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    &:hover { border-color: rgba(95,251,122,0.5); background: rgba(95,251,122,0.04); }
`;

const FileHint = styled.span`font-size: 0.875rem; color: rgba(255,255,255,0.4);`;

const ImagePreviewList = styled.div`display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px;`;

const ImagePreviewItem = styled.div`
    position: relative; width: 100px; height: 100px;
    border-radius: 8px; overflow: hidden;
    border: 1px solid rgba(255,255,255,0.15);
    img { width: 100%; height: 100%; object-fit: cover; }
`;

const RemoveImageBtn = styled.button`
    position: absolute; top: 4px; right: 4px;
    background: rgba(0,0,0,0.7); border: none; color: white;
    border-radius: 50%; width: 20px; height: 20px;
    font-size: 0.8rem; cursor: pointer; line-height: 1;
    display: flex; align-items: center; justify-content: center;
    &:hover { background: rgba(255,80,80,0.8); }
`;

const ErrorText = styled.p`color: #ff6b6b; font-size: 0.875rem; margin: 0;`;

const Actions = styled.div`display: flex; justify-content: flex-end; gap: 12px; margin-top: 4px;`;

const CancelButton = styled.button`
    height: 44px; padding: 0 24px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.2); background: transparent;
    color: rgba(255,255,255,0.7); font-size: 0.9375rem; font-family: inherit; cursor: pointer;
    &:hover { border-color: rgba(255,255,255,0.4); color: white; }
`;

const SubmitButton = styled.button`
    height: 44px; padding: 0 28px; border-radius: 8px; border: none;
    background: ${({ theme }) => theme.colors.neonGreen}; color: #000;
    font-size: 0.9375rem; font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    font-family: inherit; cursor: pointer;
    &:hover { opacity: 0.85; }
    &:disabled { opacity: 0.5; cursor: default; }
`;
