export interface Book {
    id: number;
    title: string;
    author: string;
    tag: string;
}

export const BOOKS: Book[] = [
    { id: 1, title: '클린 코드', author: '로버트 C. 마틴', tag: 'THEORY' },
    { id: 2, title: '모던 자바스크립트 Deep Dive', author: '이웅모', tag: 'WEB' },
    { id: 3, title: '혼자 공부하는 머신러닝+딥러닝', author: '박해선', tag: 'AI' },
    { id: 4, title: '이것이 취업을 위한 코딩 테스트다', author: '나동빈', tag: 'ALGORITHM' },
    { id: 5, title: '파이썬 알고리즘 인터뷰', author: '박상길', tag: 'ALGORITHM' },
    { id: 6, title: '스프링 부트와 AWS로 혼자 구현하는 웹 서비스', author: '이동욱', tag: 'BACK' },
    { id: 7, title: '리액트를 다루는 기술', author: '김민준', tag: 'FRONT' },
    { id: 8, title: '데이터베이스 개론', author: '김연희', tag: 'DB' },
];
