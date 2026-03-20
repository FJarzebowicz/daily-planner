CREATE TABLE habits (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id       BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    name              VARCHAR(255) NOT NULL,
    description       TEXT,
    schedule_type     VARCHAR(20) NOT NULL DEFAULT 'DAILY',
    schedule_days     VARCHAR(100),
    schedule_interval INT,
    start_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    streak_goal       INT,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_habits_user_id ON habits(user_id);

CREATE TABLE habit_completions (
    id              BIGSERIAL PRIMARY KEY,
    habit_id        BIGINT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    completed_date  DATE NOT NULL,
    completed_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (habit_id, completed_date)
);
CREATE INDEX idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX idx_habit_completions_date ON habit_completions(completed_date);
