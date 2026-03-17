-- User roles
ALTER TABLE users ADD COLUMN role ENUM('admin', 'editor', 'viewer') DEFAULT 'editor' AFTER email;

-- Set existing users as admin (first user especially)
UPDATE users SET role = 'admin' WHERE id = (SELECT min_id FROM (SELECT MIN(id) as min_id FROM users) tmp);

-- Add details column for audit diff (old_values, new_values)
-- Already have details JSON column in activity_logs, we'll use that for diffs
