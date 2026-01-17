import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  checkRateLimit,
  getClientIP,
  createRateLimitResponse,
  RATE_LIMITS,
} from '@/lib/rateLimit';

// API key will be read at request time to ensure proper loading

// Request validation schema
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(10000),
});

// Base64 image validation (data:image/...)
const ImageSchema = z.string().refine(
  (val) => val.startsWith('data:image/'),
  { message: 'Invalid image format' }
);

const RequestSchema = z.object({
  message: z.string().max(2000, 'Message too long').default(''),
  images: z.array(ImageSchema).max(3, 'Maximum 3 images allowed').default([]),
  plantContextText: z.string().max(5000).optional().nullable(), // Enhanced pre-formatted context
  chatHistory: z.array(MessageSchema).default([]),
}).refine(
  (data) => data.message.trim().length > 0 || data.images.length > 0,
  { message: 'Message or image is required' }
);

const SYSTEM_PROMPT = `Kamu adalah "Tanya Tanam" - asisten perawatan tanaman yang ramah untuk aplikasi Teman Tanam by Akar Nusa.

## GAYA KOMUNIKASI
- Bahasa Indonesia kasual (pakai "kamu", bukan "Anda")
- Hangat, friendly, tapi HEMAT emoji
- MAKSIMAL 1-2 emoji per respons TOTAL, taruh di akhir paragraf utama saja
- JANGAN pakai emoji di setiap poin, kalimat, atau bullet point
- JANGAN pakai emoji di awal kalimat
- Lebih baik 0 emoji daripada kebanyakan
- Respons SINGKAT dan actionable - langsung ke poin
- Jelaskan istilah teknis dengan sederhana

## PANJANG RESPONS
- Pertanyaan simple → 1-2 kalimat
- Diagnosa masalah → 3-5 kalimat + langkah aksi
- JANGAN bertele-tele

## CARA MENJAWAB
- Gunakan <species_knowledge> sebagai referensi UTAMA untuk info spesies
- Cross-reference "Masalah umum" saat diagnosa penyakit
- Sesuaikan advice dengan lokasi dan umur tanaman dari <plant_context>
- Gunakan <care_status> untuk tahu kapan terakhir disiram/dipupuk
- Kalau tidak yakin, jujur bilang dan sarankan tanya ahli

## BATASAN
- Jangan rekomendasikan pestisida kimia spesifik
- Jangan bahas topik di luar tanaman
- Jangan menghakimi kalau tanaman mati/sakit
- Fokus ke solusi praktis
- Supportive dan encouraging
- Prioritaskan solusi organik/alami

## CONTOH PENGGUNAAN EMOJI YANG BENAR

User: "Kenapa daun terong saya kuning?"
AI: "Daun kuning biasanya tanda kekurangan air atau nutrisi. Coba cek tanahnya - kalau kering, siram pelan-pelan. Kalau udah lembab, mungkin butuh pupuk NPK. 🌱"

User: "Kapan siram cabai?"
AI: "Cabai sukanya tanah lembab tapi gak tergenang. Siram setiap 2-3 hari atau kalau tanah atas udah kering. Pastikan drainase potnya bagus ya!"

## CONTOH PENGGUNAAN EMOJI YANG SALAH (JANGAN SEPERTI INI)

SALAH: "🚨 Terongmu butuh perhatian! 🌱 Siram segera ya 💧 Taruh di tempat terang ☀️ Semangat! 💪"
SALAH: "Hai! 👋 Tanaman kamu perlu:
1. 💧 Disiram
2. ☀️ Cahaya
3. 🌿 Pupuk"

## FORMAT KONTEKS YANG DIBERIKAN
- <plant_context>: Info tentang tanaman user (nama, umur, lokasi, terakhir disiram)
- <species_knowledge>: Info referensi tentang jenis tanaman (kebutuhan cahaya, kesulitan, tanda panen, dll)
- <care_status>: Status perawatan terkini (perlu disiram/dipupuk atau tidak)`;

