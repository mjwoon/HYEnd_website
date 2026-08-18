export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  color: 'green' | 'blue' | 'yellow' | 'red' | 'purple';
}

const KEY = 'calendar_events';

const SEED: CalendarEvent[] = [
  { id: 'seed-1', date: '2026-06-05', title: '1차 프로젝트 발표', color: 'blue' },
  { id: 'seed-2', date: '2026-06-10', title: '중간 코드 리뷰', color: 'yellow' },
  { id: 'seed-3', date: '2026-06-18', title: '공모전 마감', color: 'red' },
  { id: 'seed-4', date: '2026-06-25', title: '정기 세미나', color: 'green' },
  { id: 'seed-5', date: '2026-06-30', title: '2차 과제 제출', color: 'purple' },
];

function load(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(SEED));
      return SEED;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function save(events: CalendarEvent[]) {
  localStorage.setItem(KEY, JSON.stringify(events));
}

export const calendarStore = {
  getAll(): CalendarEvent[] { return load(); },

  getByDate(date: string): CalendarEvent[] {
    return load().filter((e) => e.date === date);
  },

  add(event: Omit<CalendarEvent, 'id'>): CalendarEvent {
    const events = load();
    const next = { ...event, id: `evt-${Date.now()}` };
    save([...events, next]);
    return next;
  },

  remove(id: string) {
    save(load().filter((e) => e.id !== id));
  },
};
