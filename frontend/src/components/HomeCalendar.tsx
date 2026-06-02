import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { calendarStore, type CalendarEvent } from '../store/calendarStore';
import { useAuthStore } from '../store/authStore';

// ─────────────────────────────────────────
// Styled Components
// ─────────────────────────────────────────

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: 14px;
  border: 1px solid #40423F;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(7px);
  overflow: hidden;
  flex: 1;
  min-width: 280px;
  width: 100%;
  box-sizing: border-box;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 22px 18px;
  border-bottom: 1px solid #40423F;
`;

const MonthLabel = styled.span`
  color: #FFF;
  font-family: "Pretendard Variable";
  font-size: 17px;
  font-weight: 700;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const NavBtn = styled.button`
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: rgba(255,255,255,0.06);
  color: #C0C2C0;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  &:hover { background: rgba(255,255,255,0.14); }
`;

const AddBtn = styled.button`
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: rgba(95, 251, 122, 0.15);
  color: #5FFB7A;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  &:hover { background: rgba(95, 251, 122, 0.28); }
`;

const GridWrap = styled.div`
  padding: 16px 18px 10px;
`;

const DayHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 6px;
`;

const DayName = styled.span<{ sun?: boolean; sat?: boolean }>`
  text-align: center;
  font-family: "Pretendard Variable";
  font-size: 13px;
  font-weight: 600;
  color: ${({ sun }) => sun ? '#F87171' : ({ sat }: { sat?: boolean }) => sat ? '#60A5FA' : '#676767'};
  padding: 4px 0;
`;

const DateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
`;

const DateCell = styled.button<{
  isToday: boolean;
  isSelected: boolean;
  isSun: boolean;
  isSat: boolean;
  otherMonth: boolean;
}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 8px 0 6px;
  border-radius: 8px;
  gap: 4px;
  background: ${({ isSelected, isToday }) =>
    isSelected ? 'rgba(255,255,255,0.12)' :
    isToday ? 'rgba(95,251,122,0.10)' :
    'transparent'};
  border: ${({ isToday, isSelected }) =>
    isSelected ? '1px solid rgba(255,255,255,0.22)' :
    isToday ? '1px solid rgba(95,251,122,0.35)' :
    '1px solid transparent'};
  transition: background 0.15s;
  cursor: pointer;
  &:hover {
    background: ${({ isSelected }) => isSelected ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)'};
  }
`;

const DateNum = styled.span<{ isToday: boolean; isSun: boolean; isSat: boolean; otherMonth: boolean }>`
  font-family: "Pretendard Variable";
  font-size: 14px;
  font-weight: ${({ isToday }) => isToday ? 700 : 500};
  color: ${({ otherMonth }) => otherMonth ? '#3A3A3A' :
    ({ isSun }: { isSun: boolean; isSat: boolean; otherMonth: boolean; isToday: boolean }) => isSun ? '#F87171' :
    ({ isSat }: { isSun: boolean; isSat: boolean; otherMonth: boolean; isToday: boolean }) => isSat ? '#60A5FA' :
    '#DDD'};
  line-height: 1;
`;

const DotsRow = styled.div`
  display: flex;
  gap: 2px;
  align-items: center;
  min-height: 6px;
`;

const Dot = styled.span<{ color: string }>`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${({ color }) => COLOR_MAP[color] ?? '#5FFB7A'};
  flex-shrink: 0;
`;

const Divider = styled.div`
  height: 1px;
  background: #40423F;
  margin: 0 18px;
`;

const EventSection = styled.div`
  padding: 14px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 80px;
`;

const EventSectionLabel = styled.span`
  color: #676767;
  font-family: "Pretendard Variable";
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const EventItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 8px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
`;

const EventDot = styled.span<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ color }) => COLOR_MAP[color] ?? '#5FFB7A'};
  flex-shrink: 0;
`;

const EventTitle = styled.span`
  color: #DDD;
  font-family: "Pretendard Variable";
  font-size: 12px;
  font-weight: 500;
  flex: 1;
`;

const DeleteBtn = styled.button`
  color: #555;
  font-size: 14px;
  line-height: 1;
  padding: 0 2px;
  transition: color 0.15s;
  &:hover { color: #F87171; }
`;

const EmptyNote = styled.span`
  color: #3A3A3A;
  font-family: "Pretendard Variable";
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  padding: 12px 0;
`;

// Add form
const AddForm = styled.div`
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid #40423F;
`;

