-- V6: Add email verification support for user authentication
ALTER TABLE users
    ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN verification_code VARCHAR(10),
    ADD COLUMN verification_expiry TIMESTAMP WITH TIME ZONE;

-- Mark existing and pre-seeded users as verified
UPDATE users SET email_verified = TRUE;

CREATE INDEX idx_users_verification ON users(email, verification_code);
