import { useState, useEffect, useCallback, useRef } from 'react';
import { goalApi, goalMasterTaskApi, milestoneApi, habitApi, categoryApi } from '../api';
import type {
  Goal,
  GoalDetail,
  GoalStatus,
  Milestone,
  LinkedHabit,
  LinkedTask,
  Habit,
  Category,
} from '../types';
import { GOAL_STATUS_LABELS } from '../types';
import { NavTabs } from '../components/NavTabs';
import { UserMenu } from '../components/UserMenu';
import { TaskModal } from '../components/TaskModal';

// ── Date helpers ──
const MONTH_NAMES = [
  'Styczen', 'Luty', 'Marzec', 'Kwiecien', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpien', 'Wrzesien', 'Pazdziernik', 'Listopad', 'Grudzien',
];
const WEEKDAY_HEADERS = ['Pon', 'Wt', 'Sr', 'Czw', 'Pt', 'Sob', 'Ndz'];

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

// ── DatePicker ──
function DatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (date: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  const firstDay = new Date(viewYear, viewMonth, 1);
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayStr = formatDate(new Date());

  function selectDay(day: number) {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${viewYear}-${m}-${d}`);
    setOpen(false);
  }

  const displayDate = value
    ? `${parseInt(value.slice(8, 10))} ${MONTH_NAMES[parseInt(value.slice(5, 7)) - 1]} ${value.slice(0, 4)}`
    : 'Wybierz date';

  return (
    <div className="datepicker" ref={ref}>
      <button
        type="button"
        className="datepicker-trigger"
        onClick={() => {
          if (!open) {
            setViewYear(selected.getFullYear());
            setViewMonth(selected.getMonth());
          }
          setOpen(!open);
        }}
      >
        {displayDate}
      </button>
      {open && (
        <div className="datepicker-dropdown">
          <div className="datepicker-nav">
            <button type="button" className="datepicker-nav-btn" onClick={prevMonth}>&#8249;</button>
            <span className="datepicker-month">{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button type="button" className="datepicker-nav-btn" onClick={nextMonth}>&#8250;</button>
          </div>
          <div className="datepicker-weekdays">
            {WEEKDAY_HEADERS.map((w) => (
              <span key={w} className="datepicker-weekday">{w}</span>
            ))}
          </div>
          <div className="datepicker-grid">
            {cells.map((day, i) => {
              if (day === null) return <span key={`e${i}`} className="datepicker-cell datepicker-cell--empty" />;
              const m = String(viewMonth + 1).padStart(2, '0');
              const d = String(day).padStart(2, '0');
              const cellDate = `${viewYear}-${m}-${d}`;
              const isSelected = cellDate === value;
              const isToday = cellDate === todayStr;
              return (
                <button
                  key={day}
                  type="button"
                  className={`datepicker-cell ${isSelected ? 'datepicker-cell--selected' : ''} ${isToday ? 'datepicker-cell--today' : ''}`}
                  onClick={() => selectDay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Link Dropdown ──
function LinkDropdown<T extends { id: number; name: string }>({
  items,
  onSelect,
  onClose,
}: {
  items: T[];
  onSelect: (item: T) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="link-dropdown" ref={ref}>
      <input
        className="link-dropdown-search"
        placeholder="Szukaj..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus
      />
      {filtered.length === 0 && (
        <div className="link-dropdown-empty">Brak wynikow</div>
      )}
      {filtered.map((item) => (
        <div
          key={item.id}
          className="link-dropdown-item"
          onClick={() => { onSelect(item); onClose(); }}
        >
          {item.name}
        </div>
      ))}
    </div>
  );
}

// ── Linked Items Display ──
function LinkedHabitsList({
  habits,
  onUnlink,
}: {
  habits: LinkedHabit[];
  onUnlink: (habitId: number) => void;
}) {
  if (habits.length === 0) return null;
  return (
    <div className="linked-items">
      <span className="linked-items-label">NAWYKI</span>
      {habits.map((h) => (
        <div key={h.habitId} className="linked-item">
          {h.categoryColor && (
            <span className="linked-item-dot" style={{ background: h.categoryColor }} />
          )}
          <span className="linked-item-name">{h.name}</span>
          <button
            className="linked-item-unlink"
            onClick={() => onUnlink(h.habitId)}
            title="Odlacz"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}

function LinkedTasksList({
  tasks,
  onUnlink,
}: {
  tasks: LinkedTask[];
  onUnlink: (taskId: number) => void;
}) {
  if (tasks.length === 0) return null;
  return (
    <div className="linked-items">
      <span className="linked-items-label">TASKI</span>
      {tasks.map((t) => (
        <div key={t.taskId} className="linked-item">
          <span className={`linked-item-check ${t.completed ? 'linked-item-check--done' : ''}`} />
          <span className="linked-item-name">{t.title}</span>
          <button
            className="linked-item-unlink"
            onClick={() => onUnlink(t.taskId)}
            title="Odlacz"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Goal Form ──
function GoalForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Goal;
  onSubmit: (data: { name: string; description: string; rules?: string; deadline?: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [rules, setRules] = useState(initial?.rules || '');
  const [deadline, setDeadline] = useState(initial?.deadline || '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      rules: rules.trim() || undefined,
      deadline: deadline || undefined,
    });
  }

  return (
    <form className="goal-form" onSubmit={handleSubmit}>
      <input
        className="habit-form-input"
        placeholder="Nazwa celu"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      <textarea
        className="habit-form-input goal-form-textarea"
        placeholder="Opis"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />
      <textarea
        className="habit-form-input goal-form-textarea"
        placeholder="Zasady / reguly (opcjonalne)"
        value={rules}
        onChange={(e) => setRules(e.target.value)}
        rows={3}
      />
      <div className="habit-form-row">
        <label className="habit-form-label">DEADLINE</label>
        {deadline ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DatePicker value={deadline} onChange={setDeadline} />
            <button type="button" className="linked-item-unlink" onClick={() => setDeadline('')}>&times;</button>
          </div>
        ) : (
          <button
            type="button"
            className="habit-schedule-btn"
            onClick={() => setDeadline(formatDate(new Date()))}
          >
            USTAW DEADLINE
          </button>
        )}
      </div>

      <div className="habit-form-actions">
        <button type="submit" className="habit-form-submit">
          {initial ? 'ZAPISZ' : 'DODAJ'}
        </button>
        <button type="button" className="habit-form-cancel" onClick={onCancel}>
          ANULUJ
        </button>
      </div>
    </form>
  );
}

// ── Create Habit Inline Form ──
function CreateHabitInlineForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { name: string; description?: string; categoryId?: number | null; scheduleType: string; scheduleDays?: string; scheduleInterval?: number; startDate: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [scheduleType] = useState('DAILY');
  const [startDate, setStartDate] = useState(formatDate(new Date()));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), scheduleType, startDate });
  }

  return (
    <form className="goal-inline-form" onSubmit={handleSubmit}>
      <input
        className="habit-form-input"
        placeholder="Nazwa nawyka"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      <div className="habit-form-row">
        <label className="habit-form-label">DATA STARTU</label>
        <DatePicker value={startDate} onChange={setStartDate} />
      </div>
      <div className="habit-form-actions">
        <button type="submit" className="habit-form-submit">DODAJ</button>
        <button type="button" className="habit-form-cancel" onClick={onCancel}>ANULUJ</button>
      </div>
    </form>
  );
}

// ── Milestone Item ──
function MilestoneItem({
  goalId,
  milestone,
  milestones,
  allHabits,
  categories,
  onRefresh,
}: {
  goalId: number;
  milestone: Milestone;
  milestones: Milestone[];
  allHabits: Habit[];
  categories: Category[];
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showLinkHabit, setShowLinkHabit] = useState(false);
  const [showLinkTask, setShowLinkTask] = useState(false);
  const [showCreateHabit, setShowCreateHabit] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);

  async function handleToggle() {
    try {
      await milestoneApi.toggleComplete(goalId, milestone.id);
      onRefresh();
    } catch { /* silent */ }
  }

  async function handleDelete() {
    try {
      await milestoneApi.delete(goalId, milestone.id);
      onRefresh();
    } catch { /* silent */ }
  }

  async function handleMove(direction: 'up' | 'down') {
    const sorted = [...milestones].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((m) => m.id === milestone.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const swapTarget = sorted[swapIdx];
    try {
      await milestoneApi.update(goalId, milestone.id, {
        name: milestone.name,
        description: milestone.description || undefined,
        deadline: milestone.deadline || undefined,
        sortOrder: swapTarget.sortOrder,
      });
      await milestoneApi.update(goalId, swapTarget.id, {
        name: swapTarget.name,
        description: swapTarget.description || undefined,
        deadline: swapTarget.deadline || undefined,
        sortOrder: milestone.sortOrder,
      });
      onRefresh();
    } catch { /* silent */ }
  }

  async function handleUnlinkHabit(habitId: number) {
    try {
      await milestoneApi.unlinkHabit(goalId, milestone.id, habitId);
      onRefresh();
    } catch { /* silent */ }
  }

  async function handleUnlinkTask(taskId: number) {
    try {
      await milestoneApi.unlinkTask(goalId, milestone.id, taskId);
      onRefresh();
    } catch { /* silent */ }
  }

  async function handleLinkHabit(habit: { id: number }) {
    try {
      await milestoneApi.linkHabit(goalId, milestone.id, habit.id);
      onRefresh();
    } catch { /* silent */ }
  }

  async function handleCreateHabit(data: Parameters<typeof milestoneApi.createHabit>[2]) {
    try {
      await milestoneApi.createHabit(goalId, milestone.id, data);
      setShowCreateHabit(false);
      onRefresh();
    } catch { /* silent */ }
  }

  async function handleCreateTask(data: Parameters<typeof milestoneApi.createTask>[2]) {
    try {
      await milestoneApi.createTask(goalId, milestone.id, data);
      setShowCreateTask(false);
      onRefresh();
    } catch { /* silent */ }
  }

  const linkedHabitIds = new Set(milestone.habits.map((h) => h.habitId));
  const availableHabits = allHabits
    .filter((h) => !linkedHabitIds.has(h.id))
    .map((h) => ({ id: h.id, name: h.name }));

  return (
    <div className="milestone-item">
      <div className="milestone-header">
        <button
          className={`tc-check ${milestone.completed ? 'tc-check--checked' : ''}`}
          onClick={handleToggle}
        />
        <div className="milestone-info" onClick={() => setExpanded(!expanded)}>
          <span className={`milestone-name ${milestone.completed ? 'milestone-name--done' : ''}`}>
            {milestone.name}
          </span>
          {milestone.deadline && (
            <span className="goal-deadline">{formatDisplayDate(milestone.deadline)}</span>
          )}
        </div>
        <div className="milestone-actions">
          <button className="milestone-arrow" onClick={() => handleMove('up')}>&#9650;</button>
          <button className="milestone-arrow" onClick={() => handleMove('down')}>&#9660;</button>
          <button className="linked-item-unlink" onClick={handleDelete}>&times;</button>
        </div>
      </div>

      {expanded && (
        <div className="milestone-body">
          {milestone.description && (
            <p className="milestone-desc">{milestone.description}</p>
          )}

          <LinkedHabitsList habits={milestone.habits} onUnlink={handleUnlinkHabit} />
          <LinkedTasksList tasks={milestone.tasks} onUnlink={handleUnlinkTask} />

          <div className="goal-link-actions">
            <button
              className="habit-schedule-btn"
              onClick={() => { setShowLinkHabit(!showLinkHabit); setShowLinkTask(false); }}
            >
              POLACZ NAWYK
            </button>
            <button
              className="habit-schedule-btn"
              onClick={() => { setShowLinkTask(!showLinkTask); setShowLinkHabit(false); }}
            >
              POLACZ TASK
            </button>
            <button
              className="habit-schedule-btn"
              onClick={() => { setShowCreateHabit(!showCreateHabit); setShowCreateTask(false); }}
            >
              NOWY NAWYK
            </button>
            <button
              className="habit-schedule-btn"
              onClick={() => { setShowCreateTask(!showCreateTask); setShowCreateHabit(false); }}
            >
              NOWY TASK
            </button>
          </div>

          {showLinkHabit && (
            <LinkDropdown
              items={availableHabits}
              onSelect={handleLinkHabit}
              onClose={() => setShowLinkHabit(false)}
            />
          )}
          {showLinkTask && (
            <div className="goal-link-note">Uzyj przycisku NOWY TASK aby utworzyc i polaczys task.</div>
          )}
          {showCreateHabit && (
            <CreateHabitInlineForm onSubmit={handleCreateHabit} onCancel={() => setShowCreateHabit(false)} />
          )}
        </div>
      )}
      {showCreateTask && (
        <TaskModal
          categories={categories}
          defaultDate={formatDate(new Date())}
          onSubmit={(data) => handleCreateTask({ ...data, date: data.date ?? formatDate(new Date()) })}
          onClose={() => setShowCreateTask(false)}
        />
      )}
    </div>
  );
}

// ── Goal Detail Overlay ──
function GoalDetailView({
  goalId,
  allHabits,
  categories,
  onClose,
  onGoalUpdated,
  onGoalDeleted,
}: {
  goalId: number;
  allHabits: Habit[];
  categories: Category[];
  onClose: () => void;
  onGoalUpdated: () => void;
  onGoalDeleted: (id: number) => void;
}) {
  const [detail, setDetail] = useState<GoalDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [showMasterTaskForm, setShowMasterTaskForm] = useState(false);
  const [masterTaskName, setMasterTaskName] = useState('');
  const [masterTaskDesc, setMasterTaskDesc] = useState('');
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [milestoneName, setMilestoneName] = useState('');
  const [milestoneDesc, setMilestoneDesc] = useState('');
  const [milestoneDeadline, setMilestoneDeadline] = useState('');
  const [showMTLinkHabit, setShowMTLinkHabit] = useState(false);
  const [showMTLinkTask, setShowMTLinkTask] = useState(false);
  const [showMTCreateHabit, setShowMTCreateHabit] = useState(false);
  const [showMTCreateTask, setShowMTCreateTask] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const data = await goalApi.getById(goalId);
      setDetail(data as GoalDetail);
    } catch { /* silent */ }
  }, [goalId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  async function handleUpdate(data: { name: string; description: string; rules?: string; deadline?: string }) {
    try {
      await goalApi.update(goalId, data);
      setEditing(false);
      fetchDetail();
      onGoalUpdated();
    } catch { /* silent */ }
  }

  async function handleDelete() {
    try {
      await goalApi.delete(goalId);
      onGoalDeleted(goalId);
    } catch { /* silent */ }
  }

  async function handleStatusChange(status: GoalStatus) {
    try {
      await goalApi.updateStatus(goalId, status);
      fetchDetail();
      onGoalUpdated();
    } catch { /* silent */ }
  }

  async function handleCreateMasterTask(e: React.FormEvent) {
    e.preventDefault();
    if (!masterTaskName.trim()) return;
    try {
      await goalMasterTaskApi.createOrUpdate(goalId, {
        name: masterTaskName.trim(),
        description: masterTaskDesc.trim() || undefined,
      });
      setShowMasterTaskForm(false);
      setMasterTaskName('');
      setMasterTaskDesc('');
      fetchDetail();
    } catch { /* silent */ }
  }

  async function handleAddMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!milestoneName.trim()) return;
    try {
      await milestoneApi.create(goalId, {
        name: milestoneName.trim(),
        description: milestoneDesc.trim() || undefined,
        deadline: milestoneDeadline || undefined,
      });
      setShowAddMilestone(false);
      setMilestoneName('');
      setMilestoneDesc('');
      setMilestoneDeadline('');
      fetchDetail();
    } catch { /* silent */ }
  }

  async function handleMTUnlinkHabit(habitId: number) {
    try {
      await goalMasterTaskApi.unlinkHabit(goalId, habitId);
      fetchDetail();
    } catch { /* silent */ }
  }

  async function handleMTUnlinkTask(taskId: number) {
    try {
      await goalMasterTaskApi.unlinkTask(goalId, taskId);
      fetchDetail();
    } catch { /* silent */ }
  }

  async function handleMTLinkHabit(habit: { id: number }) {
    try {
      await goalMasterTaskApi.linkHabit(goalId, habit.id);
      fetchDetail();
    } catch { /* silent */ }
  }

  async function handleMTCreateHabit(data: Parameters<typeof goalMasterTaskApi.createHabit>[1]) {
    try {
      await goalMasterTaskApi.createHabit(goalId, data);
      setShowMTCreateHabit(false);
      fetchDetail();
    } catch { /* silent */ }
  }

  async function handleMTCreateTask(data: Parameters<typeof goalMasterTaskApi.createTask>[1]) {
    try {
      await goalMasterTaskApi.createTask(goalId, data);
      setShowMTCreateTask(false);
      fetchDetail();
    } catch { /* silent */ }
  }

  if (!detail) {
    return (
      <div className="goal-overlay" onClick={onClose}>
        <div className="goal-detail" onClick={(e) => e.stopPropagation()}>
          <div className="fd-detail-header">
            <button className="fd-detail-close" onClick={onClose}>&#10005;</button>
          </div>
          <div className="fd-detail-body">Ladowanie...</div>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="goal-overlay" onClick={onClose}>
        <div className="goal-detail" onClick={(e) => e.stopPropagation()}>
          <div className="fd-detail-header">
            <button className="fd-detail-close" onClick={() => setEditing(false)}>&#10005;</button>
          </div>
          <div className="fd-detail-body">
            <GoalForm
              initial={detail}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  const mtLinkedHabitIds = new Set((detail.masterTask?.habits || []).map((h) => h.habitId));
  const mtAvailableHabits = allHabits
    .filter((h) => !mtLinkedHabitIds.has(h.id))
    .map((h) => ({ id: h.id, name: h.name }));

  const sortedMilestones = [...detail.milestones].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="goal-overlay" onClick={onClose}>
      <div className="goal-detail" onClick={(e) => e.stopPropagation()}>
        <div className="fd-detail-header">
          <button className="fd-detail-close" onClick={onClose}>&#10005;</button>
        </div>

        <div className="fd-detail-body">
          {/* Header */}
          <div className="goal-detail-top">
            <h2 className="fd-detail-name">{detail.name}</h2>
            <div className="goal-detail-meta">
              <span className={`goal-status-badge goal-status-badge--${detail.status.toLowerCase()}`}>
                {GOAL_STATUS_LABELS[detail.status]}
              </span>
              {detail.deadline && (
                <span className="goal-deadline">Deadline: {formatDisplayDate(detail.deadline)}</span>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="goal-detail-progress">
            <div className="goal-progress-bar">
              <div className="goal-progress-fill" style={{ width: `${detail.progress}%` }} />
            </div>
            <span className="goal-progress-text">{detail.progress}%</span>
          </div>

          {/* Description */}
          {detail.description && (
            <p className="fd-detail-desc">{detail.description}</p>
          )}

          {/* Rules */}
          {detail.rules && (
            <div className="goal-rules-section">
              <span className="goal-section-label">ZASADY</span>
              <div className="goal-rules-box">{detail.rules}</div>
            </div>
          )}

          {/* Master Task */}
          <div className="goal-section">
            <span className="goal-section-label">ZADANIE GLOWNE</span>
            {detail.masterTask ? (
              <div className="master-task-section">
                <h4 className="master-task-name">{detail.masterTask.name}</h4>
                {detail.masterTask.description && (
                  <p className="master-task-desc">{detail.masterTask.description}</p>
                )}

                <LinkedHabitsList habits={detail.masterTask.habits} onUnlink={handleMTUnlinkHabit} />
                <LinkedTasksList tasks={detail.masterTask.tasks} onUnlink={handleMTUnlinkTask} />

                <div className="goal-link-actions">
                  <button
                    className="habit-schedule-btn"
                    onClick={() => { setShowMTLinkHabit(!showMTLinkHabit); setShowMTLinkTask(false); }}
                  >
                    POLACZ NAWYK
                  </button>
                  <button
                    className="habit-schedule-btn"
                    onClick={() => { setShowMTLinkTask(!showMTLinkTask); setShowMTLinkHabit(false); }}
                  >
                    POLACZ TASK
                  </button>
                  <button
                    className="habit-schedule-btn"
                    onClick={() => { setShowMTCreateHabit(!showMTCreateHabit); setShowMTCreateTask(false); }}
                  >
                    NOWY NAWYK
                  </button>
                  <button
                    className="habit-schedule-btn"
                    onClick={() => { setShowMTCreateTask(!showMTCreateTask); setShowMTCreateHabit(false); }}
                  >
                    NOWY TASK
                  </button>
                </div>

                {showMTLinkHabit && (
                  <LinkDropdown
                    items={mtAvailableHabits}
                    onSelect={handleMTLinkHabit}
                    onClose={() => setShowMTLinkHabit(false)}
                  />
                )}
                {showMTLinkTask && (
                  <div className="goal-link-note">Uzyj przycisku NOWY TASK aby utworzyc i polaczyc task.</div>
                )}
                {showMTCreateHabit && (
                  <CreateHabitInlineForm onSubmit={handleMTCreateHabit} onCancel={() => setShowMTCreateHabit(false)} />
                )}
                {showMTCreateTask && (
                  <TaskModal
                    categories={categories}
                    defaultDate={formatDate(new Date())}
                    onSubmit={(data) => handleMTCreateTask({ ...data, date: data.date ?? formatDate(new Date()) })}
                    onClose={() => setShowMTCreateTask(false)}
                  />
                )}
              </div>
            ) : (
              <div>
                {showMasterTaskForm ? (
                  <form className="goal-inline-form" onSubmit={handleCreateMasterTask}>
                    <input
                      className="habit-form-input"
                      placeholder="Nazwa zadania glownego"
                      value={masterTaskName}
                      onChange={(e) => setMasterTaskName(e.target.value)}
                      autoFocus
                    />
                    <input
                      className="habit-form-input"
                      placeholder="Opis (opcjonalny)"
                      value={masterTaskDesc}
                      onChange={(e) => setMasterTaskDesc(e.target.value)}
                    />
                    <div className="habit-form-actions">
                      <button type="submit" className="habit-form-submit">DODAJ</button>
                      <button type="button" className="habit-form-cancel" onClick={() => setShowMasterTaskForm(false)}>ANULUJ</button>
                    </div>
                  </form>
                ) : (
                  <button
                    className="habit-schedule-btn"
                    onClick={() => setShowMasterTaskForm(true)}
                  >
                    DODAJ ZADANIE GLOWNE
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Milestones */}
          <div className="goal-section">
            <div className="goal-section-header">
              <span className="goal-section-label">
                KAMIENIE MILOWE
                <span className="goal-section-count">
                  {detail.milestonesCompleted}/{detail.milestonesCount}
                </span>
              </span>
              <button
                className="habit-schedule-btn"
                onClick={() => setShowAddMilestone(!showAddMilestone)}
              >
                {showAddMilestone ? 'ANULUJ' : 'DODAJ MILESTONE'}
              </button>
            </div>

            {showAddMilestone && (
              <form className="goal-inline-form" onSubmit={handleAddMilestone}>
                <input
                  className="habit-form-input"
                  placeholder="Nazwa kamienia milowego"
                  value={milestoneName}
                  onChange={(e) => setMilestoneName(e.target.value)}
                  autoFocus
                />
                <input
                  className="habit-form-input"
                  placeholder="Opis (opcjonalny)"
                  value={milestoneDesc}
                  onChange={(e) => setMilestoneDesc(e.target.value)}
                />
                <div className="habit-form-row">
                  <label className="habit-form-label">DEADLINE</label>
                  {milestoneDeadline ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <DatePicker value={milestoneDeadline} onChange={setMilestoneDeadline} />
                      <button type="button" className="linked-item-unlink" onClick={() => setMilestoneDeadline('')}>&times;</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="habit-schedule-btn"
                      onClick={() => setMilestoneDeadline(formatDate(new Date()))}
                    >
                      USTAW DEADLINE
                    </button>
                  )}
                </div>
                <div className="habit-form-actions">
                  <button type="submit" className="habit-form-submit">DODAJ</button>
                  <button type="button" className="habit-form-cancel" onClick={() => setShowAddMilestone(false)}>ANULUJ</button>
                </div>
              </form>
            )}

            {sortedMilestones.length === 0 && !showAddMilestone && (
              <div className="habit-empty">Brak kamieni milowych.</div>
            )}

            {sortedMilestones.map((m) => (
              <MilestoneItem
                key={m.id}
                goalId={goalId}
                milestone={m}
                milestones={sortedMilestones}
                allHabits={allHabits}
                categories={categories}
                onRefresh={fetchDetail}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="goal-detail-actions">
            <button className="habit-action-btn" onClick={() => setEditing(true)}>
              EDYTUJ
            </button>
            {detail.status === 'ACTIVE' && (
              <button className="habit-action-btn" onClick={() => handleStatusChange('COMPLETED')}>
                UKONCZ
              </button>
            )}
            {detail.status === 'ACTIVE' && (
              <button className="habit-action-btn" onClick={() => handleStatusChange('ARCHIVED')}>
                ARCHIWIZUJ
              </button>
            )}
            {detail.status === 'ARCHIVED' && (
              <button className="habit-action-btn" onClick={() => handleStatusChange('ACTIVE')}>
                WZNOW
              </button>
            )}
            {detail.status === 'COMPLETED' && (
              <button className="habit-action-btn" onClick={() => handleStatusChange('ACTIVE')}>
                WZNOW
              </button>
            )}
            <button className="habit-action-btn habit-action-btn--danger" onClick={handleDelete}>
              USUN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Goal Card ──
function GoalCard({ goal, onClick }: { goal: Goal; onClick: () => void }) {
  return (
    <div className="goal-card" onClick={onClick}>
      <div className="goal-card-top">
        <h3 className="goal-card-name">{goal.name}</h3>
        <span className={`goal-status-badge goal-status-badge--${goal.status.toLowerCase()}`}>
          {GOAL_STATUS_LABELS[goal.status]}
        </span>
      </div>
      {goal.description && (
        <p className="goal-card-desc">{goal.description}</p>
      )}
      <div className="goal-card-progress">
        <div className="goal-progress-bar">
          <div className="goal-progress-fill" style={{ width: `${goal.progress}%` }} />
        </div>
        <span className="goal-progress-text">{goal.progress}%</span>
      </div>
      <div className="goal-card-footer">
        {goal.deadline && (
          <span className="goal-deadline">{formatDisplayDate(goal.deadline)}</span>
        )}
        {goal.milestonesCount > 0 && (
          <span className="goal-milestones-count">
            {goal.milestonesCompleted}/{goal.milestonesCount} kamieni milowych
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──
export function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [allHabits, setAllHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [filter, setFilter] = useState<GoalStatus>('ACTIVE');

  const fetchData = useCallback(async () => {
    try {
      const [goalsData, habitsData, catsData] = await Promise.all([
        goalApi.getAll(),
        habitApi.getAll(),
        categoryApi.getAll(),
      ]);
      setGoals(goalsData as Goal[]);
      setAllHabits(habitsData as Habit[]);
      setCategories(catsData as Category[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCreate(data: { name: string; description: string; rules?: string; deadline?: string }) {
    try {
      const g = await goalApi.create(data);
      setGoals((prev) => [...prev, g as Goal]);
      setShowForm(false);
    } catch { /* silent */ }
  }

  function handleGoalDeleted(id: number) {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    setSelectedGoalId(null);
  }

  const filtered = goals.filter((g) => g.status === filter);

  const counts: Record<GoalStatus, number> = {
    ACTIVE: goals.filter((g) => g.status === 'ACTIVE').length,
    COMPLETED: goals.filter((g) => g.status === 'COMPLETED').length,
    ARCHIVED: goals.filter((g) => g.status === 'ARCHIVED').length,
  };

  if (loading) {
    return <div className="app loading">Ladowanie...</div>;
  }

  return (
    <div className="app">
      <div className="page-header">
        <NavTabs />
        <UserMenu />
      </div>

      <div className="section">
        <div className="section-header">
          <h1 className="section-title">CELE</h1>
          <button className="btn-add" onClick={() => setShowForm(true)}>
            + NOWY CEL
          </button>
        </div>

        {/* Filter tabs */}
        <div className="habit-filters">
          {(['ACTIVE', 'COMPLETED', 'ARCHIVED'] as GoalStatus[]).map((s) => (
            <button
              key={s}
              className={`habit-filter-btn ${filter === s ? 'habit-filter-btn--active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s === 'ACTIVE' ? 'AKTYWNE' : s === 'COMPLETED' ? 'UKONCZONE' : 'ARCHIWUM'}
              <span className="habit-filter-count">{counts[s]}</span>
            </button>
          ))}
        </div>

        {/* Add form */}
        {showForm && (
          <GoalForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Goals grid */}
        {filtered.length === 0 && !showForm && (
          <div className="habit-empty">
            Brak celow w tej kategorii.
          </div>
        )}

        <div className="goals-grid">
          {filtered.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onClick={() => setSelectedGoalId(goal.id)}
            />
          ))}
        </div>
      </div>

      {/* Detail overlay */}
      {selectedGoalId !== null && (
        <GoalDetailView
          goalId={selectedGoalId}
          allHabits={allHabits}
          categories={categories}
          onClose={() => setSelectedGoalId(null)}
          onGoalUpdated={fetchData}
          onGoalDeleted={handleGoalDeleted}
        />
      )}
    </div>
  );
}
