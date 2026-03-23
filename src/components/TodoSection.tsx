import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, Category, HabitForDate } from '../types';
import { PASTEL_COLORS } from '../types';
import { ModalShell, FloatingInput, TaskModal } from './TaskModal';

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
  currentTaskId: number | null;
  onSetCurrentTask: (id: number | null) => void;
  isOverCW: boolean;
  habits?: HabitForDate[];
  onToggleHabit?: (id: number, completed: boolean) => void;
  onSetGlobalOrder?: (taskId: number, globalOrder: number | null) => Promise<{ displacedTitle: string | null }>;
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
  totalTasks,
  closed,
  onToggle,
  onDelete,
  onMoveToBacklog,
  onMoveToPosition,
  onStartWorking,
  onSetGlobalOrder,
}: {
  task: Task;
  orderNum: number;
  totalTasks: number;
  closed: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onMoveToBacklog: () => void;
  onMoveToPosition: (newPos: number) => void;
  onStartWorking?: () => void;
  onSetGlobalOrder?: (globalOrder: number | null) => Promise<{ displacedTitle: string | null }>;
}) {
  const [editingOrder, setEditingOrder] = useState(false);
  const [orderInput, setOrderInput] = useState('');
  const [editingGlobal, setEditingGlobal] = useState(false);
  const [globalInput, setGlobalInput] = useState('');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  function handleOrderSubmit() {
    const newPos = parseInt(orderInput);
    if (newPos >= 1 && newPos <= totalTasks && newPos !== orderNum) {
      onMoveToPosition(newPos);
    }
    setEditingOrder(false);
    setOrderInput('');
  }

  function handleGlobalSubmit() {
    if (!onSetGlobalOrder) { setEditingGlobal(false); return; }
    const trimmed = globalInput.trim();
    if (trimmed === '') {
      onSetGlobalOrder(null);
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 1) onSetGlobalOrder(num);
    }
    setEditingGlobal(false);
    setGlobalInput('');
  }

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
        {editingOrder ? (
          <input
            className="tc-order-input"
            type="number"
            min={1}
            max={totalTasks}
            value={orderInput}
            onChange={(e) => setOrderInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleOrderSubmit();
              if (e.key === 'Escape') { setEditingOrder(false); setOrderInput(''); }
            }}
            onBlur={handleOrderSubmit}
            autoFocus
          />
        ) : (
          <motion.span
            className="tc-order"
            style={{ cursor: closed ? 'default' : 'pointer' }}
            key={orderNum}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            onClick={() => {
              if (!closed) {
                setOrderInput(String(orderNum));
                setEditingOrder(true);
              }
            }}
          >
            {String(orderNum).padStart(2, '0')}.
          </motion.span>
        )}
        <span className={`tc-title ${task.completed ? 'tc-title--done' : ''}`}>{task.title}</span>

        {/* Global order badge */}
        {onSetGlobalOrder && !closed && (
          editingGlobal ? (
            <input
              className="tc-global-input"
              type="number"
              min={1}
              placeholder="—"
              value={globalInput}
              onChange={(e) => setGlobalInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGlobalSubmit();
                if (e.key === 'Escape') { setEditingGlobal(false); setGlobalInput(''); }
              }}
              onBlur={handleGlobalSubmit}
              autoFocus
            />
          ) : task.globalOrder != null ? (
            <motion.span
              className="tc-global-badge"
              key={task.globalOrder}
              initial={{ opacity: 0.5, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15 }}
              onClick={() => { setGlobalInput(String(task.globalOrder)); setEditingGlobal(true); }}
              title="Numer globalny — kliknij aby zmienić"
            >
              #{String(task.globalOrder).padStart(2, '0')}
            </motion.span>
          ) : (
            <span
              className="tc-global-add"
              onClick={() => { setGlobalInput(''); setEditingGlobal(true); }}
              title="Ustaw numer globalny"
            >
              #
            </span>
          )
        )}

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
            {onStartWorking && !task.completed && (
              <motion.button
                className="tc-action tc-action--play"
                onClick={onStartWorking}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                title="Rozpocznij"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              </motion.button>
            )}
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

/* ── Habit item (inside category card) ── */

