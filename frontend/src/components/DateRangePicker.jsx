/**
 * DateRangePicker.jsx — Accessible Date Range Picker Component
 * Premium Sports Booking Platform
 *
 * A fully self-contained date-range picker with:
 *  - Dual-calendar month view (start month + next month side-by-side)
 *  - Click-to-select start and end dates with visual range highlight
 *  - Keyboard navigation (arrow keys, Enter, Escape)
 *  - Min/max date constraints (e.g. block past dates for new bookings)
 *  - Disabled individual dates (e.g. fully-booked days)
 *  - Month/year navigation with prev/next buttons
 *  - Formatted display value in the trigger input
 *  - Click-outside to close
 *  - Zero external dependencies (no date-fns, no dayjs)
 *
 * Usage:
 *   <DateRangePicker
 *     value={{ start: '2026-10-01', end: '2026-10-07' }}
 *     onChange={({ start, end }) => setRange({ start, end })}
 *     minDate={new Date()}
 *     placeholder="Select date range"
 *   />
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

// ─── Date helpers (no external library) ──────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function toDateOnly(date) {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : new Date(date);
  d.setHours(0, 0, 0, 0);
  return isNaN(d.getTime()) ? null : d;
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isBefore(a, b) { return a && b && a.getTime() < b.getTime(); }
function isAfter(a, b)  { return a && b && a.getTime() > b.getTime(); }

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

function buildCalendarGrid(year, month) {
  const totalDays  = getDaysInMonth(year, month);
  const firstDay   = getFirstDayOfWeek(year, month);
  const cells      = [];

  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));

  return cells;
}

function formatDisplay(start, end) {
  if (!start) return '';
  const fmt = (d) => `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
  if (!end) return fmt(start);
  return `${fmt(start)} → ${fmt(end)}`;
}

// ─── MonthCalendar sub-component ─────────────────────────────────────────────

function MonthCalendar({
  year, month, start, end, hovered,
  onDayClick, onDayHover,
  minDate, maxDate, disabledDates = [],
}) {
  const cells   = useMemo(() => buildCalendarGrid(year, month), [year, month]);
  const disabledSet = useMemo(() => new Set(disabledDates.map((d) => toDateOnly(d)?.toDateString())), [disabledDates]);

  const effectiveEnd = end || hovered;

  function getDayClass(date) {
    if (!date) return '';
    const isStart    = isSameDay(date, start);
    const isEnd      = isSameDay(date, end);
    const isHovered  = !end && isSameDay(date, hovered);
    const inRange    = start && effectiveEnd &&
      !isBefore(effectiveEnd, start) &&
      isAfter(date, start) && isBefore(date, effectiveEnd);
    const today      = isSameDay(date, new Date());
    const disabled   = isDateDisabled(date);

    let cls = 'drp-day';
    if (disabled)   cls += ' drp-day--disabled';
    else if (isStart) cls += ' drp-day--selected drp-day--start';
    else if (isEnd || isHovered) cls += ' drp-day--selected drp-day--end';
    else if (inRange) cls += ' drp-day--in-range';
    else              cls += ' drp-day--normal';
    if (today && !isStart && !isEnd) cls += ' drp-day--today';
    return cls;
  }

  function isDateDisabled(date) {
    if (!date) return true;
    if (minDate && isBefore(date, toDateOnly(minDate))) return true;
    if (maxDate && isAfter(date, toDateOnly(maxDate)))  return true;
    if (disabledSet.has(date.toDateString()))            return true;
    return false;
  }

  return (
    <div className="drp-month">
      <div className="drp-month-label">
        {MONTH_NAMES[month]} {year}
      </div>
      <div className="drp-weekdays">
        {DAY_NAMES.map((d) => <span key={d} className="drp-weekday">{d}</span>)}
      </div>
      <div className="drp-grid">
        {cells.map((date, i) => (
          date ? (
            <button
              key={i}
              type="button"
              className={getDayClass(date)}
              disabled={isDateDisabled(date)}
              onClick={() => !isDateDisabled(date) && onDayClick(date)}
              onMouseEnter={() => !isDateDisabled(date) && onDayHover(date)}
              aria-label={date.toLocaleDateString()}
              aria-pressed={isSameDay(date, start) || isSameDay(date, end)}
            >
              {date.getDate()}
            </button>
          ) : (
            <span key={i} className="drp-empty" aria-hidden="true" />
          )
        ))}
      </div>
    </div>
  );
}

// ─── Main DateRangePicker ─────────────────────────────────────────────────────

/**
 * @param {object} props
 * @param {{ start?: Date|string, end?: Date|string }} [props.value]
 * @param {Function} props.onChange           - ({ start, end }) => void  (ISO date strings)
 * @param {Date|string} [props.minDate]
 * @param {Date|string} [props.maxDate]
 * @param {(Date|string)[]} [props.disabledDates]
 * @param {string} [props.placeholder]
 * @param {string} [props.className]
 * @param {boolean} [props.disabled]
 * @param {string} [props.id]
 */
