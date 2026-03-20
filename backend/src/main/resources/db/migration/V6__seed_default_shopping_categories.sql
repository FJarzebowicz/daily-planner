-- Seed default shopping categories for every existing user
INSERT INTO shopping_categories (user_id, name)
SELECT u.id, cat.name
FROM users u
CROSS JOIN (VALUES
    ('Nabiał'),
    ('Warzywa i owoce'),
    ('Mięso i ryby'),
    ('Pieczywo'),
    ('Napoje'),
    ('Chemia'),
    ('Przekąski'),
    ('Inne')
) AS cat(name)
WHERE NOT EXISTS (
    SELECT 1 FROM shopping_categories sc
    WHERE sc.user_id = u.id AND sc.name = cat.name
);

-- Link existing shopping_items to their matching shopping_category by category_name
UPDATE shopping_items si
SET category_id = sc.id
FROM shopping_categories sc
WHERE si.user_id = sc.user_id
  AND si.category_name = sc.name
  AND si.category_id IS NULL;
