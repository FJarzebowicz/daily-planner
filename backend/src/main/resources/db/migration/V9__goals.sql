CREATE TABLE goals (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    rules       TEXT,
    deadline    DATE,
    status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_goals_user_id ON goals(user_id);

CREATE TABLE goal_master_tasks (
    id          BIGSERIAL PRIMARY KEY,
    goal_id     BIGINT NOT NULL REFERENCES goals(id) ON DELETE CASCADE UNIQUE,
    name        VARCHAR(255) NOT NULL,
    description TEXT
);

CREATE TABLE milestones (
    id          BIGSERIAL PRIMARY KEY,
    goal_id     BIGINT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    completed   BOOLEAN NOT NULL DEFAULT FALSE,
    deadline    DATE,
    sort_order  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_milestones_goal_id ON milestones(goal_id);

CREATE TABLE milestone_habits (
    id           BIGSERIAL PRIMARY KEY,
    milestone_id BIGINT NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
    habit_id     BIGINT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    UNIQUE(milestone_id, habit_id)
);

CREATE TABLE milestone_tasks (
    id           BIGSERIAL PRIMARY KEY,
    milestone_id BIGINT NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
    task_id      BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    UNIQUE(milestone_id, task_id)
);

CREATE TABLE goal_master_task_habits (
    id             BIGSERIAL PRIMARY KEY,
    master_task_id BIGINT NOT NULL REFERENCES goal_master_tasks(id) ON DELETE CASCADE,
    habit_id       BIGINT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    UNIQUE(master_task_id, habit_id)
);

CREATE TABLE goal_master_task_tasks (
    id             BIGSERIAL PRIMARY KEY,
    master_task_id BIGINT NOT NULL REFERENCES goal_master_tasks(id) ON DELETE CASCADE,
    task_id        BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    UNIQUE(master_task_id, task_id)
);

ALTER TABLE habits ADD COLUMN goal_id BIGINT REFERENCES goals(id) ON DELETE SET NULL;
ALTER TABLE habits ADD COLUMN milestone_id BIGINT REFERENCES milestones(id) ON DELETE SET NULL;

ALTER TABLE tasks ADD COLUMN goal_id BIGINT REFERENCES goals(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN milestone_id BIGINT REFERENCES milestones(id) ON DELETE SET NULL;

-- Make day_id nullable on tasks so goal-linked tasks can exist without a day
ALTER TABLE tasks ALTER COLUMN day_id DROP NOT NULL;
