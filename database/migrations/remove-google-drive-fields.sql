-- Migration: Remove Google Drive related fields from posts table
-- Date: 2026-01-30

-- Step 1: Drop the old imagem_url column
ALTER TABLE posts DROP COLUMN IF EXISTS imagem_url;

-- Step 2: Verify the image_path column exists and is NOT NULL
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'image_path'
    ) THEN
        RAISE EXCEPTION 'Column image_path does not exist in posts table';
    END IF;
    
    -- Make sure image_path is NOT NULL
    ALTER TABLE posts ALTER COLUMN image_path SET NOT NULL;
END $$;

-- Step 3: Update any remaining NULL image_path values (fallback)
UPDATE posts 
SET image_path = 'uploads/placeholder.jpg' 
WHERE image_path IS NULL OR image_path = '';

-- Step 4: Add comment to document the change
COMMENT ON COLUMN posts.image_path IS 'Local file path for uploaded media (images/videos)';
