# WhatsApp Notification System - Setup Guide

This guide explains how to complete the setup of the WhatsApp notification backend for Teman Tanam.

## ✅ Implementation Status

The following components have been implemented and verified:

### 1. Backend & Logic
- ✅ `/hooks/useNotificationSettings.ts` - React hook for managing notification settings
- ✅ `/lib/notifications/fonnte.ts` - Fonnte API integration
- ✅ `/lib/notifications/care-checker.ts` - Logic to check which plants need care
- ✅ `/lib/notifications/message-generator.ts` - Message template generator
- ✅ `/lib/notifications/index.ts` - Exports

### 2. API Routes
- ✅ `/app/api/cron/daily-notifications/route.ts` - Cron job endpoint (runs at 07:00 WIB)
- ✅ `/app/api/notifications/settings/route.ts` - User settings endpoint
- ✅ `/app/api/notifications/test/route.ts` - Test message endpoint

### 3. UI Components
- ✅ `/app/notifikasi/page.tsx` - Settings page with phone validation and test button

### 4. Database Migrations
- ✅ `/supabase/migrations/combined_notification_setup.sql` - **NEW**: All-in-one setup script

---

## 🚀 Setup Instructions

### Step 1: Run Database Migrations

You need to set up the tables in Supabase. We have created a combined migration file for convenience.

1. Go to your **Supabase Dashboard** > **SQL Editor**.
2. Open the file `supabase/migrations/combined_notification_setup.sql` in your local editor.
3. Copy the entire content.
4. Paste it into the Supabase SQL Editor and click **Run**.

This will create:
- `notification_settings` table (stores preferences)
- `notification_logs` table (stores history)
- Required RLS policies and indexes

### Step 2: Test Fonnte API Token (Optional but Recommended)

Before deploying, you can verify your Fonnte API token works using the provided script.

Run this command in your terminal:

```bash
# Replace with your actual token and phone number (62...)
FONNTE_API_TOKEN=your_token_here node scripts/test-fonnte.js 628123456789
```

If successful, you will receive a WhatsApp message immediately.

### Step 3: Configure Environment Variables

Ensure your `.env.local` file contains:

```bash
# Fonnte WhatsApp API
FONNTE_API_TOKEN=your_fonnte_token

# Cron Secret (for securing the daily job)
CRON_SECRET=your_cron_secret
```

### Step 4: Deploy to Vercel

The daily notification cron job requires deployment to Vercel to function (Vercel Cron).

1. Push your changes:
   ```bash
   git add .
   git commit -m "feat: Complete WhatsApp notification system"
   git push origin main
   ```

2. Go to **Vercel Dashboard** > **Settings** > **Environment Variables**.
3. Add the following production variables:
   - `FONNTE_API_TOKEN`
   - `CRON_SECRET`
   - `SUPABASE_SERVICE_ROLE_KEY` (if not already present)

### Step 5: Verify in Production

1. Open your deployed app.
2. Go to the **Notifications** page.
3. Enable WhatsApp notifications and enter your number.
4. Click **"Kirim Test Notifikasi"** to verify the integration.
