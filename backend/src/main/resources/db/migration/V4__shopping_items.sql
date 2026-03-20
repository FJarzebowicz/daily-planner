CREATE TABLE shopping_items (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_name   VARCHAR(100) NOT NULL DEFAULT 'Inne',
    name            VARCHAR(255) NOT NULL,
    quantity        INT NOT NULL DEFAULT 1,
    unit            VARCHAR(50),
    is_bought       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_shopping_items_user_id ON shopping_items(user_id);