function HabitItem({
  habit,
  closed,
  onToggle,
}: {
  habit: HabitForDate;
  closed: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      className={`tc tc-habit ${habit.completed ? 'tc--done' : ''} ${!habit.completed && closed ? 'tc--undone' : ''}`}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="tc-top">
        <span className="tc-habit-icon">🔁</span>
        <span className={`tc-title ${habit.completed ? 'tc-title--done' : ''}`}>{habit.name}</span>
        <motion.button
          className={`tc-check ${habit.completed ? 'tc-check--checked' : ''}`}
          onClick={onToggle}
          disabled={closed}
          whileTap={{ scale: 0.85 }}
        >
          {habit.completed && (
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
      {habit.description && (
        <p className="tc-desc">{habit.description}</p>
      )}
      <div className="tc-bottom">
        <div className="tc-pills">
          <span className="tc-pill tc-pill--habit">NAWYK</span>
        </div>
      </div>
    </motion.div>
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
  onReorderTasks,
  onEditCategory,
  onDeleteCategory,
  onAddTask,
  habits,
  onToggleHabit,
  onStartWorking,
  onSetGlobalOrder,
}: {
  category: Category;
  tasks: Task[];
  closed: boolean;
  onToggleTask: (id: number) => void;
  onDeleteTask: (id: number) => void;
  onMoveToBacklog: (task: Task) => void;
  onReorderTasks: (categoryId: number, oldIndex: number, newIndex: number) => void;
  onEditCategory: (id: number, updates: Partial<Category>) => void;
  onDeleteCategory: (id: number) => void;
  onAddTask: (categoryId: number) => void;
  habits?: HabitForDate[];
  onToggleHabit?: (id: number, completed: boolean) => void;
  onStartWorking?: (taskId: number) => void;
  onSetGlobalOrder?: (taskId: number, globalOrder: number | null) => Promise<{ displacedTitle: string | null }>;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <motion.div
        className="category-card"
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <div className="category-header">
          <h3 className="category-title">
            {category.name}
            <span className="category-count">{tasks.length}</span>
          </h3>
          {!closed && (
            <div className="category-actions">
              <button className="btn-icon-sm" onClick={() => setEditing(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              </button>
              <button className="btn-icon-sm" onClick={() => onDeleteCategory(category.id)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
              </button>
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
                  totalTasks={tasks.length}
                  closed={closed}
                  onToggle={() => onToggleTask(task.id)}
                  onDelete={() => onDeleteTask(task.id)}
                  onMoveToBacklog={() => onMoveToBacklog(task)}
                  onMoveToPosition={(newPos) => {
                    const newIdx = Math.max(0, Math.min(newPos - 1, tasks.length - 1));
                    if (idx !== newIdx) onReorderTasks(category.id, idx, newIdx);
                  }}
                  onStartWorking={onStartWorking ? () => onStartWorking(task.id) : undefined}
                  onSetGlobalOrder={onSetGlobalOrder ? (g) => onSetGlobalOrder(task.id, g) : undefined}
                />
              ))}
            </AnimatePresence>
          </SortableContext>

          {/* Habits for this category */}
          {habits && habits.length > 0 && (
            <AnimatePresence mode="popLayout">
              {habits.map((h) => (
                <HabitItem
                  key={`habit-${h.id}`}
                  habit={h}
                  closed={closed}
                  onToggle={() => onToggleHabit?.(h.id, h.completed)}
                />
              ))}
            </AnimatePresence>
          )}

          {tasks.length === 0 && (!habits || habits.length === 0) && (
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
  currentTaskId,
  onSetCurrentTask,
  isOverCW,
  habits = [],
  onToggleHabit,
  onSetGlobalOrder,
}: TodoSectionProps) {
  const [addingTaskCat, setAddingTaskCat] = useState<number | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);

  const currentTask = currentTaskId ? tasks.find((t) => t.id === currentTaskId) ?? null : null;
  const currentCategory = currentTask ? categories.find((c) => c.id === currentTask.categoryId) ?? null : null;

  // Group habits by categoryId so they appear inside matching category cards
  const habitsByCategoryId = new Map<number | null, HabitForDate[]>();
  for (const h of habits) {
    const key = h.categoryId;
    const list = habitsByCategoryId.get(key) || [];
    list.push(h);
    habitsByCategoryId.set(key, list);
  }
  const uncategorizedHabits = habitsByCategoryId.get(null) || [];

  function handleCWDone() {
    if (currentTaskId) {
      onToggleTask(currentTaskId);
      onSetCurrentTask(null);
    }
  }

  function handleCWPutBack() {
    onSetCurrentTask(null);
  }

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
              onReorderTasks={onReorderTasks}
              onEditCategory={onEditCategory}
              onDeleteCategory={onDeleteCategory}
              onAddTask={(catId) => setAddingTaskCat(catId)}
              habits={habitsByCategoryId.get(cat.id)}
              onToggleHabit={onToggleHabit}
              onStartWorking={onSetCurrentTask}
              onSetGlobalOrder={onSetGlobalOrder}
            />
          ))}
        </AnimatePresence>

        {/* Uncategorized habits */}
        {uncategorizedHabits.length > 0 && (
          <motion.div
            className="category-card"
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="category-header">
              <h3 className="category-title">
                Nawyki
                <span className="category-count">{uncategorizedHabits.length}</span>
              </h3>
            </div>
            <div className="category-body">
              <AnimatePresence mode="popLayout">
                {uncategorizedHabits.map((h) => (
                  <HabitItem
                    key={`habit-${h.id}`}
                    habit={h}
                    closed={closed}
                    onToggle={() => onToggleHabit?.(h.id, h.completed)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>

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
