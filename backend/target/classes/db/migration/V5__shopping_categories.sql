CREATE TABLE shopping_categories (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_shopping_categories_user_id ON shopping_categories(user_id);

-- Add optional FK from shopping_items to shopping_categories
ALTER TABLE shopping_items ADD COLUMN category_id BIGINT REFERENCES shopping_categories(id) ON DELETE SET NULL;
CREATE INDEX idx_shopping_items_category_id ON shopping_items(category_id);
