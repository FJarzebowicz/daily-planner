import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BacklogTask, Category } from '../types';
import { TIME_PRESETS } from '../types';

interface BacklogProps {
  open: boolean;
  onToggle: () => void;
  backlog: BacklogTask[];
  onAddTask: (data: { name: string; description: string; estimatedMinutes: number; priority: string }) => void;
  onDeleteTask: (id: number) => void;
  onMoveToDay: (task: BacklogTask, categoryId: number) => void;
  categories: Category[];
}

export function Backlog({ open, onToggle, backlog, onAddTask, onDeleteTask, onMoveToDay, categories }: BacklogProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [movingTask, setMovingTask] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', description: '', estimatedMinutes: 30, priority: 'MEDIUM' });
  const [customTime, setCustomTime] = useState('');

  function addTask() {
    if (!form.name.trim()) return;
    onAddTask({
      name: form.name.trim(),
      description: form.description.trim(),
      estimatedMinutes: form.estimatedMinutes,
      priority: form.priority,
    });
    setForm({ name: '', description: '', estimatedMinutes: 30, priority: 'MEDIUM' });
    setCustomTime('');
    setShowAdd(false);
  }

  const priorityLabels: Record<string, string> = { LOW: 'Niski', MEDIUM: 'Średni', HIGH: 'Wysoki' };
  const priorityColors: Record<string, string> = { LOW: '#94a3b8', MEDIUM: '#f59e0b', HIGH: '#ef4444' };

  return (
    <>
      {/* Toggle tab */}
      <motion.button
        className="backlog-tab"
        onClick={onToggle}
        whileHover={{ x: open ? 0 : -4 }}
        animate={{ right: open ? 380 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <span className="backlog-tab-text">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
          Backlog
          {backlog.length > 0 && <span className="backlog-badge">{backlog.length}</span>}
        </span>
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="backlog-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
            />
            <motion.aside
              className="backlog-sidebar"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="backlog-header">
                <h2 className="backlog-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                  Backlog
                </h2>
                <button className="backlog-close" onClick={onToggle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>

              <p className="backlog-desc">Taski bez terminu. Kliknij, aby przenieść na dzień.</p>

              {/* Add form */}
              {!showAdd ? (
                <motion.button
                  className="backlog-add-btn"
                  onClick={() => setShowAdd(true)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  Dodaj do backlogu
                </motion.button>
              ) : (
                <motion.div
                  className="backlog-form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <input
                    className="form-input"
                    placeholder="Nazwa tasku"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && addTask()}
                    autoFocus
                  />
                  <input
                    className="form-input"
                    placeholder="Opis (opcjonalny)"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                  <div className="time-presets">
                    {TIME_PRESETS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        className={`preset-btn ${form.estimatedMinutes === p.value && !customTime ? 'preset-btn--active' : ''}`}
                        onClick={() => { setForm({ ...form, estimatedMinutes: p.value }); setCustomTime(''); }}
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
                        if (v > 0) setForm({ ...form, estimatedMinutes: v });
                      }}
                      min="1"
                    />
                  </div>
                  <div className="priority-picker">
                    {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`priority-btn priority-btn--${p.toLowerCase()} ${form.priority === p ? 'priority-btn--active' : ''}`}
                        onClick={() => setForm({ ...form, priority: p })}
                      >
                        {priorityLabels[p]}
                      </button>
                    ))}
                  </div>
                  <div className="backlog-form-actions">
                    <button className="btn-modal btn-modal--save" onClick={addTask}>Dodaj</button>
                    <button className="btn-modal btn-modal--cancel" onClick={() => setShowAdd(false)}>Anuluj</button>
                  </div>
                </motion.div>
              )}

              {/* Task list */}
              <div className="backlog-list">
                <AnimatePresence mode="popLayout">
                  {backlog.length === 0 && (
                    <motion.p className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      Backlog jest pusty
                    </motion.p>
                  )}
                  {backlog.map((task) => (
                    <motion.div
                      key={task.id}
                      className="backlog-task"
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="backlog-task-main" onClick={() => setMovingTask(movingTask === task.id ? null : task.id)}>
                        <div className="backlog-task-info">
                          <span className="backlog-task-name">{task.name}</span>
                          {task.description && <span className="backlog-task-desc">{task.description}</span>}
                        </div>
                        <div className="backlog-task-tags">
                          {task.estimatedMinutes > 0 && (
                            <span className="task-time-tag">
                              {task.estimatedMinutes >= 60
                                ? `${Math.floor(task.estimatedMinutes / 60)}h${task.estimatedMinutes % 60 ? ` ${task.estimatedMinutes % 60}m` : ''}`
                                : `${task.estimatedMinutes}m`}
                            </span>
                          )}
                          <span className="priority-dots">
                            {Array.from({ length: { LOW: 1, MEDIUM: 2, HIGH: 3 }[task.priority] || 2 }).map((_, i) => (
                              <span key={i} className="priority-dot" style={{ background: priorityColors[task.priority] || '#f59e0b' }} />
                            ))}
                          </span>
                          <motion.button
                            className="btn-icon btn-delete"
                            onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          </motion.button>
                        </div>
                      </div>

                      {/* Category picker for moving to day */}
                      <AnimatePresence>
                        {movingTask === task.id && (
                          <motion.div
                            className="backlog-move-panel"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            <span className="backlog-move-label">Przenieś do kategorii:</span>
                            <div className="backlog-move-cats">
                              {categories.map((cat) => (
                                <motion.button
                                  key={cat.id}
                                  className="backlog-move-cat"
                                  style={{ backgroundColor: cat.color }}
                                  onClick={() => { onMoveToDay(task, cat.id); setMovingTask(null); }}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  {cat.name}
                                </motion.button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