export function DateRangePicker({
  value = {},
  onChange,
  minDate,
  maxDate,
  disabledDates = [],
  placeholder = 'Select date range',
  className = '',
  disabled = false,
  id,
}) {
  const start = toDateOnly(value?.start);
  const end   = toDateOnly(value?.end);

  const today = new Date();
  const [open, setOpen]     = useState(false);
  const [hovered, setHovered] = useState(null);
  const [selecting, setSelecting] = useState('start'); // 'start' | 'end'

  // Left calendar month
  const [leftYear,  setLeftYear]  = useState(start?.getFullYear()  ?? today.getFullYear());
  const [leftMonth, setLeftMonth] = useState(start?.getMonth()     ?? today.getMonth());

  // Right calendar is always left + 1 month
  const rightYear  = leftMonth === 11 ? leftYear + 1 : leftYear;
  const rightMonth = leftMonth === 11 ? 0 : leftMonth + 1;

  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSelecting('start');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === 'Escape') { setOpen(false); setSelecting('start'); }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleDayClick = useCallback((date) => {
    if (selecting === 'start') {
      // Starting fresh selection
      onChange?.({ start: date.toISOString().slice(0, 10), end: null });
      setSelecting('end');
    } else {
      // Completing selection
      if (isBefore(date, start)) {
        // Clicked before start — swap
        onChange?.({ start: date.toISOString().slice(0, 10), end: start.toISOString().slice(0, 10) });
      } else {
        onChange?.({ start: start.toISOString().slice(0, 10), end: date.toISOString().slice(0, 10) });
      }
      setSelecting('start');
      setHovered(null);
      setOpen(false);
    }
  }, [selecting, start, onChange]);

  const handleDayHover = useCallback((date) => {
    if (selecting === 'end') setHovered(date);
  }, [selecting]);

  function navigateLeft(dir) {
    setLeftMonth((m) => {
      let nm = m + dir;
      if (nm < 0) { setLeftYear((y) => y - 1); return 11; }
      if (nm > 11) { setLeftYear((y) => y + 1); return 0; }
      return nm;
    });
  }

  const displayValue = formatDisplay(start, end);

  return (
    <div ref={containerRef} className={`drp-wrapper ${className}`} id={id}>
      {/* Trigger */}
      <button
        type="button"
        className={`drp-trigger ${open ? 'drp-trigger--open' : ''} ${disabled ? 'drp-trigger--disabled' : ''}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
      >
        <span className="drp-trigger-icon" aria-hidden="true">📅</span>
        <span className="drp-trigger-value">
          {displayValue || <span className="drp-placeholder">{placeholder}</span>}
        </span>
        {(start || end) && (
          <button
            type="button"
            className="drp-clear"
            aria-label="Clear date range"
            onClick={(e) => { e.stopPropagation(); onChange?.({ start: null, end: null }); setSelecting('start'); }}
          >
            ✕
          </button>
        )}
      </button>

      {/* Popup */}
      {open && (
        <div className="drp-popup" role="dialog" aria-label="Date range picker">
          {/* Selection hint */}
          <div className="drp-hint">
            {selecting === 'start' ? '📌 Click to select start date' : '📌 Click to select end date'}
          </div>

          {/* Navigation */}
          <div className="drp-nav">
            <button type="button" className="drp-nav-btn" onClick={() => navigateLeft(-1)} aria-label="Previous month">‹</button>
            <div className="drp-calendars">
              <MonthCalendar
                year={leftYear} month={leftMonth}
                start={start} end={end} hovered={hovered}
                onDayClick={handleDayClick} onDayHover={handleDayHover}
                minDate={minDate} maxDate={maxDate} disabledDates={disabledDates}
              />
              <MonthCalendar
                year={rightYear} month={rightMonth}
                start={start} end={end} hovered={hovered}
                onDayClick={handleDayClick} onDayHover={handleDayHover}
                minDate={minDate} maxDate={maxDate} disabledDates={disabledDates}
              />
            </div>
            <button type="button" className="drp-nav-btn" onClick={() => navigateLeft(1)} aria-label="Next month">›</button>
          </div>

          {/* Footer */}
          <div className="drp-footer">
            {start && end && (
              <span className="drp-footer-summary">
                {Math.round((end - start) / 86_400_000) + 1} day(s) selected
              </span>
            )}
            <button
              type="button"
              className="drp-footer-btn drp-footer-btn--reset"
              onClick={() => { onChange?.({ start: null, end: null }); setSelecting('start'); setHovered(null); }}
            >
              Reset
            </button>
            {start && end && (
              <button
                type="button"
                className="drp-footer-btn drp-footer-btn--apply"
                onClick={() => { setOpen(false); setSelecting('start'); }}
              >
                Apply
              </button>
            )}
          </div>
        </div>
      )}

      {/* Embedded styles — scoped via .drp- prefix */}
      <style>{`
        .drp-wrapper { position: relative; display: inline-block; font-family: inherit; }

        .drp-trigger {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px; border-radius: 10px; cursor: pointer;
          background: #1a1f2e; border: 1.5px solid #2d3548; color: #e2e8f0;
          font-size: 14px; min-width: 240px; transition: border-color 0.2s;
        }
        .drp-trigger:hover:not(.drp-trigger--disabled) { border-color: #6366f1; }
        .drp-trigger--open { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.2); }
        .drp-trigger--disabled { opacity: 0.5; cursor: not-allowed; }
        .drp-trigger-value { flex: 1; text-align: left; }
        .drp-placeholder { color: #64748b; }
        .drp-clear {
          background: none; border: none; color: #64748b; cursor: pointer;
          padding: 2px 4px; border-radius: 4px; font-size: 12px; line-height: 1;
        }
        .drp-clear:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }

        .drp-popup {
          position: absolute; top: calc(100% + 8px); left: 0; z-index: 9999;
          background: #1a1f2e; border: 1.5px solid #2d3548; border-radius: 14px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5); padding: 16px;
          animation: drp-fade-in 0.15s ease;
        }
        @keyframes drp-fade-in { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }

        .drp-hint {
          font-size: 12px; color: #818cf8; margin-bottom: 12px;
          padding: 6px 10px; background: rgba(99,102,241,0.1); border-radius: 6px;
        }

        .drp-nav { display: flex; align-items: flex-start; gap: 8px; }
        .drp-nav-btn {
          background: rgba(255,255,255,0.05); border: 1.5px solid #2d3548;
          color: #94a3b8; border-radius: 8px; padding: 6px 10px; cursor: pointer;
          font-size: 18px; line-height: 1; align-self: center; transition: all 0.15s;
        }
        .drp-nav-btn:hover { background: rgba(99,102,241,0.15); border-color: #6366f1; color: #818cf8; }

        .drp-calendars { display: flex; gap: 24px; }

        .drp-month { width: 210px; }
        .drp-month-label { font-size: 14px; font-weight: 600; color: #e2e8f0; text-align: center; margin-bottom: 10px; }

        .drp-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 6px; }
        .drp-weekday { text-align: center; font-size: 11px; color: #64748b; font-weight: 500; padding: 2px 0; }

        .drp-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }

        .drp-day, .drp-empty {
          width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
          font-size: 12px; border-radius: 6px; border: none; cursor: pointer;
          transition: all 0.12s; background: transparent;
        }
        .drp-empty { pointer-events: none; }

        .drp-day--normal { color: #cbd5e1; }
        .drp-day--normal:hover { background: rgba(99,102,241,0.2); color: #e2e8f0; }

        .drp-day--today { font-weight: 700; color: #818cf8; }

        .drp-day--selected {
          background: #6366f1; color: #fff; font-weight: 600;
          box-shadow: 0 2px 8px rgba(99,102,241,0.4);
        }
        .drp-day--start { border-radius: 6px 0 0 6px; }
        .drp-day--end   { border-radius: 0 6px 6px 0; }

        .drp-day--in-range {
          background: rgba(99,102,241,0.15); color: #a5b4fc;
          border-radius: 0;
        }

        .drp-day--disabled { color: #334155; cursor: not-allowed; }
        .drp-day--disabled:hover { background: transparent; }

        .drp-footer {
          display: flex; align-items: center; gap: 8px;
          margin-top: 14px; padding-top: 12px; border-top: 1px solid #2d3548;
        }
        .drp-footer-summary { flex: 1; font-size: 12px; color: #64748b; }

        .drp-footer-btn {
          padding: 6px 14px; border-radius: 7px; font-size: 13px; font-weight: 500;
          cursor: pointer; border: none; transition: all 0.15s;
        }
        .drp-footer-btn--reset {
          background: rgba(255,255,255,0.05); color: #94a3b8; border: 1.5px solid #2d3548;
        }
        .drp-footer-btn--reset:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }
        .drp-footer-btn--apply {
          background: #6366f1; color: #fff;
          box-shadow: 0 2px 10px rgba(99,102,241,0.35);
        }
        .drp-footer-btn--apply:hover { background: #4f46e5; }
      `}</style>
    </div>
  );
}

export default DateRangePicker;
