-- Users table
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password        VARCHAR(255),
    display_name    VARCHAR(100) NOT NULL,
    avatar_url      VARCHAR(500),
    auth_provider   VARCHAR(10) NOT NULL DEFAULT 'LOCAL',
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(500) NOT NULL UNIQUE,
    expires_at  TIMESTAMP NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- Create a default system user for existing data
INSERT INTO users (id, email, password, display_name, auth_provider, is_email_verified)
VALUES (1, 'system@dailyplanner.local', NULL, 'System', 'LOCAL', TRUE);

-- Add user_id to days
ALTER TABLE days ADD COLUMN user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;
UPDATE days SET user_id = 1;
ALTER TABLE days ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE days DROP CONSTRAINT IF EXISTS days_date_key;
ALTER TABLE days ADD CONSTRAINT days_user_date_unique UNIQUE (user_id, date);
CREATE INDEX idx_days_user_id ON days(user_id);

-- Add user_id to categories
ALTER TABLE categories ADD COLUMN user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;
UPDATE categories SET user_id = 1;
ALTER TABLE categories ALTER COLUMN user_id SET NOT NULL;
CREATE INDEX idx_categories_user_id ON categories(user_id);

-- Add user_id to recurring_events
ALTER TABLE recurring_events ADD COLUMN user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;
UPDATE recurring_events SET user_id = 1;
ALTER TABLE recurring_events ALTER COLUMN user_id SET NOT NULL;
CREATE INDEX idx_recurring_events_user_id ON recurring_events(user_id);

-- Add user_id to backlog_tasks
ALTER TABLE backlog_tasks ADD COLUMN user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;
UPDATE backlog_tasks SET user_id = 1;
ALTER TABLE backlog_tasks ALTER COLUMN user_id SET NOT NULL;
CREATE INDEX idx_backlog_tasks_user_id ON backlog_tasks(user_id);

-- Reset sequence so new users start after system user
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
