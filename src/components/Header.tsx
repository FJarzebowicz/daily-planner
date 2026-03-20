import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DayData, Task, MealSlot, Note } from '../types';
import { UserMenu } from './UserMenu';
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
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
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

function CircleProgress({ value, size = 44, stroke = 4, color = '#10b981' }: { value: number; size?: number; stroke?: number; color?: string }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="circle-progress">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f0f0f0" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
      />
    </svg>
  );
}

export function Header({ day, tasks, meals, notes, currentDate, onUpdateWakeUp, onUpdateSleep, onCloseDay, onNavigate }: HeaderProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const date = parseLocalDate(currentDate);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.completed).length;
  const taskPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const totalMeals = meals.length;
  const eatenMeals = meals.filter((m) => m.eaten).length;
  const mealPercent = totalMeals > 0 ? Math.round((eatenMeals / totalMeals) * 100) : 0;

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
    <motion.header
      className="header"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Top row: navigation + times + close */}
      <div className="header-top">
        <div className="header-nav">
          <motion.button
            className="nav-arrow"
            onClick={() => shiftDay(-1)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </motion.button>

          <div className="header-date-block" ref={datePickerRef}>
            <button className="header-date-btn" onClick={() => setShowDatePicker(!showDatePicker)}>
              <motion.h1
                className="header-day-name"
                key={currentDate}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {getPolishDayName(date)}
              </motion.h1>
              <motion.p
                className="header-date-text"
                key={currentDate + '-d'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.05 }}
              >
                {formatPolishDate(date)}
              </motion.p>
            </button>
            <AnimatePresence>
              {showDatePicker && (
                <motion.div
                  className="date-picker-dropdown"
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
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

          <motion.button
            className="nav-arrow"
            onClick={() => shiftDay(1)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </motion.button>
        </div>

        <div className="header-times">
          <TimePicker value={day.wakeUpTime} onChange={onUpdateWakeUp} label="Wstanie" disabled={day.closed} />
          <TimePicker value={day.sleepTime} onChange={onUpdateSleep} label="Sen" disabled={day.closed} />
        </div>

        <div className="header-right">
          <div className="header-close">
            {!day.closed ? (
              <motion.button
                className="btn-close-day"
                onClick={onCloseDay}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Zamknij dzień
              </motion.button>
            ) : (
              <span className="day-closed-badge">Dzień zamknięty</span>
            )}
          </div>
          <UserMenu />
        </div>
      </div>

      {/* Stats row */}
      <motion.div
        className="stats-row"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="stat-card">
          <CircleProgress value={taskPercent} color="#10b981" />
          <div className="stat-info">
            <span className="stat-value">{doneTasks}/{totalTasks}</span>
            <span className="stat-label">Taski</span>
          </div>
        </div>
        <div className="stat-card">
          <CircleProgress value={mealPercent} color="#f59e0b" />
          <div className="stat-info">
            <span className="stat-value">{eatenMeals}/{totalMeals}</span>
            <span className="stat-label">Posiłki</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💭</div>
          <div className="stat-info">
            <span className="stat-value">{notesCount}</span>
            <span className="stat-label">Rozkminki</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-info">
            <span className="stat-value">{formatMinutes(productiveMinutes)}</span>
            <span className="stat-label">Produktywność</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🌙</div>
          <div className="stat-info">
            <span className="stat-value">{formatMinutes(sleepMinutes)}</span>
            <span className="stat-label">Sen</span>
          </div>
        </div>
      </motion.div>
    </motion.header>
  );
}