export async function POST(request: Request) {
  try {
    // Rate limiting - prevent API abuse
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(clientIP, RATE_LIMITS.TANYA_TANAM);

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(
        rateLimitResult,
        'Kamu terlalu sering bertanya nih. Istirahat sebentar ya!'
      );
    }

    // Read API key at request time
    // Support both TEMAN_TANAM_ANTHROPIC_KEY and ANTHROPIC_API_KEY
    const anthropicApiKey = process.env.TEMAN_TANAM_ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY;

    // Check API key - don't expose key name in production
    if (!anthropicApiKey) {
      console.error('[tanya-tanam] Anthropic API key not configured');
      return NextResponse.json(
        {
          success: false,
          error: process.env.NODE_ENV === 'development'
            ? 'Anthropic API key is not configured'
            : 'Service temporarily unavailable'
        },
        { status: 503 }
      );
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      console.error('[tanya-tanam] Invalid JSON in request body');
      return NextResponse.json(
        {
          success: false,
          error: 'Waduh, ada masalah dengan request. Coba lagi ya!',
          code: 'INVALID_JSON'
        },
        { status: 400 }
      );
    }

    const parseResult = RequestSchema.safeParse(body);

    if (!parseResult.success) {
      const issues = parseResult.error.issues;
      console.error('[tanya-tanam] Validation failed:', issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));

      // User-friendly error messages based on validation issue
      let userMessage = 'Ada yang salah dengan request. Coba lagi ya!';
      if (issues.some(e => e.path.includes('message') && e.message.includes('required'))) {
        userMessage = 'Pertanyaan tidak boleh kosong';
      } else if (issues.some(e => e.message.includes('Message or image is required'))) {
        userMessage = 'Tulis pertanyaan atau kirim foto tanaman ya!';
      } else if (issues.some(e => e.message.includes('too long') || e.message.includes('Maximum'))) {
        userMessage = 'Pesan terlalu panjang. Coba disingkat ya!';
      } else if (issues.some(e => e.path.includes('images'))) {
        userMessage = 'Ada masalah dengan foto. Coba kirim ulang ya!';
      }

      return NextResponse.json(
        { success: false, error: userMessage, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const { message, images, plantContextText, chatHistory } = parseResult.data;

    // Initialize Anthropic client
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    // Build context message - use enhanced context if provided
    let contextMessage = '';
    if (plantContextText) {
      contextMessage = `[Konteks Tanaman]\n${plantContextText}\n\n`;
    }

    // Helper to parse base64 image
    const parseBase64Image = (dataUrl: string) => {
      const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match) return null;
      return {
        media_type: match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: match[2],
      };
    };

    // Build user message content with images
    type MediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    type ContentBlock =
      | { type: 'text'; text: string }
      | { type: 'image'; source: { type: 'base64'; media_type: MediaType; data: string } };

    const userContent: ContentBlock[] = [];

    // Add images first if present
    if (images.length > 0) {
      for (const imageDataUrl of images) {
        const parsed = parseBase64Image(imageDataUrl);
        if (parsed) {
          userContent.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: parsed.media_type,
              data: parsed.data,
            },
          });
        }
      }
    }

    // Add text message
    const textContent = contextMessage + (message || (images.length > 0 ? 'Tolong analisis foto tanaman ini.' : ''));
    if (textContent.trim()) {
      userContent.push({
        type: 'text',
        text: textContent,
      });
    }

    // Build messages array for Claude
    const messages: Array<{ role: 'user' | 'assistant'; content: string | ContentBlock[] }> = [
      ...chatHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: userContent.length === 1 && userContent[0].type === 'text'
          ? userContent[0].text
          : userContent
      }
    ];

    // Call Claude API with timeout (30 seconds)
    try {
      const response = await anthropic.messages.create(
        {
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          system: SYSTEM_PROMPT,
          messages: messages
        },
        {
          timeout: 30000 // 30 seconds timeout
        }
      );

      // Extract the text response
      const aiMessage = response.content[0].type === 'text' ? response.content[0].text : '';

      return NextResponse.json({
        success: true,
        message: aiMessage
      });
    } catch (apiError) {
      // Handle specific API errors
      const error = apiError as Error & { status?: number; error?: { type?: string } };
      console.error('[tanya-tanam] Claude API error:', error.message);

      // Check for timeout/abort
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Koneksi timeout. Cek internet kamu dan coba lagi',
            code: 'TIMEOUT'
          },
          { status: 504 }
        );
      }

      // Check for rate limiting from Anthropic
      if (error.status === 429 || error.error?.type === 'rate_limit_error') {
        return NextResponse.json(
          {
            success: false,
            error: 'Maaf, Tanya Tanam lagi sibuk. Coba lagi sebentar ya!',
            code: 'RATE_LIMITED'
          },
          { status: 429 }
        );
      }

      // Check for authentication errors
      if (error.status === 401 || error.error?.type === 'authentication_error') {
        console.error('[tanya-tanam] API authentication failed');
        return NextResponse.json(
          {
            success: false,
            error: 'Service temporarily unavailable',
            code: 'AUTH_ERROR'
          },
          { status: 503 }
        );
      }

      // Check for overloaded API
      if (error.status === 529 || error.error?.type === 'overloaded_error') {
        return NextResponse.json(
          {
            success: false,
            error: 'Maaf, Tanya Tanam lagi sibuk banget. Coba lagi dalam beberapa menit ya!',
            code: 'API_OVERLOADED'
          },
          { status: 503 }
        );
      }

      // Generic API error
      return NextResponse.json(
        {
          success: false,
          error: 'Maaf, ada masalah dengan Tanya Tanam. Coba lagi ya!',
          code: 'API_ERROR'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    // Catch-all for unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[tanya-tanam] Unexpected error:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: 'Waduh, ada masalah nih. Coba lagi ya!',
        code: 'UNEXPECTED_ERROR'
      },
      { status: 500 }
    );
  }
}
