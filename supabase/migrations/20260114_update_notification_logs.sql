-- Migration: Update notification_logs table to support test notifications
-- Date: 2026-01-14
-- Description: Add fields for notification type and recipient number

-- Add new columns to notification_logs
ALTER TABLE notification_logs
ADD COLUMN IF NOT EXISTS notification_type TEXT DEFAULT 'daily_reminder',
ADD COLUMN IF NOT EXISTS recipient_number TEXT,
ADD COLUMN IF NOT EXISTS message_content TEXT;

-- Add check constraint for notification_type
ALTER TABLE notification_logs
ADD CONSTRAINT notification_logs_type_check
CHECK (notification_type IN ('daily_reminder', 'test'));

-- Add comment to explain the fields
COMMENT ON COLUMN notification_logs.notification_type IS 'Type of notification: daily_reminder or test';
COMMENT ON COLUMN notification_logs.recipient_number IS 'WhatsApp number that received the notification';
COMMENT ON COLUMN notification_logs.message_content IS 'Full message content that was sent';
