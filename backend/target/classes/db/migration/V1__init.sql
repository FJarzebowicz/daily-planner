CREATE TABLE days (
    id          BIGSERIAL PRIMARY KEY,
    date        DATE NOT NULL UNIQUE,
    wake_up_time VARCHAR(5) NOT NULL DEFAULT '07:00',
    sleep_time   VARCHAR(5) NOT NULL DEFAULT '23:00',
    is_closed   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    color      VARCHAR(7) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE tasks (
    id                BIGSERIAL PRIMARY KEY,
    day_id            BIGINT NOT NULL REFERENCES days(id) ON DELETE CASCADE,
    category_id       BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    title             VARCHAR(255) NOT NULL,
    description       TEXT NOT NULL DEFAULT '',
    estimated_minutes INT NOT NULL DEFAULT 30,
    priority          VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',
    sort_order        INT NOT NULL DEFAULT 0,
    is_completed      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE meals (
    id          BIGSERIAL PRIMARY KEY,
    day_id      BIGINT NOT NULL REFERENCES days(id) ON DELETE CASCADE,
    slot        VARCHAR(20) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    is_eaten    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(day_id, slot)
);

CREATE TABLE thoughts (
    id         BIGSERIAL PRIMARY KEY,
    day_id     BIGINT NOT NULL REFERENCES days(id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE recurring_events (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    start_time VARCHAR(5) NOT NULL,
    end_time   VARCHAR(5) NOT NULL,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE backlog_tasks (
    id                BIGSERIAL PRIMARY KEY,
    name              VARCHAR(255) NOT NULL,
    description       TEXT NOT NULL DEFAULT '',
    estimated_minutes INT NOT NULL DEFAULT 30,
    priority          VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',
    created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_day_id ON tasks(day_id);
CREATE INDEX idx_tasks_category_id ON tasks(category_id);
CREATE INDEX idx_meals_day_id ON meals(day_id);
CREATE INDEX idx_thoughts_day_id ON thoughts(day_id);
