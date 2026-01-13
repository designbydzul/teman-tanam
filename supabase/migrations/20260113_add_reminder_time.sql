-- Migration: Add reminder_time to notification_settings
-- Date: 2026-01-13
-- Description: Add field to store the time when reminder should be sent (in HH:MM format)

-- Add reminder_time column (default 07:00)
ALTER TABLE notification_settings
ADD COLUMN reminder_time TIME DEFAULT '07:00:00';

-- Add comment to explain the field
COMMENT ON COLUMN notification_settings.reminder_time IS 'Time when daily WhatsApp reminder should be sent (WIB timezone)';
