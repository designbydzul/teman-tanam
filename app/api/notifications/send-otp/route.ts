import { NextResponse } from 'next/server';
import { createDebugger } from '@/lib/debug';

const debug = createDebugger('api:send-otp');

/**
 * Send OTP via WhatsApp for phone number verification
 *
 * This endpoint sends a 6-digit OTP code to the user's WhatsApp number
 * to verify ownership before enabling notifications.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { whatsapp_number, otp_code } = body;

    debug.log('Send OTP request:', { whatsapp_number, otp_code });

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

    // Format phone number (add 62 prefix if not present)
    let formattedNumber = whatsapp_number;
    if (!formattedNumber.startsWith('62')) {
      formattedNumber = '62' + formattedNumber;
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

    const message = `🔐 *Kode Verifikasi TemanTanam*\n\nKode OTP kamu: *${otp_code}*\n\nJangan bagikan kode ini ke siapa pun ya!\n\nKode ini berlaku selama 5 menit.`;

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
