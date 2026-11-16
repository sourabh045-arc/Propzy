-- V5: Add version column to inquiries table for optimistic locking concurrency control
ALTER TABLE inquiries ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
