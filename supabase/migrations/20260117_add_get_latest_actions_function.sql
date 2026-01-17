-- Migration: Add optimized function to get latest actions per plant
-- Purpose: Fix N+1 query pattern in usePlants.ts and care-checker.ts
--
-- Previously, these files fetched ALL actions for all plants then filtered
-- in JavaScript to get only the latest action per type. This was inefficient:
-- - 10 plants with 50 actions each = 500 rows fetched, but only ~20 used
--
-- This function uses PostgreSQL's DISTINCT ON to efficiently return only
-- the latest action per plant per action_type in a single query.

CREATE OR REPLACE FUNCTION get_latest_actions_for_plants(plant_ids UUID[])
RETURNS TABLE (
  plant_id UUID,
  action_type TEXT,
  action_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (a.plant_id, a.action_type)
    a.plant_id,
    a.action_type,
    a.action_date
  FROM actions a
  WHERE a.plant_id = ANY(plant_ids)
  ORDER BY a.plant_id, a.action_type, a.action_date DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add a comment to the function for documentation
COMMENT ON FUNCTION get_latest_actions_for_plants(UUID[]) IS
  'Returns the most recent action of each type for the given plant IDs. Used by usePlants hook and care-checker for efficient care status calculation.';
