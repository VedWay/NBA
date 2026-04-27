-- Add student role to users.role enum for Google student sign-in support.
ALTER TABLE users
  MODIFY COLUMN role ENUM('admin', 'faculty', 'viewer', 'student') NOT NULL DEFAULT 'viewer';
