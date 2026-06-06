const theme = {
    colors: {
        primary: '#5FFB7A',
        secondary: '#5FFB7A',
        background: '#0A0A0A',
        surface: '#111111',
        text: {
            primary: '#FFFFFF',
            secondary: '#9CA3AF',
            disabled: '#4B5563',
        },
        border: '#2A2A2A',
        error: '#EF4444',
        success: '#22C55E',
        neonGreen: '#5FFB7A',
    },
    typography: {
        fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
        fontSize: {
            bodyMin: '12px',    // 본문 최소
            body: '14px',       // 본문 기본
            bodyMax: '15px',    // 본문 최대
            semiTitle: '28px',  // 세미 타이틀
            title: '40px',      // 타이틀
        },
        fontWeight: {
            medium: 500,
            bold: 700,
            black: 900,
        },
    },
    spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
    },
    borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
    },
    shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.07)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    },
    breakpoints: {
        mobile: '480px',
        tablet: '768px',
        desktop: '1024px',
        wide: '1280px',
    },
} as const;

export type Theme = typeof theme;
export default theme;
