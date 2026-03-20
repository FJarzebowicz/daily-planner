import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, Category } from '../types';
import { PASTEL_COLORS, TIME_PRESETS } from '../types';

interface TodoSectionProps {
  tasks: Task[];
  categories: Category[];
  closed: boolean;
  onToggleTask: (id: number) => void;
  onDeleteTask: (id: number) => void;
  onAddTask: (data: { title: string; description: string; categoryId: number; estimatedMinutes: number; priority: string }) => void;
  onReorderTasks: (categoryId: number, oldIndex: number, newIndex: number) => void;
  onMoveToBacklog: (task: Task) => void;
  onAddCategory: (data: { name: string; color: string }) => void;
  onEditCategory: (id: number, updates: Partial<Category>) => void;
  onDeleteCategory: (id: number) => void;
}

/* ── helpers ── */

function darken(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.floor(r * 0.45)}, ${Math.floor(g * 0.45)}, ${Math.floor(b * 0.45)})`;
}

function formatTime(minutes: number) {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes} min`;
}

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const priorityLabel: Record<string, string> = { LOW: 'Niski', MEDIUM: 'Średni', HIGH: 'Wysoki' };
const priorityClass: Record<string, string> = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high' };

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

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
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

function FloatingInput({
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

function TaskModal({
  categoryId,
  initial,
  onSubmit,
  onClose,
}: {
  categoryId: number;
  initial?: Task;
  onSubmit: (data: { title: string; description: string; categoryId: number; estimatedMinutes: number; priority: string }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(initial?.estimatedMinutes ?? 30);
  const [customTime, setCustomTime] = useState('');
  const [priority, setPriority] = useState(initial?.priority ?? 'MEDIUM');
  const isEdit = !!initial;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ title: name.trim(), description: description.trim(), categoryId, estimatedMinutes, priority });
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

/* ── Category Modal (add + edit) ── */

function CategoryModal({
  initial,
  onSubmit,
  onClose,
}: {
  initial?: Category;
  onSubmit: (data: { name: string; color: string }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [color, setColor] = useState(initial?.color ?? PASTEL_COLORS[0].hex);
  const isEdit = !!initial;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), color });
    onClose();
  }

  return (
    <ModalShell onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <h3 className="modal-title">{isEdit ? 'Edytuj kategorię' : 'Nowa kategoria'}</h3>

        <FloatingInput label="Nazwa kategorii" value={name} onChange={setName} autoFocus />

        <div className="modal-spacer" />
        <label className="modal-label">Kolor</label>
        <div className="color-palette">
          {PASTEL_COLORS.map((c) => (
            <motion.button
              key={c.hex}
              type="button"
              className={`color-swatch ${color === c.hex ? 'color-swatch--active' : ''}`}
              style={{ backgroundColor: c.hex }}
              onClick={() => setColor(c.hex)}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.9 }}
              title={c.name}
            />
          ))}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-modal btn-modal--cancel" onClick={onClose}>Anuluj</button>
          <button type="submit" className="btn-modal btn-modal--save" disabled={!name.trim()}>
            {isEdit ? 'Zapisz' : 'Dodaj kategorię'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ── Currently Working On box ── */

function CurrentlyWorkingBox({
  task,
  category,
  closed,
  onDone,
  onPutBack,
  isOver,
}: {
  task: Task | null;
  category: Category | null;
  closed: boolean;
  onDone: () => void;
  onPutBack: () => void;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: 'currently-working' });
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (task && !task.completed) {
      startRef.current = Date.now();
      setElapsed(0);
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current!) / 1000));
      }, 1000);
    } else {
      setElapsed(0);
      startRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [task]);

  return (
    <div
      ref={setNodeRef}
      className={`cw-box ${task ? 'cw-box--active' : ''} ${isOver ? 'cw-box--over' : ''}`}
    >
      <AnimatePresence mode="wait">
        {task && category ? (
          <motion.div
            key={task.id}
            className="cw-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <div className="cw-header">
              <div className="cw-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                Teraz robię
              </div>
              <div className="cw-timer">{formatElapsed(elapsed)}</div>
            </div>

            <div className="cw-task">
              <span className="cw-task-name">{task.title}</span>
              <div className="cw-task-meta">
                <span className="cw-cat-tag" style={{ backgroundColor: category.color, color: darken(category.color) }}>
                  {category.name}
                </span>
                {task.estimatedMinutes > 0 && (
                  <span className="cw-time-tag">{formatTime(task.estimatedMinutes)}</span>
                )}
              </div>
            </div>

            {!closed && (
              <div className="cw-actions">
                <motion.button
                  className="cw-btn cw-btn--done"
                  onClick={onDone}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  Zrobione
                </motion.button>
                <motion.button
                  className="cw-btn cw-btn--back"
                  onClick={onPutBack}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                  Odłóż
                </motion.button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            className="cw-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.35"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg>
            <span>Przeciągnij task tutaj aby zacząć pracę</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Sortable task card ── */

function SortableTask({
  task,
  orderNum,
  catColor,
  closed,
  onToggle,
  onDelete,
  onMoveToBacklog,
}: {
  task: Task;
  orderNum: number;
  catColor: string;
  closed: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onMoveToBacklog: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`tc ${task.completed ? 'tc--done' : ''} ${!task.completed && closed ? 'tc--undone' : ''}`}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Top row: order + name + checkbox */}
      <div className="tc-top">
        <motion.span
          className="tc-order"
          style={{ backgroundColor: catColor, color: darken(catColor) }}
          key={orderNum}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        >
          {orderNum}
        </motion.span>
        <span className={`tc-title ${task.completed ? 'tc-title--done' : ''}`}>{task.title}</span>
        <motion.button
          className={`tc-check ${task.completed ? 'tc-check--checked' : ''}`}
          onClick={onToggle}
          disabled={closed}
          whileTap={{ scale: 0.85 }}
        >
          {task.completed && (
            <motion.svg
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white"
              strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3 }}
            >
              <polyline points="20 6 9 17 4 12" />
            </motion.svg>
          )}
        </motion.button>
      </div>

      {/* Description */}
      {task.description && (
        <p className="tc-desc">{task.description}</p>
      )}

      {/* Bottom row: drag + pills + hover actions */}
      <div className="tc-bottom">
        {!closed && (
          <button className="tc-drag" {...attributes} {...listeners}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" opacity="0.35">
              <circle cx="5" cy="3" r="1.5" /><circle cx="11" cy="3" r="1.5" />
              <circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" />
              <circle cx="5" cy="13" r="1.5" /><circle cx="11" cy="13" r="1.5" />
            </svg>
          </button>
        )}

        <div className="tc-pills">
          {task.estimatedMinutes > 0 && (
            <span className="tc-pill tc-pill--time">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              {formatTime(task.estimatedMinutes)}
            </span>
          )}
          <span className={`tc-pill tc-pill--priority tc-pill--${priorityClass[task.priority] || 'medium'}`}>
            {priorityLabel[task.priority] || 'Średni'}
          </span>
        </div>

        {!closed && (
          <div className="tc-hover-actions">
            <motion.button
              className="tc-action"
              onClick={onMoveToBacklog}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              title="Do backlogu"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
            </motion.button>
            <motion.button
              className="tc-action tc-action--delete"
              onClick={onDelete}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              title="Usuń"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Drag overlay ghost ── */

function TaskDragOverlay({ task, catColor }: { task: Task; catColor: string }) {
  return (
    <div className="tc tc-ghost" style={{ borderColor: catColor }}>
      <div className="tc-top">
        <span className="tc-order" style={{ backgroundColor: catColor, color: darken(catColor) }}>⋮</span>
        <span className="tc-title">{task.title}</span>
      </div>
    </div>
  );
}

/* ── Category card ── */

function CategoryCard({
  category,
  tasks,
  closed,
  onToggleTask,
  onDeleteTask,
  onMoveToBacklog,
  onEditCategory,
  onDeleteCategory,
  onAddTask,
}: {
  category: Category;
  tasks: Task[];
  closed: boolean;
  onToggleTask: (id: number) => void;
  onDeleteTask: (id: number) => void;
  onMoveToBacklog: (task: Task) => void;
  onEditCategory: (id: number, updates: Partial<Category>) => void;
  onDeleteCategory: (id: number) => void;
  onAddTask: (categoryId: number) => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <motion.div
        className="category-card"
        style={{ '--cat-color': category.color, '--cat-text': darken(category.color) } as React.CSSProperties}
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25 }}
      >
        <div className="category-header" style={{ backgroundColor: category.color }}>
          <h3 className="category-title" style={{ color: darken(category.color) }}>
            {category.name}
            <span className="category-count">{tasks.length}</span>
          </h3>
          {!closed && (
            <div className="category-actions">
              <motion.button className="btn-icon-sm" onClick={() => setEditing(true)} whileHover={{ scale: 1.15 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              </motion.button>
              <motion.button className="btn-icon-sm" onClick={() => onDeleteCategory(category.id)} whileHover={{ scale: 1.15 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
              </motion.button>
            </div>
          )}
        </div>

        <div className="category-body">
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <AnimatePresence mode="popLayout">
              {tasks.map((task, idx) => (
                <SortableTask
                  key={task.id}
                  task={task}
                  orderNum={idx + 1}
                  catColor={category.color}
                  closed={closed}
                  onToggle={() => onToggleTask(task.id)}
                  onDelete={() => onDeleteTask(task.id)}
                  onMoveToBacklog={() => onMoveToBacklog(task)}
                />
              ))}
            </AnimatePresence>
          </SortableContext>

          {tasks.length === 0 && (
            <p className="empty-cat">Brak tasków</p>
          )}

          {!closed && (
            <motion.button
              className="add-task-btn"
              onClick={() => onAddTask(category.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Dodaj task
            </motion.button>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {editing && (
          <CategoryModal
            initial={category}
            onSubmit={(data) => onEditCategory(category.id, data)}
            onClose={() => setEditing(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Main section ── */

export function TodoSection({
  tasks,
  categories,
  closed,
  onToggleTask,
  onDeleteTask,
  onAddTask,
  onReorderTasks,
  onMoveToBacklog,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}: TodoSectionProps) {
  const [addingTaskCat, setAddingTaskCat] = useState<number | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [isOverCW, setIsOverCW] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const currentTask = currentTaskId ? tasks.find((t) => t.id === currentTaskId) ?? null : null;
  const currentCategory = currentTask ? categories.find((c) => c.id === currentTask.categoryId) ?? null : null;

  useEffect(() => {
    if (currentTaskId && !tasks.find((t) => t.id === currentTaskId)) {
      setCurrentTaskId(null);
    }
  }, [tasks, currentTaskId]);

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setDraggingTask(task);
  }

  function handleDragOver(event: any) {
    setIsOverCW(event.over?.id === 'currently-working');
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggingTask(null);
    setIsOverCW(false);
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    if (over.id === 'currently-working') {
      if (!activeTask.completed) {
        setCurrentTaskId(activeTask.id);
      }
      return;
    }

    if (active.id !== over.id) {
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask && activeTask.categoryId === overTask.categoryId) {
        const catTasks = tasks
          .filter((t) => t.categoryId === activeTask.categoryId)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        const oldIdx = catTasks.findIndex((t) => t.id === active.id);
        const newIdx = catTasks.findIndex((t) => t.id === over.id);
        if (oldIdx !== -1 && newIdx !== -1) {
          onReorderTasks(activeTask.categoryId, oldIdx, newIdx);
        }
      }
    }
  }

  function handleCWDone() {
    if (currentTaskId) {
      onToggleTask(currentTaskId);
      setCurrentTaskId(null);
    }
  }

  function handleCWPutBack() {
    setCurrentTaskId(null);
  }

  const draggingCategory = draggingTask
    ? categories.find((c) => c.id === draggingTask.categoryId)
    : null;

  return (
    <section className="section todo-section">
      <div className="section-header">
        <h2 className="section-title">Todo</h2>
        {!closed && (
          <motion.button
            className="btn-add-category"
            onClick={() => setShowAddCategory(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Kategoria
          </motion.button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {!closed && (
          <CurrentlyWorkingBox
            task={currentTask}
            category={currentCategory}
            closed={closed}
            onDone={handleCWDone}
            onPutBack={handleCWPutBack}
            isOver={isOverCW}
          />
        )}

        <div className="categories-grid">
          <AnimatePresence mode="popLayout">
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                tasks={tasks.filter((t) => t.categoryId === cat.id).sort((a, b) => a.sortOrder - b.sortOrder)}
                closed={closed}
                onToggleTask={onToggleTask}
                onDeleteTask={onDeleteTask}
                onMoveToBacklog={onMoveToBacklog}
                onEditCategory={onEditCategory}
                onDeleteCategory={onDeleteCategory}
                onAddTask={(catId) => setAddingTaskCat(catId)}
              />
            ))}
          </AnimatePresence>
        </div>

        <DragOverlay dropAnimation={null}>
          {draggingTask && draggingCategory && (
            <TaskDragOverlay task={draggingTask} catColor={draggingCategory.color} />
          )}
        </DragOverlay>
      </DndContext>

      <AnimatePresence>
        {addingTaskCat !== null && (
          <TaskModal
            categoryId={addingTaskCat}
            onSubmit={onAddTask}
            onClose={() => setAddingTaskCat(null)}
          />
        )}
        {showAddCategory && (
          <CategoryModal
            onSubmit={(data) => onAddCategory(data)}
            onClose={() => setShowAddCategory(false)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
