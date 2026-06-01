import {useState, useRef, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuthStore} from '@/store/authStore';
import styled from 'styled-components';
import apiClient from '@/services/apiClient';
import {announcementService} from '@/services/announcementService';

interface FileItem {
    file: File;
    name: string;
}

export default function NoticeNewPage() {
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/board/notice');
        }
    }, [isAuthenticated, navigate]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files ?? []);
        setFiles(prev => [...prev, ...selected.map(f => ({file: f, name: f.name}))]);
        e.target.value = '';
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            setError('제목과 내용을 입력해 주세요.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            if (files.length > 0) {
                const formData = new FormData();
                files.forEach(f => formData.append('files', f.file));
                await apiClient.post('/files', formData, {
                    headers: {'Content-Type': 'multipart/form-data'},
                });
            }

            await announcementService.create({
                title: title.trim(),
                content: content.trim(),
                category: '공지사항',
            });

            navigate('/board/notice');
        } catch (err: any) {
            setError(err?.response?.data?.message || '작성에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Wrapper>
            <Card>
                <PageHeader>
                    <BackButton onClick={() => navigate('/board/notice')}>← 목록으로</BackButton>
                    <PageTitle>새 글 작성</PageTitle>
                </PageHeader>

                <Field>
                    <Label>제목</Label>
                    <Input
                        placeholder="제목을 입력하세요"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        maxLength={100}
                    />
                    <CharCount>{title.length} / 100</CharCount>
                </Field>

                <Field>
                    <Label>내용</Label>
                    <Textarea
                        placeholder="내용을 입력하세요"
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        rows={12}
                    />
                </Field>

                <Field>
                    <Label>첨부파일</Label>
                    <FileZone onClick={() => fileInputRef.current?.click()}>
                        <FileIcon>📎</FileIcon>
                        <FileHint>클릭하여 파일 추가</FileHint>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            hidden
                            onChange={handleFileChange}
                        />
                    </FileZone>
                    {files.length > 0 && (
                        <FileList>
                            {files.map((f, i) => (
                                <FileChip key={i}>
                                    <span>{f.name}</span>
                                    <RemoveBtn onClick={() => removeFile(i)}>×</RemoveBtn>
                                </FileChip>
                            ))}
                        </FileList>
                    )}
                </Field>

                {error && <ErrorText>{error}</ErrorText>}

                <Actions>
                    <CancelButton onClick={() => navigate('/board/notice')}>취소</CancelButton>
                    <SubmitButton onClick={handleSubmit} disabled={loading}>
                        {loading ? '등록 중...' : '등록하기'}
                    </SubmitButton>
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
    background: ${({theme}) => theme.colors.background};
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

const PageHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
`;

const BackButton = styled.button`
    background: none;
    border: none;
    color: ${({theme}) => theme.colors.text.secondary};
    font-size: 0.875rem;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
    transition: color 0.15s;
    &:hover { color: ${({theme}) => theme.colors.neonGreen}; }
`;

const PageTitle = styled.h1`
    font-size: 1.5rem;
    font-weight: ${({theme}) => theme.typography.fontWeight.black};
    color: ${({theme}) => theme.colors.text.primary};
    margin: 0;
`;

const Field = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
`;

const Label = styled.label`
    font-size: 0.875rem;
    font-weight: ${({theme}) => theme.typography.fontWeight.bold};
    color: ${({theme}) => theme.colors.neonGreen};
`;

const Input = styled.input`
    width: 100%;
    height: 48px;
    padding: 0 16px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.07);
    color: white;
    font-size: 0.9375rem;
    font-family: inherit;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s;

    &::placeholder { color: rgba(255,255,255,0.3); }
    &:focus { border-color: rgba(95,251,122,0.7); }
`;

const CharCount = styled.span`
    position: absolute;
    right: 12px;
    bottom: 12px;
    font-size: 0.75rem;
    color: rgba(255,255,255,0.3);
`;

const Textarea = styled.textarea`
    width: 100%;
    padding: 14px 16px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.07);
    color: white;
    font-size: 0.9375rem;
    font-family: inherit;
    outline: none;
    resize: vertical;
    box-sizing: border-box;
    line-height: 1.7;
    transition: border-color 0.2s;

    &::placeholder { color: rgba(255,255,255,0.3); }
    &:focus { border-color: rgba(95,251,122,0.7); }
`;

const FileZone = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    border-radius: 8px;
    border: 1px dashed rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.04);
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;

    &:hover {
        border-color: rgba(95,251,122,0.5);
        background: rgba(95,251,122,0.04);
    }
`;

const FileIcon = styled.span`font-size: 1.1rem;`;

const FileHint = styled.span`
    font-size: 0.875rem;
    color: rgba(255,255,255,0.4);
`;

const FileList = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
`;

const FileChip = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 20px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    font-size: 0.8125rem;
    color: white;
    max-width: 240px;

    span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
`;

const RemoveBtn = styled.button`
    background: none;
    border: none;
    color: rgba(255,255,255,0.5);
    cursor: pointer;
    font-size: 1rem;
    padding: 0;
    line-height: 1;
    flex-shrink: 0;
    &:hover { color: #ff6b6b; }
`;

const ErrorText = styled.p`
    color: #ff6b6b;
    font-size: 0.875rem;
    margin: 0;
`;

const Actions = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 4px;
`;

const CancelButton = styled.button`
    height: 44px;
    padding: 0 24px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.2);
    background: transparent;
    color: rgba(255,255,255,0.7);
    font-size: 0.9375rem;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s;
    &:hover { border-color: rgba(255,255,255,0.4); color: white; }
`;

const SubmitButton = styled.button`
    height: 44px;
    padding: 0 28px;
    border-radius: 8px;
    border: none;
    background: ${({theme}) => theme.colors.neonGreen};
    color: #000;
    font-size: 0.9375rem;
    font-weight: ${({theme}) => theme.typography.fontWeight.bold};
    font-family: inherit;
    cursor: pointer;
    transition: opacity 0.15s;
    &:hover { opacity: 0.85; }
    &:disabled { opacity: 0.5; cursor: default; }
`;
