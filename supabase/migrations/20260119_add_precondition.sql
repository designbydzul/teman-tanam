-- Migration: Add precondition column to plants table
-- Date: 2026-01-19
-- Description: Adds precondition tracking for Plant Life Journey feature

-- Add precondition column to plants table
-- This stores the initial condition when user started caring for the plant
-- Values: 'benih', 'bibit', 'stek', 'rimpang', 'umbi', 'anakan', 'dewasa'
ALTER TABLE plants ADD COLUMN IF NOT EXISTS precondition TEXT;

-- Add index for precondition column for potential filtering
CREATE INDEX IF NOT EXISTS idx_plants_precondition ON plants(precondition);

-- Update existing plants with default 'bibit' (most common starting condition)
-- Only update if precondition is NULL to avoid overwriting any existing data
UPDATE plants SET precondition = 'bibit' WHERE precondition IS NULL;

-- Add a comment to document the column
COMMENT ON COLUMN plants.precondition IS 'Initial condition when user started caring for the plant (benih, bibit, stek, rimpang, umbi, anakan, dewasa)';
