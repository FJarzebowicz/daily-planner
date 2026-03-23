import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import type { Task, Category } from '../types';
import { TIME_PRESETS } from '../types';
import { formatDate } from '../utils';

/* ── Shared modal shell (portal) ── */

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
  exit: { opacity: 0, scale: 0.95, y: 16, transition: { duration: 0.18 } },
};

export function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [handleEsc]);

  return createPortal(
    <motion.div
      className="modal-overlay"
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      onClick={onClose}
    >
      <motion.div
        className="modal"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} type="button" aria-label="Zamknij">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        {children}
      </motion.div>
    </motion.div>,
    document.body,
  );
}

/* ── Floating label input ── */

export function FloatingInput({
  label,
  value,
  onChange,
  autoFocus,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
  multiline?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const floated = focused || value.length > 0;
  const cls = `fl-field ${floated ? 'fl-field--float' : ''} ${focused ? 'fl-field--focus' : ''}`;

  return (
    <div className={cls}>
      {multiline ? (
        <textarea
          className="fl-input fl-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus={autoFocus}
          rows={3}
        />
      ) : (
        <input
          className="fl-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus={autoFocus}
        />
      )}
      <label className="fl-label">{label}</label>
    </div>
  );
}

/* ── Task Modal (add + edit) ── */

export function TaskModal({
  categoryId,
  categories,
  defaultDate,
  initial,
  onSubmit,
  onClose,
}: {
  categoryId?: number;
  categories?: Category[];
  defaultDate?: string;
  initial?: Task;
  onSubmit: (data: { title: string; description: string; categoryId: number; estimatedMinutes: number; priority: string; date?: string }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(initial?.estimatedMinutes ?? 30);
  const [customTime, setCustomTime] = useState('');
  const [priority, setPriority] = useState(initial?.priority ?? 'MEDIUM');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(
    categoryId ?? categories?.[0]?.id ?? 0,
  );
  const [date, setDate] = useState(defaultDate ?? formatDate(new Date()));
  const isEdit = !!initial;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      title: name.trim(),
      description: description.trim(),
      categoryId: categoryId ?? selectedCategoryId,
      estimatedMinutes,
      priority,
      ...(defaultDate !== undefined ? { date } : {}),
    });
    onClose();
  }

  const isPreset = TIME_PRESETS.some((p) => p.value === estimatedMinutes) && customTime === '';

  return (
    <ModalShell onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <h3 className="modal-title">{isEdit ? 'Edytuj task' : 'Nowy task'}</h3>

        <FloatingInput label="Nazwa tasku" value={name} onChange={setName} autoFocus />

        <div className="modal-spacer" />
        <FloatingInput label="Opis (opcjonalny)" value={description} onChange={setDescription} multiline />

        {categories && categories.length > 0 && (
          <>
            <div className="modal-spacer" />
            <label className="modal-label">Kategoria</label>
            <div className="priority-picker">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`priority-btn ${selectedCategoryId === c.id ? 'priority-btn--active' : ''}`}
                  style={selectedCategoryId === c.id ? { background: c.color, borderColor: c.color, color: '#fff' } : { borderColor: c.color }}
                  onClick={() => setSelectedCategoryId(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </>
        )}

        {defaultDate !== undefined && (
          <>
            <div className="modal-spacer" />
            <label className="modal-label">Data</label>
            <input
              type="date"
              className="preset-custom"
              style={{ width: '100%', padding: '8px' }}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </>
        )}

        <div className="modal-spacer" />
        <label className="modal-label">Szacowany czas</label>
        <div className="time-presets">
          {TIME_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              className={`preset-btn ${isPreset && estimatedMinutes === p.value ? 'preset-btn--active' : ''}`}
              onClick={() => { setEstimatedMinutes(p.value); setCustomTime(''); }}
            >
              {p.label}
            </button>
          ))}
          <input
            type="number"
            className="preset-custom"
            placeholder="min"
            value={customTime}
            onChange={(e) => {
              setCustomTime(e.target.value);
              const v = parseInt(e.target.value);
              if (v > 0) setEstimatedMinutes(v);
            }}
            min="1"
          />
        </div>

        <div className="modal-spacer" />
        <label className="modal-label">Priorytet</label>
        <div className="priority-picker">
          {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => (
            <button
              key={p}
              type="button"
              className={`priority-btn priority-btn--${p.toLowerCase()} ${priority === p ? 'priority-btn--active' : ''}`}
              onClick={() => setPriority(p)}
            >
              {p === 'LOW' ? 'Niski' : p === 'MEDIUM' ? 'Średni' : 'Wysoki'}
            </button>
          ))}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-modal btn-modal--cancel" onClick={onClose}>Anuluj</button>
          <button type="submit" className="btn-modal btn-modal--save" disabled={!name.trim()}>
            {isEdit ? 'Zapisz' : 'Dodaj task'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
