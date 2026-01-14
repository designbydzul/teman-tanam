# WhatsApp Notification System - Setup Guide

This guide explains how to complete the setup of the WhatsApp notification backend for Teman Tanam.

## ✅ Already Implemented

The following components have been successfully integrated:

### 1. Backend Files
- ✅ `/hooks/useNotificationSettings.ts` - React hook for managing notification settings
- ✅ `/lib/notifications/fonnte.ts` - Fonnte API integration for sending WhatsApp messages
- ✅ `/lib/notifications/care-checker.ts` - Logic to check which plants need care
- ✅ `/lib/notifications/message-generator.ts` - Message template generator
- ✅ `/lib/notifications/index.ts` - Exports all notification utilities

### 2. API Routes
- ✅ `/app/api/cron/daily-notifications/route.ts` - Cron job endpoint for daily notifications
- ✅ `/app/api/notifications/settings/route.ts` - GET/POST endpoints for user settings
- ✅ `/app/api/notifications/test/route.ts` - POST endpoint to send test messages

### 3. Configuration Files
- ✅ `vercel.json` - Cron job configuration (runs daily at 00:00 UTC / 07:00 WIB)
- ✅ `.env.local` - Environment variables added:
  - `FONNTE_API_TOKEN` - API token for Fonnte service
  - `CRON_SECRET` - Secret for authenticating cron requests
  - `SUPABASE_SERVICE_ROLE_KEY` - Already exists

### 4. UI Updates
- ✅ `/app/notifikasi/page.tsx` - Updated with:
  - Integration with `useNotificationSettings` hook
  - "Kirim Test" button to send test notifications
  - Phone number validation
  - Loading states and error handling

### 5. Database Migrations
Created migration files in `/supabase/migrations/`:
- ✅ `20260110_notification_settings.sql` - Creates notification_settings and notification_logs tables
- ✅ `20260113_add_reminder_time.sql` - Adds reminder_time field
- ✅ `20260114_update_notification_logs.sql` - Adds fields for test notifications

## 🔧 Required Setup Steps

### Step 1: Run Database Migrations

You need to run the SQL migrations in your Supabase database. Go to Supabase Dashboard > SQL Editor and run these files in order:

1. **First Migration** - Run `20260110_notification_settings.sql`:
   - Creates `notification_settings` table with RLS policies
   - Creates `notification_logs` table with RLS policies
   - Sets up indexes for performance

2. **Second Migration** - Run `20260113_add_reminder_time.sql`:
   - Adds `reminder_time` field to store when notifications should be sent

3. **Third Migration** - Run `20260114_update_notification_logs.sql`:
   - Adds `notification_type` field (daily_reminder or test)
   - Adds `recipient_number` field
   - Adds `message_content` field

**Alternative**: You can run all migrations at once by copying the content of all three files into a single SQL query.

### Step 2: Verify Environment Variables

Check that `.env.local` has these variables:

```bash
# Supabase (already exists)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Fonnte WhatsApp API (newly added)
FONNTE_API_TOKEN=LCKZ7pBGSAyXCi5uuXoor98S3bVzryTa5iJFmr5KEEWt9RTn

# Cron Secret (newly added)
CRON_SECRET=teman-tanam-cron-secret-2024
```

### Step 3: Deploy to Vercel

The cron job configuration in `vercel.json` will only work after deployment:

```bash
# Commit all changes
git add .
git commit -m "feat: Add WhatsApp notification system"

# Push to trigger Vercel deployment
git push origin main
```

After deployment, Vercel will automatically:
- Run the daily cron job at 00:00 UTC (07:00 WIB)
- Authenticate using the `CRON_SECRET` environment variable

### Step 4: Add Environment Variables to Vercel

Go to Vercel Dashboard > Your Project > Settings > Environment Variables and add:

1. `FONNTE_API_TOKEN` = `LCKZ7pBGSAyXCi5uuXoor98S3bVzryTa5iJFmr5KEEWt9RTn`
2. `CRON_SECRET` = `teman-tanam-cron-secret-2024`
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is already set

After adding, redeploy the project for changes to take effect.

## 🧪 Testing the Implementation

### Test 1: Local Testing (Settings UI)

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/notifikasi` page
3. Enable the WhatsApp toggle
4. Enter a phone number (e.g., `82315620798` - without leading 0)
5. Set a reminder time (e.g., `07:00`)
6. Click "Simpan" - should save to database
7. Check Supabase Dashboard > Table Editor > notification_settings

### Test 2: Send Test Notification

1. On `/notifikasi` page with phone number entered
2. Click "Kirim Test Notifikasi" button
3. You should receive a WhatsApp message like:

```
🌱 *Halo [Your Name]!*

