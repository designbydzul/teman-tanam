/**
 * Fonnte API Integration
 *
 * Sends WhatsApp messages via Fonnte API.
 * https://fonnte.com/
 */

const FONNTE_API_URL = 'https://api.fonnte.com/send';

interface FonnteSendRequest {
  target: string;      // Phone number: 628123456789
  message: string;     // Message content
  countryCode?: string; // Optional, default 62
}

interface FonnteSendResponse {
  status: boolean;
  detail?: string;
  id?: string;
}

export interface SendResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

/**
 * Send a WhatsApp message via Fonnte API
 *
 * @param phoneNumber - Indonesian phone number (format: 628xxx)
 * @param message - Message content
 * @returns Result with success status and optional error
 */
export async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string
): Promise<SendResult> {
  const token = process.env.FONNTE_API_TOKEN;

  if (!token) {
    console.error('[fonnte] FONNTE_API_TOKEN is not set');
    return { success: false, error: 'API token not configured' };
  }

  try {
    const requestBody: FonnteSendRequest = {
      target: phoneNumber,
      message: message,
    };

    const response = await fetch(FONNTE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data: FonnteSendResponse = await response.json();

    if (data.status) {
      return {
        success: true,
        messageId: data.id,
      };
    } else {
      const errorMsg = (data as any).reason || data.detail || 'Unknown error from Fonnte API';
      return {
        success: false,
        error: errorMsg,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Validate that Fonnte API is configured
 */
export function isFonnteConfigured(): boolean {
  return !!process.env.FONNTE_API_TOKEN;
}
