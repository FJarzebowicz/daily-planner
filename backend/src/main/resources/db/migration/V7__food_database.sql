CREATE TABLE food_categories (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_food_categories_user_id ON food_categories(user_id);

-- Seed defaults for existing users
INSERT INTO food_categories (user_id, name)
SELECT u.id, cat.name
FROM users u
CROSS JOIN (VALUES
    ('Śniadania'), ('Obiady'), ('Kolacje'), ('Przekąski'), ('Desery'), ('Napoje')
) AS cat(name);

CREATE TABLE foods (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id     BIGINT REFERENCES food_categories(id) ON DELETE SET NULL,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    image_url       VARCHAR(500),
    link            VARCHAR(500),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_foods_user_id ON foods(user_id);
CREATE INDEX idx_foods_category_id ON foods(category_id);

CREATE TABLE food_variants (
    id              BIGSERIAL PRIMARY KEY,
    food_id         BIGINT NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    preparation     TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_food_variants_food_id ON food_variants(food_id);
