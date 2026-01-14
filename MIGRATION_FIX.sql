-- Simple migration to add missing columns to existing tables
-- Run this in Supabase SQL Editor

-- Check if columns exist and add them if they don't
DO $$
BEGIN
    -- Add notification_type to notification_logs if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notification_logs'
        AND column_name = 'notification_type'
    ) THEN
        ALTER TABLE notification_logs
        ADD COLUMN notification_type TEXT DEFAULT 'daily_reminder';
    END IF;

    -- Add recipient_number to notification_logs if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notification_logs'
        AND column_name = 'recipient_number'
    ) THEN
        ALTER TABLE notification_logs
        ADD COLUMN recipient_number TEXT;
    END IF;

    -- Add message_content to notification_logs if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notification_logs'
        AND column_name = 'message_content'
    ) THEN
        ALTER TABLE notification_logs
        ADD COLUMN message_content TEXT;
    END IF;

    -- Add reminder_time to notification_settings if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notification_settings'
        AND column_name = 'reminder_time'
    ) THEN
        ALTER TABLE notification_settings
        ADD COLUMN reminder_time TIME DEFAULT '07:00:00';
    END IF;
END $$;

-- Drop and recreate constraint for notification_type
ALTER TABLE notification_logs
DROP CONSTRAINT IF EXISTS notification_logs_type_check;

ALTER TABLE notification_logs
ADD CONSTRAINT notification_logs_type_check
CHECK (notification_type IN ('daily_reminder', 'test'));

-- Add comments
COMMENT ON COLUMN notification_logs.notification_type IS 'Type of notification: daily_reminder or test';
COMMENT ON COLUMN notification_logs.recipient_number IS 'WhatsApp number that received the notification';
COMMENT ON COLUMN notification_logs.message_content IS 'Full message content that was sent';
COMMENT ON COLUMN notification_settings.reminder_time IS 'Time when daily WhatsApp reminder should be sent (WIB timezone)';
