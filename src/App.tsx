import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { DayData, BacklogTask, Task, Category, MealSlot, Note, RecurringEvent, HabitForDate } from './types';
import { formatDate, getWeekStart } from './utils';
import { dayApi, categoryApi, taskApi, mealApi, thoughtApi, recurringEventApi, backlogApi, habitApi } from './api';
import {
  DndContext,
  closestCenter,
  pointerWithin,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Header';
import { TodoSection } from './components/TodoSection';
import { MealsSection } from './components/MealsSection';
import { NotesSection } from './components/NotesSection';
import { EventsSection } from './components/EventsSection';
import { Backlog } from './components/Backlog';
import { NavTabs } from './components/NavTabs';
import { UserMenu } from './components/UserMenu';
import { WeekStrip } from './components/WeekStrip';
import { WeeklyGoalsSidebar } from './components/WeeklyGoalsSidebar';
import './App.css';

/* Custom collision detection: prioritize special drop zones, fall back to closestCenter for tasks */
function customCollisionDetection(args: Parameters<typeof closestCenter>[0]) {
  const pointerCollisions = pointerWithin(args);
  const specialZone = pointerCollisions.find(
    (c) => c.id === 'backlog-drop-tab' || c.id === 'backlog-drop-sidebar' || c.id === 'currently-working',
  );
  if (specialZone) return [specialZone];
  return closestCenter(args);
}

/**
 * Główny komponent aplikacji — widok dzienny plannera.
 *
 * Zarządza stanem całego dnia: tasks, meals, notes, events, habits, backlog.
 * Obsługuje DnD (drag-and-drop) tasków między kategoriami i do backlogu.
 *
 * Nawigacja między dniami odbywa się przez:
 *  - strzałki w Header (poprzedni/następny dzień)
 *  - picker daty w Header
 *  - URL query param ?date=YYYY-MM-DD (używany przez WeeklyPage przy kliknięciu dnia)
 */
function App() {
  const todayStr = formatDate(new Date());

  /**
   * Obsługa URL query param ?date=YYYY-MM-DD.
   * Pozwala WeeklyPage nawigować do konkretnego dnia przez link.
   * Jeśli param nieobecny — domyślnie dzisiaj.
   */
  const [searchParams] = useSearchParams();
  const initialDate = searchParams.get('date') || todayStr;
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [day, setDay] = useState<DayData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meals, setMeals] = useState<MealSlot[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [recurringEvents, setRecurringEvents] = useState<RecurringEvent[]>([]);
  const [backlog, setBacklog] = useState<BacklogTask[]>([]);
  const [habits, setHabits] = useState<HabitForDate[]>([]);
  const [backlogOpen, setBacklogOpen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allDone, setAllDone] = useState(false);
  const slideDir = useRef(0);

  /** weekStart dla WeekStrip i WeeklyGoalsSidebar — aktualizuje się przy zmianie dnia */
  const weekStart = getWeekStart(currentDate);

  // Swap toast
  const [swapToast, setSwapToast] = useState<{ title: string; newOrder: number | null } | null>(null);
  const swapToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // DnD state
  const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [isOverCW, setIsOverCW] = useState(false);
  const [isOverBacklog, setIsOverBacklog] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const loadDay = useCallback(async (date: string) => {
    try {
      const [dayData, cats, dayTasks, dayMeals, dayNotes, events, backlogTasks, dayHabits] = await Promise.all([
        dayApi.get(date),
        categoryApi.getAll(),
        taskApi.getByDay(date),
        mealApi.getByDay(date),
        thoughtApi.getByDay(date),
        recurringEventApi.getByDay(date),
        backlogApi.getAll(),
        habitApi.getForDate(date),
      ]);
      setDay(dayData as DayData);
      setCategories(cats);
      setTasks(dayTasks);
      setMeals(dayMeals as MealSlot[]);
      setNotes(dayNotes as Note[]);
      setRecurringEvents(events);
      setBacklog(backlogTasks);
      setHabits(dayHabits as HabitForDate[]);
    } catch (err) {
      console.error('Failed to load day:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDay(currentDate);
  }, [currentDate, loadDay]);

  // Clear currentTaskId when the task disappears
  useEffect(() => {
    if (currentTaskId && !tasks.find((t) => t.id === currentTaskId)) {
      setCurrentTaskId(null);
    }
  }, [tasks, currentTaskId]);

  // Easter egg: all tasks done
  useEffect(() => {
    if (tasks.length > 0 && tasks.every((t) => t.completed)) {
      setAllDone(true);
      const timer = setTimeout(() => setAllDone(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [tasks]);

  function navigateToDate(date: string) {
    if (!date || date === currentDate) return;
    slideDir.current = date > currentDate ? 1 : -1;
    setCurrentDate(date);
  }

  async function updateWakeUp(time: string) {
    if (!day) return;
    const updated = await dayApi.update(currentDate, { ...day, wakeUpTime: time });
    setDay(updated as DayData);
  }

  async function updateSleep(time: string) {
    if (!day) return;
    const updated = await dayApi.update(currentDate, { ...day, sleepTime: time });
    setDay(updated as DayData);
  }

  async function closeDay() {
    if (!day || day.closed) return;
    const updated = await dayApi.update(currentDate, { ...day, closed: true });
    setDay(updated as DayData);
  }

  // ── Category CRUD ──
  async function addCategory(data: { name: string; color: string }) {
    const cat = await categoryApi.create({ ...data, sortOrder: categories.length });
    setCategories((prev) => [...prev, cat]);
  }

  async function editCategory(id: number, updates: Partial<Category>) {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    const updated = await categoryApi.update(id, { ...cat, ...updates });
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }

  async function deleteCategory(id: number) {
    await categoryApi.delete(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setTasks((prev) => prev.filter((t) => t.categoryId !== id));
  }

  // ── Task CRUD ──

  /**
   * Tworzy nowy task dla bieżącego dnia.
   * weeklyGoalId jest opcjonalne — normalizujemy undefined → null
   * przed wysłaniem do API (backend oczekuje number | null, nie undefined).
   */
  async function addTask(data: { title: string; description: string; categoryId: number; estimatedMinutes: number; priority: string; weeklyGoalId?: number | null }) {
    const task = await taskApi.create(currentDate, { ...data, weeklyGoalId: data.weeklyGoalId ?? null });
    setTasks((prev) => [...prev, task]);
  }

  async function toggleTask(id: number) {
    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
    try {
      const updated = await taskApi.toggle(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      // Revert on failure
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
      console.error('Failed to toggle task:', err);
    }
  }

  async function deleteTask(id: number) {
    await taskApi.delete(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  async function reorderTasks(categoryId: number, oldIndex: number, newIndex: number) {
    const catTasks = tasks.filter((t) => t.categoryId === categoryId).sort((a, b) => a.sortOrder - b.sortOrder);
    const reordered = [...catTasks];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    const updatedTasks = reordered.map((t, i) => ({ ...t, sortOrder: i }));

    const otherTasks = tasks.filter((t) => t.categoryId !== categoryId);
    setTasks([...otherTasks, ...updatedTasks]);

    await taskApi.reorder(updatedTasks.map((t) => t.id));
  }

  async function setGlobalOrder(taskId: number, globalOrder: number | null): Promise<{ displacedTitle: string | null }> {
    const result = await taskApi.setGlobalOrder(taskId, globalOrder);
    setTasks((prev) => prev.map((t) => {
      if (t.id === result.updated.id) return { ...t, globalOrder: result.updated.globalOrder };
      if (result.displaced && t.id === result.displaced.id) return { ...t, globalOrder: result.displaced.globalOrder };
      return t;
    }));
    if (result.displaced) {
      if (swapToastTimer.current) clearTimeout(swapToastTimer.current);
      setSwapToast({ title: result.displaced.title, newOrder: result.displaced.globalOrder });
      swapToastTimer.current = setTimeout(() => setSwapToast(null), 3000);
    }
    return { displacedTitle: result.displaced?.title ?? null };
  }

  async function moveTaskToBacklog(task: Task) {
    await taskApi.delete(task.id);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    const bt = await backlogApi.create({
      name: task.title,
      description: task.description,
      estimatedMinutes: task.estimatedMinutes,
      priority: task.priority,
    });
    setBacklog((prev) => [...prev, bt]);
  }

  async function moveTaskToCategory(task: Task, newCategoryId: number, insertBeforeTaskId: number) {
    const newCatTasks = tasks
      .filter((t) => t.categoryId === newCategoryId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const insertIdx = newCatTasks.findIndex((t) => t.id === insertBeforeTaskId);
    const reordered = [...newCatTasks];
    reordered.splice(insertIdx >= 0 ? insertIdx : reordered.length, 0, { ...task, categoryId: newCategoryId });
    const newOrder = reordered.map((t, i) => ({ ...t, sortOrder: i }));

    const oldCatTasks = tasks
      .filter((t) => t.categoryId === task.categoryId && t.id !== task.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((t, i) => ({ ...t, sortOrder: i }));

    const otherTasks = tasks.filter(
      (t) => t.id !== task.id && t.categoryId !== newCategoryId && t.categoryId !== task.categoryId,
    );
    setTasks([...otherTasks, ...oldCatTasks, ...newOrder]);

    try {
      await taskApi.update(task.id, { ...task, categoryId: newCategoryId });
      await taskApi.reorder(newOrder.map((t) => t.id));
    } catch (err) {
      console.error('Failed to move task:', err);
      loadDay(currentDate);
    }
  }

  // ── DnD handlers ──
  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setDraggingTask(task);
  }

  function handleDragOver(event: DragOverEvent) {
    setIsOverCW(event.over?.id === 'currently-working');
    setIsOverBacklog(event.over?.id === 'backlog-drop-tab' || event.over?.id === 'backlog-drop-sidebar');
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggingTask(null);
    setIsOverCW(false);
    setIsOverBacklog(false);
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Drop on currently-working box
    if (over.id === 'currently-working') {
      if (!activeTask.completed) setCurrentTaskId(activeTask.id);
      return;
    }

    // Drop on backlog
    if (over.id === 'backlog-drop-tab' || over.id === 'backlog-drop-sidebar') {
      moveTaskToBacklog(activeTask);
      return;
    }

    // Drop on another task
    const overTask = tasks.find((t) => t.id === over.id);
    if (!overTask) return;

    if (activeTask.categoryId === overTask.categoryId) {
      // Same category — reorder
      if (active.id !== over.id) {
        const catTasks = tasks
          .filter((t) => t.categoryId === activeTask.categoryId)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        const oldIdx = catTasks.findIndex((t) => t.id === active.id);
        const newIdx = catTasks.findIndex((t) => t.id === over.id);
        if (oldIdx !== -1 && newIdx !== -1) {
          reorderTasks(activeTask.categoryId, oldIdx, newIdx);
        }
      }
    } else {
      // Cross-category move
      moveTaskToCategory(activeTask, overTask.categoryId, over.id as number);
    }
  }

  function handleDragCancel() {
    setDraggingTask(null);
    setIsOverCW(false);
    setIsOverBacklog(false);
  }

  // ── Meal ──
  const updateMeal = useCallback(async (id: number, updates: { description: string; eaten: boolean }) => {
    const updated = await mealApi.update(id, updates);
    setMeals((prev) => prev.map((m) => (m.id === id ? (updated as MealSlot) : m)));
  }, []);

  // ── Notes ──
  async function addNote(content: string) {
    const note = await thoughtApi.create(currentDate, content);
    setNotes((prev) => [...prev, note as Note]);
  }

  async function deleteNote(id: number) {
    await thoughtApi.delete(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  // ── Recurring Events ──
  async function addEvent(data: { name: string; startTime: string; endTime: string }) {
    const event = await recurringEventApi.create(currentDate, data);
    setRecurringEvents((prev) => [...prev, event].sort((a, b) => a.startTime.localeCompare(b.startTime)));
  }

  async function deleteEvent(id: number) {
    await recurringEventApi.delete(id);
    setRecurringEvents((prev) => prev.filter((e) => e.id !== id));
  }

  async function copyEventsFromPreviousDay() {
    const events = await recurringEventApi.copyFromPreviousDay(currentDate);
    setRecurringEvents(events);
  }

  // ── Habits ──
  async function toggleHabit(id: number, completed: boolean) {
    // Optimistic update
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, completed: !completed } : h)));
    try {
      if (completed) {
        await habitApi.uncomplete(id, currentDate);
      } else {
        await habitApi.complete(id, currentDate);
      }
    } catch {
      // Revert
      setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, completed } : h)));
    }
  }

  // ── Backlog ──
  async function addBacklogTask(data: { name: string; description: string; estimatedMinutes: number; priority: string }) {
    const bt = await backlogApi.create(data);
    setBacklog((prev) => [...prev, bt]);
  }

  async function deleteBacklogTask(id: number) {
    await backlogApi.delete(id);
    setBacklog((prev) => prev.filter((t) => t.id !== id));
  }

  async function moveBacklogToDay(task: BacklogTask, categoryId: number) {
    const newTask = await backlogApi.moveToDay(task.id, currentDate, categoryId);
    setBacklog((prev) => prev.filter((t) => t.id !== task.id));
    setTasks((prev) => [...prev, newTask]);
  }

  // Drag ghost info
  const draggingCategory = draggingTask
    ? categories.find((c) => c.id === draggingTask.categoryId)
    : null;

  if (loading && !day) {
    return <div className="app loading">Ładowanie...</div>;
  }

  return (
    <div className="app">
      {/* Górna nawigacja — spójna z innymi stronami */}
      <div className="app-topbar">
        <NavTabs />
        <UserMenu />
      </div>

      {/* Pasek tygodnia — zawsze widoczny, nawigacja między dniami */}
      <WeekStrip
        currentDate={currentDate}
        onNavigate={navigateToDate}
        goalsOpen={goalsOpen}
        onToggleGoals={() => setGoalsOpen((v) => !v)}
      />

      {/* All done confetti easter egg */}
      <AnimatePresence>
        {allDone && (
          <motion.div
            className="all-done-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="confetti-container">
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="confetti-piece" style={{
                  '--x': `${Math.random() * 100}vw`,
                  '--delay': `${Math.random() * 0.5}s`,
                  '--rotation': `${Math.random() * 720 - 360}deg`,
                  '--color': ['#FF3B00', '#2538EB', '#000000', '#FF3B00', '#2538EB', '#000000'][i % 6],
                } as React.CSSProperties} />
              ))}
            </div>
            <motion.span
              className="all-done-text"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Dzien ogarniety!
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {swapToast && (
          <motion.div
            className="swap-toast"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2 }}
          >
            <span className="swap-toast-icon">#</span>
            <span>
              <strong>{swapToast.title}</strong> przeniesiony na{' '}
              {swapToast.newOrder != null ? `#${String(swapToast.newOrder).padStart(2, '0')}` : 'brak numeru'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <Header
        day={day!}
        tasks={tasks}
        meals={meals}
        notes={notes}
        currentDate={currentDate}
        onUpdateWakeUp={updateWakeUp}
        onUpdateSleep={updateSleep}
        onCloseDay={closeDay}
        onNavigate={navigateToDate}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={currentDate}
            className="main"
            initial={{ opacity: 0, x: slideDir.current * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: slideDir.current * -24 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            {day && (
              <>
                <TodoSection
                  tasks={tasks}
                  categories={categories}
                  closed={day.closed}
                  onToggleTask={toggleTask}
                  onDeleteTask={deleteTask}
                  onAddTask={addTask}
                  onReorderTasks={reorderTasks}
                  onMoveToBacklog={moveTaskToBacklog}
                  onAddCategory={addCategory}
                  onEditCategory={editCategory}
                  onDeleteCategory={deleteCategory}
                  currentTaskId={currentTaskId}
                  onSetCurrentTask={setCurrentTaskId}
                  isOverCW={isOverCW}
                  habits={habits}
                  onToggleHabit={toggleHabit}
                  onSetGlobalOrder={setGlobalOrder}
                />
                <div className="grid-bottom">
                  <MealsSection meals={meals} closed={day.closed} onUpdateMeal={updateMeal} />
                  <div className="grid-bottom-right">
                    <NotesSection notes={notes} closed={day.closed} onAddNote={addNote} onDeleteNote={deleteNote} />
                    <EventsSection events={recurringEvents} closed={day.closed} onAddEvent={addEvent} onDeleteEvent={deleteEvent} onCopyFromPreviousDay={copyEventsFromPreviousDay} />
                  </div>
                </div>

              </>
            )}
          </motion.main>
        </AnimatePresence>

        {/* Sidebar celów tygodniowych */}
        <WeeklyGoalsSidebar
          open={goalsOpen}
          onClose={() => setGoalsOpen(false)}
          weekStart={weekStart}
        />

        <Backlog
          open={backlogOpen}
          onToggle={() => setBacklogOpen(!backlogOpen)}
          backlog={backlog}
          onAddTask={addBacklogTask}
          onDeleteTask={deleteBacklogTask}
          onMoveToDay={moveBacklogToDay}
          categories={categories}
          isDragging={!!draggingTask}
          isOverBacklog={isOverBacklog}
        />

        <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {draggingTask && (
            <div className="tc tc-ghost" style={{ borderColor: draggingCategory?.color || '#ddd' }}>
              <div className="tc-top">
                <span className="tc-title">{draggingTask.title}</span>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default App;
