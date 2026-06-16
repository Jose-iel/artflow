-- Migration: Add media carousel support to posts table
-- Date: 2026-06-15
-- Author: ArtFlow Team
-- Description: Adds JSONB column to store multiple media items for carousel functionality

-- Step 1: Add new column for media carousel (JSONB array)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media JSONB NULL;

-- Step 2: Make image_path nullable to support pure carousel posts
-- Posts with single image will still use image_path for backward compatibility
ALTER TABLE posts ALTER COLUMN image_path DROP NOT NULL;

-- Step 3: Add comment explaining the column usage
COMMENT ON COLUMN posts.media IS 'JSON array of media items for carousel. Format: [{"filePath": "path/to/file.jpg", "mimeType": "image/jpeg", "order": 0}]';

-- Step 4: Create index for performance (optional, can be added later if needed)
-- CREATE INDEX idx_posts_media ON posts USING GIN (media);

-- Step 5: Add check constraint to validate media structure (optional, for strict validation)
-- This ensures media column contains valid JSON array when not null
-- ALTER TABLE posts ADD CONSTRAINT check_media_is_array 
--   CHECK (media IS NULL OR jsonb_typeof(media) = 'array');

-- Rollback instructions:
-- ALTER TABLE posts DROP COLUMN IF EXISTS media;
-- ALTER TABLE posts ALTER COLUMN image_path SET NOT NULL;
