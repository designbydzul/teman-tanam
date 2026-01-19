-- Add lifecycle tracking fields to plant_species table
-- Safe migration: uses IF NOT EXISTS to avoid errors if columns already exist
-- Run via Supabase dashboard SQL editor or `supabase db push`
--
-- Migration completed: 2026-01-19

-- Add columns
ALTER TABLE plant_species ADD COLUMN IF NOT EXISTS lifecycle_type TEXT DEFAULT 'perpetual';
ALTER TABLE plant_species ADD COLUMN IF NOT EXISTS harvest_days_min INTEGER;
ALTER TABLE plant_species ADD COLUMN IF NOT EXISTS harvest_days_max INTEGER;

-- Update lifecycle_type based on category
UPDATE plant_species SET lifecycle_type = 'annual_harvest' WHERE category = 'Sayuran';
UPDATE plant_species SET lifecycle_type = 'perennial_harvest' WHERE category = 'Rempah';
UPDATE plant_species SET lifecycle_type = 'annual_harvest' WHERE category = 'Bunga';
UPDATE plant_species SET lifecycle_type = 'perpetual' WHERE category = 'Tanaman Hias';

-- Populate harvest days for Sayuran (Vegetables)
UPDATE plant_species SET harvest_days_min = 90, harvest_days_max = 120 WHERE common_name = 'Cabai';
UPDATE plant_species SET harvest_days_min = 60, harvest_days_max = 80 WHERE common_name = 'Tomat';
UPDATE plant_species SET harvest_days_min = 25, harvest_days_max = 30 WHERE common_name = 'Kangkung';
UPDATE plant_species SET harvest_days_min = 25, harvest_days_max = 30 WHERE common_name = 'Bayam';
UPDATE plant_species SET harvest_days_min = 70, harvest_days_max = 90 WHERE common_name = 'Terong';
UPDATE plant_species SET harvest_days_min = 30, harvest_days_max = 45 WHERE common_name = 'Selada';
UPDATE plant_species SET harvest_days_min = 50, harvest_days_max = 70 WHERE common_name = 'Mentimun';
UPDATE plant_species SET harvest_days_min = 30, harvest_days_max = 40 WHERE common_name = 'Sawi';
UPDATE plant_species SET harvest_days_min = 60, harvest_days_max = 80 WHERE common_name = 'Kacang Panjang';
UPDATE plant_species SET harvest_days_min = 60, harvest_days_max = 90 WHERE common_name = 'Pare';

-- Populate harvest days for Rempah (Herbs/Spices)
UPDATE plant_species SET harvest_days_min = 30, harvest_days_max = 45 WHERE common_name = 'Kemangi';
UPDATE plant_species SET harvest_days_min = 90, harvest_days_max = 120 WHERE common_name = 'Sereh';
UPDATE plant_species SET harvest_days_min = 240, harvest_days_max = 300 WHERE common_name = 'Jahe';
UPDATE plant_species SET harvest_days_min = 240, harvest_days_max = 300 WHERE common_name = 'Kunyit';
UPDATE plant_species SET harvest_days_min = 30, harvest_days_max = 45 WHERE common_name = 'Mint';
UPDATE plant_species SET harvest_days_min = 90, harvest_days_max = 120 WHERE common_name = 'Bawang Merah';
UPDATE plant_species SET harvest_days_min = 90, harvest_days_max = 120 WHERE common_name = 'Bawang Putih';
UPDATE plant_species SET harvest_days_min = 30, harvest_days_max = 45 WHERE common_name = 'Daun Bawang';
UPDATE plant_species SET harvest_days_min = 240, harvest_days_max = 300 WHERE common_name = 'Lengkuas';
UPDATE plant_species SET harvest_days_min = 60, harvest_days_max = 90 WHERE common_name = 'Seledri';

-- Populate harvest days for Bunga (Flowers) - time to bloom/flower
UPDATE plant_species SET harvest_days_min = 60, harvest_days_max = 90 WHERE common_name = 'Mawar';
UPDATE plant_species SET harvest_days_min = 90, harvest_days_max = 120 WHERE common_name = 'Melati';
UPDATE plant_species SET harvest_days_min = 60, harvest_days_max = 90 WHERE common_name = 'Kembang Sepatu';
UPDATE plant_species SET harvest_days_min = 30, harvest_days_max = 60 WHERE common_name = 'Bougenville';

-- Tanaman Hias: leave harvest_days as NULL (perpetual plants don't harvest)
-- No action needed - columns default to NULL
