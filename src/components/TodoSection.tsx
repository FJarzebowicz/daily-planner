import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
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

/* ── Shared modal shell ── */

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] } },
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

  return (
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
    </motion.div>
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

/* ── Sortable task row ── */

function SortableTask({
  task,
  closed,
  onToggle,
  onDelete,
  onMoveToBacklog,
}: {
  task: Task;
  closed: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onMoveToBacklog: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityDots: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };
  const priorityColors: Record<string, string> = { LOW: '#94a3b8', MEDIUM: '#f59e0b', HIGH: '#ef4444' };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`task-item ${task.completed ? 'task-done' : ''} ${!task.completed && closed ? 'task-undone' : ''}`}
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      {!closed && (
        <button className="drag-handle" {...attributes} {...listeners}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" opacity="0.3">
            <circle cx="5" cy="3" r="1.5" /><circle cx="11" cy="3" r="1.5" />
            <circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" />
            <circle cx="5" cy="13" r="1.5" /><circle cx="11" cy="13" r="1.5" />
          </svg>
        </button>
      )}

      <motion.button
        className={`checkbox ${task.completed ? 'checkbox--checked' : ''}`}
        onClick={onToggle}
        disabled={closed}
        whileTap={{ scale: 0.85 }}
      >
        {task.completed && (
          <motion.svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3 }}
          >
            <polyline points="20 6 9 17 4 12" />
          </motion.svg>
        )}
      </motion.button>

      <div className="task-content">
        <span className={`task-name ${task.completed ? 'task-name--done' : ''}`}>{task.title}</span>
        {task.description && <span className="task-desc">{task.description}</span>}
      </div>

      <div className="task-meta">
        {task.estimatedMinutes > 0 && (
          <span className="task-time-tag">
            {task.estimatedMinutes >= 60
              ? `${Math.floor(task.estimatedMinutes / 60)}h${task.estimatedMinutes % 60 ? ` ${task.estimatedMinutes % 60}m` : ''}`
              : `${task.estimatedMinutes}m`}
          </span>
        )}
        <span className="priority-dots">
          {Array.from({ length: priorityDots[task.priority] || 2 }).map((_, i) => (
            <span key={i} className="priority-dot" style={{ background: priorityColors[task.priority] || '#f59e0b' }} />
          ))}
        </span>
        {!closed && (
          <>
            <motion.button
              className="btn-icon btn-backlog"
              onClick={onMoveToBacklog}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              title="Przenieś do backlogu"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
            </motion.button>
            <motion.button
              className="btn-icon btn-delete"
              onClick={onDelete}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </motion.button>
          </>
        )}
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
}) {
  const [editing, setEditing] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = tasks.findIndex((t) => t.id === active.id);
    const newIdx = tasks.findIndex((t) => t.id === over.id);
    if (oldIdx !== -1 && newIdx !== -1) {
      onReorderTasks(category.id, oldIdx, newIdx);
    }
  }

  const darken = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.floor(r * 0.45)}, ${Math.floor(g * 0.45)}, ${Math.floor(b * 0.45)})`;
  };

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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <AnimatePresence mode="popLayout">
                {tasks.map((task) => (
                  <SortableTask
                    key={task.id}
                    task={task}
                    closed={closed}
                    onToggle={() => onToggleTask(task.id)}
                    onDelete={() => onDeleteTask(task.id)}
                    onMoveToBacklog={() => onMoveToBacklog(task)}
                  />
                ))}
              </AnimatePresence>
            </SortableContext>
          </DndContext>

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
            />
          ))}
        </AnimatePresence>
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
