-- Migration V7: Add property image URL column for property pictures
ALTER TABLE properties ADD COLUMN IF NOT EXISTS image_url VARCHAR(1000);
