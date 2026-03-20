import { useState, useEffect, useCallback } from 'react';
import type { DayData, BacklogTask, Task, Category, MealSlot, Note, RecurringEvent } from './types';
import { formatDate } from './utils';
import { dayApi, categoryApi, taskApi, mealApi, thoughtApi, recurringEventApi, backlogApi } from './api';
import { Header } from './components/Header';
import { TodoSection } from './components/TodoSection';
import { MealsSection } from './components/MealsSection';
import { NotesSection } from './components/NotesSection';
import { EventsSection } from './components/EventsSection';
import { Backlog } from './components/Backlog';
import './App.css';

function App() {
  const todayStr = formatDate(new Date());
  const [currentDate, setCurrentDate] = useState(todayStr);
  const [day, setDay] = useState<DayData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meals, setMeals] = useState<MealSlot[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [recurringEvents, setRecurringEvents] = useState<RecurringEvent[]>([]);
  const [backlog, setBacklog] = useState<BacklogTask[]>([]);
  const [backlogOpen, setBacklogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDay = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const [dayData, cats, dayTasks, dayMeals, dayNotes, events, backlogTasks] = await Promise.all([
        dayApi.get(date),
        categoryApi.getAll(),
        taskApi.getByDay(date),
        mealApi.getByDay(date),
        thoughtApi.getByDay(date),
        recurringEventApi.getAll(),
        backlogApi.getAll(),
      ]);
      setDay(dayData as DayData);
      setCategories(cats);
      setTasks(dayTasks);
      setMeals(dayMeals as MealSlot[]);
      setNotes(dayNotes as Note[]);
      setRecurringEvents(events);
      setBacklog(backlogTasks);
    } catch (err) {
      console.error('Failed to load day:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDay(currentDate);
  }, [currentDate, loadDay]);

  function navigateToDate(date: string) {
    if (!date) return;
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
    const confirmed = window.confirm('Czy na pewno chcesz zamknąć dzień? Ta operacja jest nieodwracalna.');
    if (!confirmed) return;
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
  async function addTask(data: { title: string; description: string; categoryId: number; estimatedMinutes: number; priority: string }) {
    const task = await taskApi.create(currentDate, data);
    setTasks((prev) => [...prev, task]);
  }

  async function toggleTask(id: number) {
    const updated = await taskApi.toggle(id);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
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

    // Optimistic update
    const otherTasks = tasks.filter((t) => t.categoryId !== categoryId);
    setTasks([...otherTasks, ...updatedTasks]);

    await taskApi.reorder(updatedTasks.map((t) => t.id));
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

  // ── Meal ──
  async function updateMeal(id: number, updates: { description: string; eaten: boolean }) {
    const updated = await mealApi.update(id, updates);
    setMeals((prev) => prev.map((m) => (m.id === id ? updated as MealSlot : m)));
  }

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
    const event = await recurringEventApi.create(data);
    setRecurringEvents((prev) => [...prev, event].sort((a, b) => a.startTime.localeCompare(b.startTime)));
  }

  async function deleteEvent(id: number) {
    await recurringEventApi.delete(id);
    setRecurringEvents((prev) => prev.filter((e) => e.id !== id));
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

  if (loading || !day) {
    return <div className="app loading">Ładowanie...</div>;
  }

  return (
    <div className="app">
      <Header
        day={day}
        tasks={tasks}
        meals={meals}
        notes={notes}
        currentDate={currentDate}
        onUpdateWakeUp={updateWakeUp}
        onUpdateSleep={updateSleep}
        onCloseDay={closeDay}
        onNavigate={navigateToDate}
      />
      <main className="main">
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
        />
        <div className="grid-bottom">
          <MealsSection meals={meals} closed={day.closed} onUpdateMeal={updateMeal} />
          <div className="grid-bottom-right">
            <NotesSection notes={notes} closed={day.closed} onAddNote={addNote} onDeleteNote={deleteNote} />
            <EventsSection events={recurringEvents} closed={day.closed} onAddEvent={addEvent} onDeleteEvent={deleteEvent} />
          </div>
        </div>
      </main>

      <Backlog
        open={backlogOpen}
        onToggle={() => setBacklogOpen(!backlogOpen)}
        backlog={backlog}
        onAddTask={addBacklogTask}
        onDeleteTask={deleteBacklogTask}
        onMoveToDay={moveBacklogToDay}
        categories={categories}
      />
    </div>
  );
}

export default App;
