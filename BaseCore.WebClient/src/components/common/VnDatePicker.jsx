import React, { useState, useEffect, useRef } from 'react';
import { formatIsoToVn } from '../../utils/dateFilter';

const pad2 = (n) => String(n).padStart(2, '0');
const toIsoDate = (y, m, d) => `${y}-${pad2(m)}-${pad2(d)}`;

const parseIsoDate = (iso) => {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return { y, m, d };
};

const CAL_MONTHS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];
const CAL_WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const buildMonthGrid = (year, month) => {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = Array.from({ length: firstDow }, () => null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  return cells;
};

const isDayDisabled = (year, month, day, min, max) => {
  const iso = toIsoDate(year, month, day);
  if (min && iso < min) return true;
  if (max && iso > max) return true;
  return false;
};

export const VN_DATE_PICKER_STYLES = `
  .vn-date-field {
    flex: 1 1 180px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .vn-date-label {
    font-size: 0.72rem;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .vn-date-anchor { position: relative; }
  .vn-date-picker {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    box-sizing: border-box;
    padding: 9px 12px;
    border-radius: 9px;
    border: 1.5px solid #e5e7eb;
    background: white;
    cursor: pointer;
    transition: border-color .15s, box-shadow .15s;
    font: inherit;
    text-align: left;
  }
  .vn-date-picker:hover,
  .vn-date-picker.is-open,
  .vn-date-picker:focus-visible {
    border-color: var(--brand);
    box-shadow: 0 0 0 3px rgba(200, 169, 122, 0.18);
    outline: none;
  }
  .vn-date-icon { color: var(--brand); font-size: 0.82rem; flex-shrink: 0; }
  .vn-date-caret { color: #94a3b8; font-size: 0.65rem; flex-shrink: 0; }
  .vn-date-display {
    flex: 1;
    font-size: 0.87rem;
    color: #1e293b;
    font-weight: 600;
    user-select: none;
  }
  .vn-date-display.is-placeholder { color: #9ca3af; font-weight: 400; }
  .vn-date-calendar {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 120;
    width: min(100%, 280px);
    box-sizing: border-box;
    padding: 12px;
    border-radius: 12px;
    border: 1.5px solid #e5e7eb;
    background: white;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.14);
  }
  .vn-date-calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .vn-date-cal-title { font-size: 0.84rem; font-weight: 800; color: #1e293b; }
  .vn-date-cal-nav {
    width: 30px; height: 30px; border-radius: 8px;
    border: 1.5px solid #e5e7eb; background: #f8fafc; color: #475569;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
  }
  .vn-date-cal-nav:hover { border-color: var(--brand); color: var(--brand); }
  .vn-date-cal-weekdays, .vn-date-cal-grid {
    display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;
  }
  .vn-date-cal-weekdays { margin-bottom: 4px; }
  .vn-date-cal-weekday {
    text-align: center; font-size: 0.68rem; font-weight: 700;
    color: #94a3b8; padding: 4px 0;
  }
  .vn-date-cal-day {
    aspect-ratio: 1; border: none; border-radius: 8px; background: transparent;
    font-size: 0.8rem; font-weight: 600; color: #334155; cursor: pointer;
    display: flex; align-items: center; justify-content: center; padding: 0;
  }
  .vn-date-cal-day.is-empty { pointer-events: none; }
  .vn-date-cal-day:hover:not(.is-disabled):not(.is-selected) {
    background: #f5edd6; color: #92400e;
  }
  .vn-date-cal-day.is-today:not(.is-selected) {
    box-shadow: inset 0 0 0 1.5px var(--brand);
  }
  .vn-date-cal-day.is-selected { background: var(--brand); color: white; }
  .vn-date-cal-day.is-disabled { color: #cbd5e1; cursor: not-allowed; }
  .vn-date-cal-clear {
    width: 100%; margin-top: 10px; padding: 7px 0; border: none; border-radius: 8px;
    background: #f8fafc; color: #64748b; font-size: 0.78rem; font-weight: 600; cursor: pointer;
  }
  .vn-date-cal-clear:hover { background: #fef2f2; color: #ef4444; }
  .vn-date-row { position: relative; z-index: 1; }
`;

const VnDatePicker = ({ label, value, onChange, min, max }) => {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  const parsed = parseIsoDate(value);
  const today = new Date();
  const initialYear = parsed?.y ?? today.getFullYear();
  const initialMonth = parsed?.m ?? today.getMonth() + 1;
  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);

  const display = formatIsoToVn(value);
  const todayIso = toIsoDate(today.getFullYear(), today.getMonth() + 1, today.getDate());

  useEffect(() => {
    if (!open) return undefined;
    const p = parseIsoDate(value);
    if (p) {
      setViewYear(p.y);
      setViewMonth(p.m);
    }
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, value]);

  const shiftMonth = (delta) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setViewYear(y);
    setViewMonth(m);
  };

  const pickDay = (day) => {
    if (isDayDisabled(viewYear, viewMonth, day, min, max)) return;
    onChange(toIsoDate(viewYear, viewMonth, day));
    setOpen(false);
  };

  const grid = buildMonthGrid(viewYear, viewMonth);

  return (
    <div className="vn-date-field" ref={rootRef}>
      <span className="vn-date-label">{label}</span>
      <div className="vn-date-anchor">
        <button
          type="button"
          className={`vn-date-picker${value ? ' has-value' : ''}${open ? ' is-open' : ''}`}
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={`${label}${display ? `: ${display}` : ''}`}
        >
          <i className="fas fa-calendar-alt vn-date-icon" aria-hidden="true" />
          <span className={`vn-date-display${display ? '' : ' is-placeholder'}`}>
            {display || 'Chọn ngày'}
          </span>
          <i className={`fas fa-chevron-${open ? 'up' : 'down'} vn-date-caret`} aria-hidden="true" />
        </button>

        {open && (
          <div className="vn-date-calendar" role="dialog" aria-label={`Chọn ${label.toLowerCase()}`}>
            <div className="vn-date-calendar-header">
              <button type="button" className="vn-date-cal-nav" onClick={() => shiftMonth(-1)} aria-label="Tháng trước">
                <i className="fas fa-chevron-left" />
              </button>
              <span className="vn-date-cal-title">{CAL_MONTHS[viewMonth - 1]} {viewYear}</span>
              <button type="button" className="vn-date-cal-nav" onClick={() => shiftMonth(1)} aria-label="Tháng sau">
                <i className="fas fa-chevron-right" />
              </button>
            </div>
            <div className="vn-date-cal-weekdays">
              {CAL_WEEKDAYS.map(w => (
                <span key={w} className="vn-date-cal-weekday">{w}</span>
              ))}
            </div>
            <div className="vn-date-cal-grid">
              {grid.map((day, i) => {
                if (day == null) return <span key={`e${i}`} className="vn-date-cal-day is-empty" />;
                const iso = toIsoDate(viewYear, viewMonth, day);
                const disabled = isDayDisabled(viewYear, viewMonth, day, min, max);
                const selected = value === iso;
                const isToday = todayIso === iso;
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={disabled}
                    className={[
                      'vn-date-cal-day',
                      selected ? 'is-selected' : '',
                      isToday ? 'is-today' : '',
                      disabled ? 'is-disabled' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => pickDay(day)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            {value && (
              <button
                type="button"
                className="vn-date-cal-clear"
                onClick={() => { onChange(''); setOpen(false); }}
              >
                Xóa ngày
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VnDatePicker;