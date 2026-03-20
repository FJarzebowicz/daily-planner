-- Make recurring_events per-day instead of per-user
ALTER TABLE recurring_events ADD COLUMN day_id BIGINT;

-- Existing global events cannot be mapped to a specific day
DELETE FROM recurring_events;

-- Make day_id required and add FK
ALTER TABLE recurring_events ALTER COLUMN day_id SET NOT NULL;
ALTER TABLE recurring_events ADD CONSTRAINT fk_recurring_events_day
    FOREIGN KEY (day_id) REFERENCES days(id) ON DELETE CASCADE;

-- Drop the user_id column (day already has user_id)
ALTER TABLE recurring_events DROP COLUMN IF EXISTS user_id;

-- Add index
CREATE INDEX idx_recurring_events_day_id ON recurring_events(day_id);
