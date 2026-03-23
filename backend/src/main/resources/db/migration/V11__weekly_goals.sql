-- ============================================================
-- V11: Cele tygodniowe (WeeklyGoal)
--
-- weekly_goals: jeden rekord per (user, goal, week_start).
-- Tydzień zawsze zaczyna się od poniedziałku (week_start = data poniedziałku).
--
-- tasks.weekly_goal_id: opcjonalne powiązanie taska dziennego
-- z konkretnym celem tygodniowym.
-- ============================================================

CREATE TABLE weekly_goals (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_id     BIGINT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    week_start  DATE NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    achieved    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, goal_id, week_start)
);

CREATE INDEX idx_weekly_goals_user_week ON weekly_goals(user_id, week_start);
CREATE INDEX idx_weekly_goals_goal_id   ON weekly_goals(goal_id);

-- Opcjonalne powiązanie taska z celem tygodniowym
ALTER TABLE tasks
    ADD COLUMN weekly_goal_id BIGINT REFERENCES weekly_goals(id) ON DELETE SET NULL;

CREATE INDEX idx_tasks_weekly_goal_id ON tasks(weekly_goal_id);
