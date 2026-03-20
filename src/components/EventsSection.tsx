import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RecurringEvent } from '../types';
import { generateTimeSlots } from '../utils';

interface EventsSectionProps {
  events: RecurringEvent[];
  closed: boolean;
  onAddEvent: (data: { name: string; startTime: string; endTime: string }) => void;
  onDeleteEvent: (id: number) => void;
}

const TIME_SLOTS = generateTimeSlots(15);

function EventTimePicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
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
    <div className="etp-wrap" ref={ref}>
      <span className="etp-label">{label}</span>
      <button className="etp-btn" onClick={() => setOpen(!open)}>{value}</button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="etp-dropdown"
            ref={listRef}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.12 }}
          >
            {TIME_SLOTS.map((t) => (
              <button
                key={t}
                className={`etp-option ${t === value ? 'etp-option--active' : ''}`}
                onClick={() => { onChange(t); setOpen(false); }}
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

export function EventsSection({ events, closed, onAddEvent, onDeleteEvent }: EventsSectionProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', startTime: '10:00', endTime: '11:00' });

  function addEvent() {
    if (!form.name.trim()) return;
    onAddEvent({ name: form.name.trim(), startTime: form.startTime, endTime: form.endTime });
    setForm({ name: '', startTime: '10:00', endTime: '11:00' });
    setShowAdd(false);
  }

  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">Stałe wydarzenia</h2>
        {!closed && (
          <motion.button
            className="btn-add-event"
            onClick={() => setShowAdd(!showAdd)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            className="event-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <input
              className="form-input"
              placeholder="Nazwa wydarzenia"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && addEvent()}
            />
            <div className="event-time-row">
              <EventTimePicker value={form.startTime} onChange={(v) => setForm({ ...form, startTime: v })} label="Od" />
              <span className="event-time-sep">—</span>
              <EventTimePicker value={form.endTime} onChange={(v) => setForm({ ...form, endTime: v })} label="Do" />
            </div>
            <motion.button
              className="btn-add-event-confirm"
              onClick={addEvent}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Dodaj
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="events-list">
        <AnimatePresence mode="popLayout">
          {events.length === 0 && (
            <motion.p className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Brak stałych wydarzeń
            </motion.p>
          )}
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              className="event-card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              layout
            >
              <div className="event-time-badge">
                {event.startTime}–{event.endTime}
              </div>
              <span className="event-name">{event.name}</span>
              {!closed && (
                <motion.button
                  className="btn-icon btn-delete"
                  onClick={() => onDeleteEvent(event.id)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </motion.button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
