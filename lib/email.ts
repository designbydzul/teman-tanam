/**
 * Email utilities for Teman Tanam using Resend
 */

import { Resend } from 'resend';

// Lazy initialize Resend client
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// Email from address (use Resend's default for testing)
const FROM_EMAIL = process.env.EMAIL_FROM || 'Teman Tanam <onboarding@resend.dev>';

export interface PlantCareReminder {
  plantName: string;
  needsWatering: boolean;
  needsFertilizing: boolean;
  daysSinceWatered: number | null;
  daysSinceFertilized: number | null;
}

export interface CareReminderEmailData {
  userName: string;
  userEmail: string;
  plantsNeedingWater: string[];
  plantsNeedingFertilizer: string[];
  totalPlants: number;
}

/**
 * Generate HTML email content for care reminders
 */
function generateCareReminderHTML(data: CareReminderEmailData): string {
  const { userName, plantsNeedingWater, plantsNeedingFertilizer, totalPlants } = data;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://teman-tanam.vercel.app';

  const wateringSection = plantsNeedingWater.length > 0
    ? `
      <div style="background-color: #E3F2FD; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
        <h3 style="color: #1565C0; margin: 0 0 12px 0; font-size: 16px;">
          💧 Perlu Disiram (${plantsNeedingWater.length})
        </h3>
        <p style="color: #424242; margin: 0; font-size: 14px; line-height: 1.6;">
          ${plantsNeedingWater.join(', ')}
        </p>
      </div>
    `
    : '';

  const fertilizingSection = plantsNeedingFertilizer.length > 0
    ? `
      <div style="background-color: #E8F5E9; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
        <h3 style="color: #2E7D32; margin: 0 0 12px 0; font-size: 16px;">
          🌱 Perlu Dipupuk (${plantsNeedingFertilizer.length})
        </h3>
        <p style="color: #424242; margin: 0; font-size: 14px; line-height: 1.6;">
          ${plantsNeedingFertilizer.join(', ')}
        </p>
      </div>
    `
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F5F5F5; margin: 0; padding: 20px;">
      <div style="max-width: 480px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #7CB342 0%, #558B2F 100%); padding: 32px 24px; text-align: center;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 24px;">🌱 Teman Tanam</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Pengingat Perawatan Tanaman</p>
        </div>

        <!-- Content -->
        <div style="padding: 24px;">
          <p style="color: #424242; font-size: 16px; margin: 0 0 20px 0;">
            Halo <strong>${userName}</strong>! 👋
          </p>

          <p style="color: #616161; font-size: 14px; margin: 0 0 24px 0; line-height: 1.6;">
            Ada tanaman yang butuh perhatian kamu hari ini. Jangan lupa rawat mereka ya!
          </p>

          ${wateringSection}
          ${fertilizingSection}

          <!-- Stats -->
          <div style="background-color: #FAFAFA; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
            <p style="color: #757575; font-size: 13px; margin: 0;">
              📊 Total tanaman kamu: <strong>${totalPlants}</strong>
            </p>
          </div>

          <!-- CTA Button -->
          <a href="${appUrl}" style="display: block; background: linear-gradient(135deg, #7CB342 0%, #558B2F 100%); color: #FFFFFF; text-decoration: none; padding: 14px 24px; border-radius: 12px; text-align: center; font-weight: 600; font-size: 15px;">
            Buka Teman Tanam
          </a>
        </div>

        <!-- Footer -->
        <div style="background-color: #FAFAFA; padding: 20px 24px; text-align: center; border-top: 1px solid #EEEEEE;">
          <p style="color: #9E9E9E; font-size: 12px; margin: 0 0 8px 0;">
            Email ini dikirim karena kamu mengaktifkan notifikasi perawatan.
          </p>
          <p style="color: #BDBDBD; font-size: 11px; margin: 0;">
            © ${new Date().getFullYear()} Teman Tanam
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate plain text email content for care reminders
 */
function generateCareReminderText(data: CareReminderEmailData): string {
  const { userName, plantsNeedingWater, plantsNeedingFertilizer, totalPlants } = data;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://teman-tanam.vercel.app';

  let text = `Halo ${userName}!\n\n`;
  text += `Ada tanaman yang butuh perhatian kamu hari ini.\n\n`;

  if (plantsNeedingWater.length > 0) {
    text += `💧 PERLU DISIRAM (${plantsNeedingWater.length}):\n`;
    text += `${plantsNeedingWater.join(', ')}\n\n`;
  }

  if (plantsNeedingFertilizer.length > 0) {
    text += `🌱 PERLU DIPUPUK (${plantsNeedingFertilizer.length}):\n`;
    text += `${plantsNeedingFertilizer.join(', ')}\n\n`;
  }

  text += `Total tanaman: ${totalPlants}\n\n`;
  text += `Buka Teman Tanam: ${appUrl}\n\n`;
  text += `---\n`;
  text += `Email ini dikirim karena kamu mengaktifkan notifikasi perawatan.`;

  return text;
}

/**
 * Send care reminder email to a user
 */
export async function sendCareReminderEmail(data: CareReminderEmailData): Promise<{ success: boolean; error?: string; id?: string }> {
  // Don't send if nothing needs care
  if (data.plantsNeedingWater.length === 0 && data.plantsNeedingFertilizer.length === 0) {
    return { success: true }; // Nothing to send
  }

  try {
    const { data: result, error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: data.userEmail,
      subject: '🌱 Tanaman kamu butuh perhatian hari ini!',
      html: generateCareReminderHTML(data),
      text: generateCareReminderText(data),
    });

    if (error) {
      console.error('[email] Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log('[email] Care reminder sent to:', data.userEmail, 'ID:', result?.id);
    return { success: true, id: result?.id };
  } catch (err) {
    const error = err as Error;
    console.error('[email] Send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a test email to verify email settings
 */
export async function sendTestEmail(userEmail: string, userName: string): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    const { data: result, error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: '✅ Test Notifikasi Teman Tanam',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F5F5F5; margin: 0; padding: 20px;">
          <div style="max-width: 480px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #7CB342 0%, #558B2F 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: #FFFFFF; margin: 0; font-size: 24px;">🌱 Teman Tanam</h1>
            </div>
            <div style="padding: 24px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
              <h2 style="color: #2E7D32; margin: 0 0 16px 0;">Email Berhasil!</h2>
              <p style="color: #616161; font-size: 14px; margin: 0 0 8px 0;">
                Halo <strong>${userName}</strong>!
              </p>
              <p style="color: #757575; font-size: 14px; margin: 0; line-height: 1.6;">
                Ini adalah email test untuk memastikan notifikasi perawatan tanaman berfungsi dengan baik.
              </p>
            </div>
            <div style="background-color: #FAFAFA; padding: 16px 24px; text-align: center; border-top: 1px solid #EEEEEE;">
              <p style="color: #9E9E9E; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Teman Tanam
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Halo ${userName}!\n\nIni adalah email test untuk memastikan notifikasi perawatan tanaman berfungsi dengan baik.\n\n- Teman Tanam`,
    });

    if (error) {
      console.error('[email] Test email error:', error);
      return { success: false, error: error.message };
    }

    console.log('[email] Test email sent to:', userEmail, 'ID:', result?.id);
    return { success: true, id: result?.id };
  } catch (err) {
    const error = err as Error;
    console.error('[email] Test email error:', error);
    return { success: false, error: error.message };
  }
}
