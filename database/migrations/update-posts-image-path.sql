-- Migration: Update posts table to support file paths instead of URLs
-- Date: 2026-01-30

-- Step 1: Add new column for image path
ALTER TABLE posts ADD COLUMN image_path TEXT;

-- Step 2: Drop old URL constraint
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_imagem_url_check;

-- Step 3: Make image_path NOT NULL (after all data is migrated)
-- For now, keep it nullable during transition
ALTER TABLE posts ALTER COLUMN image_path SET NOT NULL;

-- Step 4: Drop old column (only after confirming all is working)
-- ALTER TABLE posts DROP COLUMN imagem_url;

-- Step 5: Rename column to match naming convention
-- This will be done in a later migration after full transition
