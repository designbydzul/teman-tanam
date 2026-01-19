-- Add 'panen' (harvest) to allowed action types
-- The current constraint only allows: siram, pupuk, pangkas, lainnya

-- Drop the existing constraint
ALTER TABLE actions DROP CONSTRAINT IF EXISTS actions_action_type_check;

-- Add new constraint with 'panen' included
ALTER TABLE actions ADD CONSTRAINT actions_action_type_check
  CHECK (action_type IN ('siram', 'pupuk', 'pangkas', 'panen', 'fase', 'lainnya'));