const AddFormLabel = styled.span`
  color: #5FFB7A;
  font-family: "Pretendard Variable";
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const AddFormRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const TextInput = styled.input`
  flex: 1;
  background: rgba(255,255,255,0.06);
  border: 1px solid #40423F;
  border-radius: 6px;
  color: #FFF;
  font-family: "Pretendard Variable";
  font-size: 12px;
  padding: 7px 10px;
  outline: none;
  &:focus { border-color: #5FFB7A; }
  &::placeholder { color: #555; }
`;

const DateInput = styled.input`
  background: rgba(255,255,255,0.06);
  border: 1px solid #40423F;
  border-radius: 6px;
  color: #5FFB7A;
  font-family: "Pretendard Variable";
  font-size: 12px;
  padding: 7px 10px;
  outline: none;
  width: 130px;
  &:focus { border-color: #5FFB7A; }
`;

const ColorPicker = styled.div`
  display: flex;
  gap: 6px;
`;

const ColorSwatch = styled.button<{ color: string; selected: boolean }>`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: ${({ color }) => COLOR_MAP[color]};
  border: 2px solid ${({ selected, color }) => selected ? '#FFF' : COLOR_MAP[color]};
  transition: border-color 0.15s, transform 0.15s;
  transform: ${({ selected }) => selected ? 'scale(1.2)' : 'scale(1)'};
`;

const SubmitBtn = styled.button`
  padding: 7px 14px;
  border-radius: 6px;
  background: #5FFB7A;
  color: #000;
  font-family: "Pretendard Variable";
  font-size: 12px;
  font-weight: 700;
  transition: opacity 0.15s;
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`;

const CancelFormBtn = styled.button`
  padding: 7px 10px;
  border-radius: 6px;
  background: rgba(255,255,255,0.06);
  color: #C0C2C0;
  font-family: "Pretendard Variable";
  font-size: 12px;
  font-weight: 500;
`;

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  green:  '#5FFB7A',
  blue:   '#60A5FA',
  yellow: '#FBBF24',
  red:    '#F87171',
  purple: '#C084FC',
};

const COLORS = Object.keys(COLOR_MAP) as CalendarEvent['color'][];
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function HomeCalendar() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-based
  const [selected, setSelected] = useState(todayStr());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(todayStr());
  const [newColor, setNewColor] = useState<CalendarEvent['color']>('green');
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    setEvents(calendarStore.getAll());
  }, []);

  function reload() {
    setEvents(calendarStore.getAll());
    forceUpdate((n) => n + 1);
  }

  // 달 이동
  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  // 달력 날짜 배열 계산
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells: { date: string; day: number; otherMonth: boolean }[] = [];
  // 이전 달 채우기
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    cells.push({ date: toDateStr(y, m, d), day: d, otherMonth: true });
  }
  // 이번 달
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: toDateStr(year, month, d), day: d, otherMonth: false });
  }
  // 다음 달 채우기 (6주 고정)
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    cells.push({ date: toDateStr(y, m, d), day: d, otherMonth: true });
  }

  // 날짜별 이벤트 맵
  const eventMap: Record<string, CalendarEvent[]> = {};
  events.forEach((e) => {
    if (!eventMap[e.date]) eventMap[e.date] = [];
    (eventMap[e.date] as CalendarEvent[]).push(e);
  });

  const selectedEvents = eventMap[selected] ?? [];

  function handleAdd() {
    if (!newTitle.trim()) return;
    calendarStore.add({ date: newDate, title: newTitle.trim(), color: newColor });
    setNewTitle('');
    setNewDate(selected);
    setNewColor('green');
    setShowForm(false);
    reload();
  }

  function handleDelete(id: string) {
    calendarStore.remove(id);
    reload();
  }

  function handleOpenForm() {
    setNewDate(selected);
    setShowForm(true);
  }

  return (
    <Card>
      {/* ── Header ── */}
      <Header>
        <MonthLabel>{year}년 {month + 1}월</MonthLabel>
        <HeaderRight>
          {isAdmin && (
            <AddBtn onClick={handleOpenForm} title="일정 추가">＋</AddBtn>
          )}
          <NavBtn onClick={prevMonth}>‹</NavBtn>
          <NavBtn onClick={nextMonth}>›</NavBtn>
        </HeaderRight>
      </Header>

      {/* ── Calendar Grid ── */}
      <GridWrap>
        <DayHeader>
          {DAY_NAMES.map((n, i) => (
            <DayName key={n} sun={i === 0} sat={i === 6}>{n}</DayName>
          ))}
        </DayHeader>
        <DateGrid>
          {cells.map((cell, idx) => {
            const col = idx % 7;
            const evts = eventMap[cell.date] ?? [];
            return (
              <DateCell
                key={cell.date + idx}
                isToday={cell.date === todayStr()}
                isSelected={cell.date === selected}
                isSun={col === 0}
                isSat={col === 6}
                otherMonth={cell.otherMonth}
                onClick={() => setSelected(cell.date)}
              >
                <DateNum
                  isToday={cell.date === todayStr()}
                  isSun={col === 0}
                  isSat={col === 6}
                  otherMonth={cell.otherMonth}
                >
                  {cell.day}
                </DateNum>
                <DotsRow>
                  {evts.slice(0, 3).map((e, i) => (
                    <Dot key={i} color={e.color} />
                  ))}
                </DotsRow>
              </DateCell>
            );
          })}
        </DateGrid>
      </GridWrap>

      <Divider />

      {/* ── Event List ── */}
      <EventSection>
        <EventSectionLabel>
          {selected.replace(/-/g, '. ')} 일정
        </EventSectionLabel>
        {selectedEvents.length === 0 ? (
          <EmptyNote>일정이 없습니다</EmptyNote>
        ) : (
          selectedEvents.map((e) => (
            <EventItem key={e.id}>
              <EventDot color={e.color} />
              <EventTitle>{e.title}</EventTitle>
              {isAdmin && (
                <DeleteBtn onClick={() => handleDelete(e.id)} title="삭제">×</DeleteBtn>
              )}
            </EventItem>
          ))
        )}
      </EventSection>

      {/* ── Add Form (admin only) ── */}
      {showForm && isAdmin && (
        <AddForm>
          <AddFormLabel>새 일정 추가</AddFormLabel>
          <AddFormRow>
            <DateInput
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </AddFormRow>
          <AddFormRow>
            <TextInput
              placeholder="일정 제목을 입력하세요"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
          </AddFormRow>
          <AddFormRow>
            <ColorPicker>
              {COLORS.map((c) => (
                <ColorSwatch
                  key={c}
                  color={c}
                  selected={newColor === c}
                  onClick={() => setNewColor(c)}
                />
              ))}
            </ColorPicker>
            <div style={{ flex: 1 }} />
            <CancelFormBtn onClick={() => setShowForm(false)}>취소</CancelFormBtn>
            <SubmitBtn disabled={!newTitle.trim()} onClick={handleAdd}>추가</SubmitBtn>
          </AddFormRow>
        </AddForm>
      )}
    </Card>
  );
}