Ini adalah pesan test dari *Teman Tanam* 🪴

Notifikasi WhatsApp kamu sudah aktif! Kamu akan menerima pengingat untuk merawat tanaman-tanamanmu setiap hari.

_Pesan ini dikirim dari sistem notifikasi Teman Tanam_
```

4. Check `notification_logs` table in Supabase for the log entry

### Test 3: Trigger Daily Notification (After Deployment)

You can manually trigger the cron job:

```bash
curl -X GET \
  https://your-app.vercel.app/api/cron/daily-notifications \
  -H "Authorization: Bearer teman-tanam-cron-secret-2024"
```

Expected response:
```json
{
  "success": true,
  "sent": 1,
  "failed": 0,
  "total": 1,
  "duration_ms": 1234
}
```

## 📱 Phone Number Format

**Important**: The system uses Indonesian phone numbers in the format `628xxx`:
- ✅ Correct: `6282315620798`
- ❌ Wrong: `+6282315620798` (no plus sign)
- ❌ Wrong: `082315620798` (no leading 0)
- ❌ Wrong: `82315620798` (missing country code)

The UI automatically adds the `+62` prefix for display, but stores numbers as `628xxx` in the database.

## 🕐 How the Notification System Works

1. **Daily Cron Job** (00:00 UTC / 07:00 WIB):
   - Vercel triggers `/api/cron/daily-notifications`
   - System queries all users with `whatsapp_enabled = true`

2. **Plant Care Checking**:
   - For each user, checks their active plants
   - Compares last watering/fertilizing dates with species frequency
   - Identifies plants that are overdue for care

3. **Message Generation**:
   - Creates personalized message listing plants needing water/fertilizer
   - Includes number of days since last care action

4. **WhatsApp Sending**:
   - Sends message via Fonnte API
   - Logs result to `notification_logs` table
   - Small delay between messages to avoid rate limiting

5. **User Receives**:
   - WhatsApp message with list of plants needing attention
   - Can mark actions as done in the app

## 🔍 Database Schema

### notification_settings
```sql
- id: UUID (primary key)
- user_id: UUID (references profiles.id, unique)
- whatsapp_enabled: BOOLEAN (default false)
- whatsapp_number: TEXT (format: 628xxx)
- reminder_time: TIME (default '07:00:00')
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### notification_logs
```sql
- id: UUID (primary key)
- user_id: UUID (references profiles.id)
- notification_type: TEXT (daily_reminder | test)
- recipient_number: TEXT
- message_content: TEXT
- sent_at: TIMESTAMP
- plants_count: INTEGER
- message_preview: TEXT
- status: TEXT (sent | failed)
- error_message: TEXT
- created_at: TIMESTAMP
```

## 🚨 Troubleshooting

### Issue: Test notification fails
**Solution**:
- Check that `FONNTE_API_TOKEN` is set in `.env.local`
- Verify phone number format is `628xxx`
- Check browser console for error details

### Issue: Settings not saving
**Solution**:
- Verify database migrations have been run
- Check that RLS policies are enabled
- Ensure user is authenticated

### Issue: Cron job not running
**Solution**:
- Verify project is deployed to Vercel
- Check `CRON_SECRET` is set in Vercel environment variables
- Check Vercel deployment logs for cron execution

### Issue: Messages not being sent
**Solution**:
- Check Fonnte API token is valid and has credit
- Verify phone numbers are in correct format
- Check `notification_logs` table for error messages

## 📝 Notes

- **Timezone**: Cron runs at 00:00 UTC which is 07:00 WIB (Indonesian Western Time)
- **Rate Limiting**: System adds 100ms delay between messages to avoid rate limiting
- **Testing**: Use the test endpoint before enabling for all users
- **Monitoring**: Check `notification_logs` table to monitor delivery success rate
- **Cost**: Each WhatsApp message via Fonnte costs credits - monitor usage

## 🎯 Next Steps (Optional Enhancements)

1. **Add notification history page** - Show users their notification logs
2. **Customize message templates** - Allow users to personalize messages
3. **Multiple reminder times** - Support different times for different plant types
4. **Notification preferences** - Choose which types of reminders to receive
5. **Weekly digest option** - Send summary once per week instead of daily

---

**Implementation completed**: January 14, 2026
**Status**: Ready for testing and deployment
