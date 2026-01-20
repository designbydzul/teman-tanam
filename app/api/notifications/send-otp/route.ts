import { NextResponse } from 'next/server';
import { createDebugger } from '@/lib/debug';
import {
  checkRateLimit,
  createRateLimitResponse,
  RATE_LIMITS,
} from '@/lib/rateLimit';

const debug = createDebugger('api:send-otp');

/**
 * Send OTP via WhatsApp for phone number verification
 *
 * Security measures:
 * - Rate limiting: 3 requests per 10 minutes per phone number
 * - Phone number validation and sanitization
 * - OTP codes are never logged
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { whatsapp_number, otp_code } = body;

    // SECURITY: Never log OTP codes - only log masked phone number
    const maskedPhone = whatsapp_number
      ? `${whatsapp_number.substring(0, 4)}****${whatsapp_number.slice(-2)}`
      : 'unknown';
    debug.log('Send OTP request for:', maskedPhone);

    // Validate input
    if (!whatsapp_number || !otp_code) {
      return NextResponse.json(
        { success: false, error: 'Nomor WhatsApp dan kode OTP wajib diisi' },
        { status: 400 }
      );
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp_code)) {
      return NextResponse.json(
        { success: false, error: 'Kode OTP harus 6 digit angka' },
        { status: 400 }
      );
    }

    // Sanitize phone number: remove all non-numeric characters
    let formattedNumber = whatsapp_number.replace(/[^0-9]/g, '');

    // Remove leading 0 if present (convert 08xxx to 8xxx)
    if (formattedNumber.startsWith('0')) {
      formattedNumber = formattedNumber.substring(1);
    }

    // Add 62 prefix if not present
    if (!formattedNumber.startsWith('62')) {
      formattedNumber = '62' + formattedNumber;
    }

    // Validate Indonesian phone format: 628xxxxxxxxx (10-14 digits total)
    if (!/^628\d{8,12}$/.test(formattedNumber)) {
      return NextResponse.json(
        { success: false, error: 'Format nomor tidak valid. Gunakan format 08xx atau 628xx.' },
        { status: 400 }
      );
    }

    // Rate limiting based on phone number to prevent OTP flooding
    const rateLimitResult = checkRateLimit(formattedNumber, RATE_LIMITS.SEND_OTP);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(
        rateLimitResult,
        'Terlalu banyak permintaan OTP. Tunggu beberapa menit ya!'
      );
    }

    // Send OTP via Fonnte
    const fonnte_token = process.env.FONNTE_API_TOKEN;
    if (!fonnte_token) {
      debug.error('FONNTE_API_TOKEN not configured');
      return NextResponse.json(
        { success: false, error: 'Konfigurasi API tidak lengkap' },
        { status: 500 }
      );
    }

    const message = `🔐 Teman Tanam\n\nKode verifikasi kamu: ${otp_code}\n\nBerlaku 5 menit. Jangan kasih ke orang lain ya! 🤫\n\ntemantanam.app`;

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': fonnte_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: formattedNumber,
        message: message,
        countryCode: '62',
      }),
    });

    const data = await response.json();
    debug.log('Fonnte API response:', data);

    if (data.status !== true && !data.id) {
      debug.error('Failed to send OTP:', data);
      return NextResponse.json(
        { success: false, error: 'Gagal kirim OTP. Cek nomor WhatsApp kamu ya!' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP berhasil dikirim',
    });
  } catch (error) {
    debug.error('Error in send-otp:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat kirim OTP' },
      { status: 500 }
    );
  }
}
