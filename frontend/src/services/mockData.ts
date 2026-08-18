export interface MockPost {
  id: number;
  title: string;
  content: string;
  authorName: string;
  boardType: 'CONTEST' | 'SUBMISSION' | 'FREE';
  viewCount: number;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MockAnnouncement {
  id: number;
  title: string;
  content: string;
  writer: string;
  category: string;
  isImportant: boolean;
  viewCount: number;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MockComment {
  id: number;
  targetId: number;
  targetType: 'post' | 'announcement';
  authorName: string;
  content: string;
  createdAt: string;
}

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

export const MOCK_POSTS: MockPost[] = [
  // CONTEST
  { id: 1, boardType: 'CONTEST', title: '2025 전국 대학생 AI 해커톤 공모전 참가자 모집', content: '전국 대학생을 대상으로 AI 해커톤 공모전을 개최합니다.\n\n일시: 2025년 8월 15일 ~ 17일\n장소: 서울 코엑스 B홀\n접수: 6월 30일까지\n\n팀당 최대 4명, 1인 참가 가능합니다.\n총 상금 1,000만원 규모입니다.', authorName: '학생처', viewCount: 312, images: [], createdAt: daysAgo(1), updatedAt: daysAgo(1) },
  { id: 2, boardType: 'CONTEST', title: '교내 창업 아이디어 경진대회 안내', content: '한양대학교 창업지원단에서 창업 아이디어 경진대회를 개최합니다.\n\n참가 대상: 재학생 누구나\n접수 기한: 7월 10일\n발표일: 7월 25일\n\n우수 아이디어에는 창업 지원금 및 멘토링 기회가 제공됩니다.', authorName: '창업지원단', viewCount: 198, images: [], createdAt: daysAgo(3), updatedAt: daysAgo(3) },
  { id: 3, boardType: 'CONTEST', title: '삼성 소프트웨어 챌린지 2025 참가 안내', content: '삼성전자 주관 소프트웨어 챌린지에 참가하세요.\n\n1차 코딩테스트 → 2차 프로젝트 발표 순으로 진행됩니다.\n우수 참가자에게는 삼성 인턴십 기회가 제공됩니다.', authorName: '취업지원팀', viewCount: 421, images: [], createdAt: daysAgo(5), updatedAt: daysAgo(5) },
  { id: 4, boardType: 'CONTEST', title: 'ICT 융합 캡스톤 디자인 공모전 참가 모집', content: 'ICT융합학부 학생들을 위한 캡스톤 디자인 공모전입니다.\n\n지도교수 승인 필요, 팀원 3~5명\n주제: IoT, AI, 블록체인 중 선택\n시상: 최우수 100만원, 우수 50만원', authorName: '학부사무실', viewCount: 156, images: [], createdAt: daysAgo(7), updatedAt: daysAgo(7) },
  { id: 5, boardType: 'CONTEST', title: 'UX 디자인 공모전 참가자 모집 (~7/5)', content: 'UI/UX 디자인 역량을 겨뤄보세요.\n주제: 대학생 일상을 바꾸는 앱 서비스 기획\n제출물: 와이어프레임 + 시나리오', authorName: '디자인학과', viewCount: 87, images: [], createdAt: daysAgo(9), updatedAt: daysAgo(9) },
  { id: 6, boardType: 'CONTEST', title: '2025 오픈소스 SW 개발 경진대회 공고', content: 'GitHub 기반 오픈소스 프로젝트 개발 경진대회입니다.\n기간: 5월 ~ 10월 (6개월)\n평가 기준: 커밋 수, 문서화 수준, 기능 완성도', authorName: '소프트웨어학부', viewCount: 203, images: [], createdAt: daysAgo(12), updatedAt: daysAgo(12) },
  { id: 7, boardType: 'CONTEST', title: '빅데이터 분석 공모전 팀원 구합니다', content: '빅데이터 공모전에 함께할 팀원을 모집합니다.\n역할: 데이터 분석, 시각화, 발표\n경험 무관, 열정 있는 분 환영합니다!', authorName: '김민준', viewCount: 64, images: [], createdAt: daysAgo(14), updatedAt: daysAgo(14) },
  { id: 8, boardType: 'CONTEST', title: '네이버 D2 스타트업 팩토리 공모전 안내', content: '스타트업 아이디어를 실제 서비스로 발전시킬 기회입니다.\n네이버 멘토링 및 초기 투자 검토 기회 제공.\n접수 마감: 6월 20일', authorName: '취업지원팀', viewCount: 289, images: [], createdAt: daysAgo(16), updatedAt: daysAgo(16) },

  // SUBMISSION
  { id: 101, boardType: 'SUBMISSION', title: '[1차 과제] 알고리즘 풀이 제출', content: '1차 알고리즘 과제를 제출합니다.\n\n문제: BOJ 1697, 11724, 2178\n풀이 방법: BFS/DFS 활용\n\n각 문제별 시간 복잡도와 공간 복잡도를 분석했습니다.', authorName: '지민경', viewCount: 14, images: [], createdAt: daysAgo(2), updatedAt: daysAgo(2) },
  { id: 102, boardType: 'SUBMISSION', title: '[2차 과제] React 컴포넌트 설계 제출', content: 'React 기반 컴포넌트 설계 과제를 제출합니다.\nAtoms → Molecules → Organisms 구조로 설계했으며 Storybook을 통해 확인 가능합니다.', authorName: '박서준', viewCount: 22, images: [], createdAt: daysAgo(3), updatedAt: daysAgo(3) },
  { id: 103, boardType: 'SUBMISSION', title: '[1차 과제] 데이터베이스 ERD 설계', content: '도서관 관리 시스템 ERD 설계 과제입니다.\n3NF 정규화까지 적용했으며 MySQL Workbench로 작성했습니다.', authorName: '이지현', viewCount: 18, images: [], createdAt: daysAgo(4), updatedAt: daysAgo(4) },
  { id: 104, boardType: 'SUBMISSION', title: '[3차 과제] 네트워크 패킷 분석 보고서', content: 'Wireshark를 활용한 패킷 분석 보고서를 제출합니다.\nTCP 3-way handshake 과정과 HTTP/HTTPS 차이를 분석했습니다.', authorName: '최동훈', viewCount: 9, images: [], createdAt: daysAgo(5), updatedAt: daysAgo(5) },
  { id: 105, boardType: 'SUBMISSION', title: '[2차 과제] 운영체제 프로세스 스케줄링 구현', content: 'C언어로 Round Robin, SJF, FCFS 스케줄링 알고리즘을 구현했습니다.\n각 알고리즘별 평균 대기시간을 비교 분석했습니다.', authorName: '강유진', viewCount: 31, images: [], createdAt: daysAgo(6), updatedAt: daysAgo(6) },
  { id: 106, boardType: 'SUBMISSION', title: '[최종 발표] 학기 프로젝트 결과물 제출', content: '학기 동안 진행한 팀 프로젝트 최종 결과물입니다.\n주제: 캠퍼스 커뮤니티 앱 개발\n기술 스택: React, Spring Boot, MySQL', authorName: '김태양', viewCount: 47, images: [], createdAt: daysAgo(8), updatedAt: daysAgo(8) },
  { id: 107, boardType: 'SUBMISSION', title: '[1차 과제] 선형대수 행렬 연산 풀이', content: '선형대수학 행렬 연산 과제를 NumPy를 사용하여 풀었습니다.\n역행렬, 고유값, 특이값 분해(SVD) 포함.', authorName: '오민서', viewCount: 11, images: [], createdAt: daysAgo(10), updatedAt: daysAgo(10) },
  { id: 108, boardType: 'SUBMISSION', title: '[포트폴리오] 개인 프로젝트 중간 공유', content: '개인 사이드 프로젝트 중간 결과를 공유합니다.\n주제: 독서 기록 앱 (Flutter)\n현재 진행률: 70%', authorName: '윤하은', viewCount: 28, images: [], createdAt: daysAgo(13), updatedAt: daysAgo(13) },

  // FREE
  { id: 201, boardType: 'FREE', title: '스터디 같이 하실 분 구합니다 (알고리즘)', content: '알고리즘 스터디 멤버를 모집합니다!\n\n주 2회 온라인 (화/목 저녁 9시)\n대상: 코딩테스트 준비 중인 분\n수준: 실버~골드 수준\n\n오픈채팅방 링크는 댓글로 남겨드릴게요.', authorName: '나알고', viewCount: 143, images: [], createdAt: daysAgo(1), updatedAt: daysAgo(1) },
  { id: 202, boardType: 'FREE', title: '중간고사 끝나고 MT 어떰?', content: '다들 중간고사 끝나고 뒤풀이 하고 싶지 않으세요?\n날짜 투표해봅시다. 대강 6월 셋째주 어떤가요?', authorName: '박신나', viewCount: 89, images: [], createdAt: daysAgo(2), updatedAt: daysAgo(2) },
  { id: 203, boardType: 'FREE', title: '교내 카페 메뉴 추천해주세요', content: '공대 1호관 카페 처음 가보는데 뭐가 맛있어요?\n아이스 아메리카노 말고 추천해주세요!', authorName: '카페인중독', viewCount: 67, images: [], createdAt: daysAgo(2), updatedAt: daysAgo(2) },
  { id: 204, boardType: 'FREE', title: '졸업요건 확인하는 법 아시는 분?', content: '포털에서 졸업요건 어디서 확인하는지 아시는 분 계세요?\n학사지원팀 가서 물어봐야 하나요...', authorName: '4학년새내기', viewCount: 201, images: [], createdAt: daysAgo(3), updatedAt: daysAgo(3) },
  { id: 205, boardType: 'FREE', title: '강의실 노트북 충전 문제 해결됐나요?', content: '공대 B동 강의실 콘센트 몇 개 고장난 거 학교에 민원 넣었는데 혹시 고쳐졌는지 아시는 분?', authorName: '충전필요', viewCount: 44, images: [], createdAt: daysAgo(4), updatedAt: daysAgo(4) },
  { id: 206, boardType: 'FREE', title: 'Spring Boot vs Django 어떤 게 취업에 유리할까요?', content: '백엔드 공부 중인데 Spring Boot랑 Django 중에 고민입니다.\n국내 취업 시장 기준으로 어떤 게 더 유리할까요?\n의견 공유해주시면 감사해요!', authorName: '취준생A', viewCount: 318, images: [], createdAt: daysAgo(5), updatedAt: daysAgo(5) },
  { id: 207, boardType: 'FREE', title: '도서관 열람실 자리 예약 팁 알려드림', content: '새벽 6시 정각에 바로 접속하면 창가 자리 잡을 수 있어요.\n모바일 앱보다 PC 웹이 빠른 것 같더라고요. 도움이 됐으면!', authorName: '도서관왕', viewCount: 512, images: [], createdAt: daysAgo(6), updatedAt: daysAgo(6) },
  { id: 208, boardType: 'FREE', title: '학식 오늘 뭐 나왔어요?', content: '오늘 학생식당 메뉴 아시는 분 계세요?\n앱이 자꾸 오류나서요 ㅠ', authorName: '배고파', viewCount: 73, images: [], createdAt: daysAgo(7), updatedAt: daysAgo(7) },
];

export const MOCK_ANNOUNCEMENTS: MockAnnouncement[] = [
  { id: 1, title: '재학생 프로젝트 2차 과제 마감일 공지', content: '재학생 프로젝트 2차 과제 마감일은 2025년 6월 30일(월) 오후 11:59까지입니다.\n\n제출 방법: HY-END 제출 게시판에 업로드\n파일 형식: PDF 또는 ZIP\n\n기한 내 미제출 시 감점 처리됩니다.', writer: '학생처', category: '학사', isImportant: true, viewCount: 892, images: [], createdAt: daysAgo(1), updatedAt: daysAgo(1) },
  { id: 2, title: '2025년 여름방학 도서관 운영 시간 변경 안내', content: '여름방학 기간 중 도서관 운영 시간이 변경됩니다.\n\n운영 기간: 7월 14일 ~ 8월 22일\n평일: 09:00 ~ 20:00 (기존 22:00)\n주말: 10:00 ~ 17:00\n\n열람실은 기존과 동일하게 운영됩니다.', writer: '도서관', category: '시설', isImportant: true, viewCount: 456, images: [], createdAt: daysAgo(3), updatedAt: daysAgo(3) },
  { id: 3, title: '학생증 재발급 신청 안내', content: '학생증 분실 또는 훼손 시 학생처 창구에서 재발급 신청하세요.\n\n준비물: 신분증 사본, 재발급 신청서\n비용: 5,000원\n처리 기간: 신청 후 7일 이내', writer: '학생처', category: '행정', isImportant: false, viewCount: 231, images: [], createdAt: daysAgo(5), updatedAt: daysAgo(5) },
  { id: 4, title: '소프트웨어 라이선스 신청 기간 안내 (Adobe, Microsoft)', content: 'Adobe Creative Cloud 및 Microsoft 365 학생 라이선스 신청을 받습니다.\n\n신청 기간: 6월 16일 ~ 6월 27일\n신청 방법: 포털 로그인 후 소프트웨어 신청 메뉴', writer: 'IT지원팀', category: '공지', isImportant: false, viewCount: 678, images: [], createdAt: daysAgo(7), updatedAt: daysAgo(7) },
  { id: 5, title: '교내 무선랜 점검 일정 안내 (6/14)', content: '네트워크 인프라 점검으로 인해 아래 건물 와이파이가 일시 중단됩니다.\n\n일시: 6월 14일(토) 오전 2:00 ~ 6:00\n대상: 공학관, 과학관, 도서관\n대체 수단: 유선랜 사용 권장', writer: 'IT지원팀', category: '시설', isImportant: false, viewCount: 187, images: [], createdAt: daysAgo(9), updatedAt: daysAgo(9) },
  { id: 6, title: '장학금 신청 안내 (2025-2학기)', content: '2025년 2학기 교내 장학금 신청을 받습니다.\n\n신청 기간: 7월 1일 ~ 7월 15일\n제출 서류: 장학금 신청서, 가족관계증명서, 성적증명서\n신청 방법: 포털 → 학생지원 → 장학금 신청', writer: '장학팀', category: '학사', isImportant: true, viewCount: 1024, images: [], createdAt: daysAgo(11), updatedAt: daysAgo(11) },
  { id: 7, title: '2025학년도 1학기 성적 확인 및 이의신청 안내', content: '1학기 성적 확인 및 이의신청 기간을 안내드립니다.\n\n성적 공개: 6월 20일\n이의신청 기간: 6월 20일 ~ 6월 24일\n신청 방법: 포털 → 성적 → 이의신청', writer: '교무처', category: '학사', isImportant: false, viewCount: 743, images: [], createdAt: daysAgo(13), updatedAt: daysAgo(13) },
  { id: 8, title: '학술 동아리 지원금 신청 공고', content: '2025년 2학기 학술 동아리 지원금 신청을 받습니다.\n\n신청 자격: 20인 이상 등록된 학술 동아리\n지원 금액: 최대 200만원\n신청 기간: 7월 1일 ~ 7월 20일', writer: '학생처', category: '공지', isImportant: false, viewCount: 329, images: [], createdAt: daysAgo(15), updatedAt: daysAgo(15) },
];

export const MOCK_COMMENTS: MockComment[] = [
  { id: 1, targetId: 1, targetType: 'post', authorName: '김민준', content: '저도 참가하려고 합니다! 팀원 모집 중이신 분 계신가요?', createdAt: daysAgo(0) },
  { id: 2, targetId: 1, targetType: 'post', authorName: '이서연', content: '1인 참가도 된다고 하니 도전해볼게요!', createdAt: daysAgo(0) },
  { id: 201, targetId: 201, targetType: 'post', authorName: '박현우', content: '저 관심 있어요! 카카오톡 오픈채팅 링크 공유해주세요~', createdAt: daysAgo(0) },
  { id: 301, targetId: 1, targetType: 'announcement', authorName: '김태양', content: '마감 시간 다시 한번 확인했습니다. 감사합니다!', createdAt: daysAgo(0) },
];
