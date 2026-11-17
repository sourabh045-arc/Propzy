-- Migration V8: Expand property image_url column to TEXT to support uploaded data URLs and images
ALTER TABLE properties ALTER COLUMN image_url SET DATA TYPE TEXT;
