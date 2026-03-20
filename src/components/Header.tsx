import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DayData, Task, MealSlot, Note } from '../types';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from './ThemeToggle';
import {
  getPolishDayName,
  formatPolishDate,
  parseLocalDate,
  shiftDate,
  generateTimeSlots,
  computeSleepMinutes,
  formatMinutes,
} from '../utils';

interface HeaderProps {
  day: DayData;
  tasks: Task[];
  meals: MealSlot[];
  notes: Note[];
  currentDate: string;
  onUpdateWakeUp: (time: string) => void;
  onUpdateSleep: (time: string) => void;
  onCloseDay: () => void;
  onNavigate: (date: string) => void;
}

const TIME_SLOTS = generateTimeSlots(15);

function TimePicker({
  value,
  onChange,
  label,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (open && listRef.current) {
      const idx = TIME_SLOTS.indexOf(value);
      if (idx >= 0) {
        const item = listRef.current.children[idx] as HTMLElement;
        if (item) item.scrollIntoView({ block: 'center' });
      }
    }
  }, [open, value]);

  return (
    <div className="tp-wrap" ref={ref}>
      <span className="tp-label">{label}</span>
      <button
        className="tp-btn"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
      >
        {value}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="tp-dropdown"
            ref={listRef}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
          >
            {TIME_SLOTS.map((t) => (
              <button
                key={t}
                className={`tp-option ${t === value ? 'tp-option--active' : ''}`}
                onClick={() => {
                  onChange(t);
                  setOpen(false);
                }}
              >
                {t}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Header({ day, tasks, meals, notes, currentDate, onUpdateWakeUp, onUpdateSleep, onCloseDay, onNavigate }: HeaderProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [holdProgress, setHoldProgress] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const date = parseLocalDate(currentDate);

  function startHold() {
    if (day.closed) return;
    setHoldProgress(true);
    holdTimerRef.current = setTimeout(() => {
      setHoldProgress(false);
      onCloseDay();
    }, 2000);
  }

  function cancelHold() {
    setHoldProgress(false);
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.completed).length;

  const totalMeals = meals.length;
  const eatenMeals = meals.filter((m) => m.eaten).length;

  const productiveMinutes = tasks.filter((t) => t.completed).reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const sleepMinutes = computeSleepMinutes(day.wakeUpTime, day.sleepTime);
  const notesCount = notes.length;

  function shiftDay(offset: number) {
    onNavigate(shiftDate(currentDate, offset));
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) setShowDatePicker(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="header">
      <div className="header-top">
        <div className="header-nav">
          <button
            className="nav-arrow"
            onClick={() => shiftDay(-1)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>

          <div className="header-date-block" ref={datePickerRef}>
            <button className="header-date-btn" onClick={() => setShowDatePicker(!showDatePicker)}>
              <motion.h1
                className="header-day-name"
                key={currentDate}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {getPolishDayName(date)}
              </motion.h1>
              <motion.p
                className="header-date-text"
                key={currentDate + '-d'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, delay: 0.05 }}
              >
                {formatPolishDate(date)}
              </motion.p>
            </button>
            <AnimatePresence>
              {showDatePicker && (
                <motion.div
                  className="date-picker-dropdown"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                >
                  <input
                    type="date"
                    value={currentDate}
                    onChange={(e) => {
                      onNavigate(e.target.value);
                      setShowDatePicker(false);
                    }}
                    className="date-input"
                    autoFocus
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            className="nav-arrow"
            onClick={() => shiftDay(1)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        <div className="header-times">
          <TimePicker value={day.wakeUpTime} onChange={onUpdateWakeUp} label="Wstanie" disabled={day.closed} />
          <TimePicker value={day.sleepTime} onChange={onUpdateSleep} label="Sen" disabled={day.closed} />
        </div>

        <div className="header-right">
          <div className="header-close">
            {!day.closed ? (
              <button
                className={`btn-close-day ${holdProgress ? 'btn-close-day--holding' : ''}`}
                onMouseDown={startHold}
                onMouseUp={cancelHold}
                onMouseLeave={cancelHold}
                onTouchStart={startHold}
                onTouchEnd={cancelHold}
              >
                {holdProgress ? 'PRZYTRZYMAJ...' : 'ZAMKNIJ DZIEN'}
              </button>
            ) : (
              <span className="day-closed-badge">Zamkniety</span>
            )}
          </div>
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>

      {/* Stats row — big editorial numbers */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-value">{doneTasks}/{totalTasks}</span>
            <span className="stat-label">Taski</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-value">{eatenMeals}/{totalMeals}</span>
            <span className="stat-label">Posilki</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-value">{notesCount}</span>
            <span className="stat-label">Rozkminki</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-value">{formatMinutes(productiveMinutes)}</span>
            <span className="stat-label">Produktywnosc</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-value">{formatMinutes(sleepMinutes)}</span>
            <span className="stat-label">Sen</span>
          </div>
        </div>
      </div>
    </header>
  );
}
