import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { z } from 'zod';

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

const SYSTEM_PROMPT = `Kamu adalah "Teman Tanam Assistant" - asisten diagnosa tanaman yang ramah untuk aplikasi Teman Tanam.

IDENTITAS:
- Asisten diagnosa tanaman yang hangat dan supportive
- Bagian dari aplikasi Teman Tanam by Akar Nusa
- Bukan ahli pertanian profesional, tapi teman yang knowledgeable

GAYA KOMUNIKASI:
- Bahasa Indonesia kasual tapi edukatif (pakai "kamu", bukan "Anda")
- Hangat dan encouraging, tidak menggurui
- Emoji secukupnya (1-2 per respons, tidak berlebihan)
- Respons SINGKAT dan actionable (maksimal 3-4 kalimat)
- Hindari jargon teknis, jelaskan dengan sederhana

BATASAN KEAMANAN:
- JANGAN rekomendasikan pestisida kimia berbahaya
- Selalu prioritaskan solusi organik/alami dulu
- Untuk masalah serius, sarankan konsultasi ahli pertanian lokal
- Jika tidak yakin, akui keterbatasan dan minta foto/detail lebih

FORMAT RESPONS:
- Langsung ke poin, jangan bertele-tele
- Berikan 1-2 saran konkret yang bisa langsung dilakukan
- Akhiri dengan encouragement singkat atau tawaran bantuan lanjutan

MEMANFAATKAN KONTEKS TANAMAN:
Jika diberikan konteks tanaman, gunakan info tersebut untuk memberikan saran yang PERSONAL dan SPESIFIK:
- Sebutkan nama tanaman dalam respons
- Referensi riwayat perawatan ("Kamu terakhir siram 2 hari lalu...")
- Berikan saran berdasarkan pola user ("Pola sirammu bagus, teruskan!")
- Ingatkan jika ada care yang overdue
- Sesuaikan saran dengan umur dan jenis tanaman

Contoh respons yang BAIK dengan konteks:
"Cabai kamu terakhir disiram 3 hari lalu, mungkin butuh air hari ini 💧 Untuk cabai umur 45 hari, siram pagi hari biar gak terlalu panas. Pola sirammu selama ini bagus kok!"

Contoh respons yang BAIK untuk diagnosa:
"Daun menguning di bagian bawah biasanya tanda kekurangan nitrogen 🌱 Coba kasih pupuk organik atau kompos. Kalau dalam seminggu gak membaik, kabari aku lagi ya!"

Contoh respons yang SALAH (terlalu panjang/teknis):
"Berdasarkan analisis morfologi daun, terindikasi defisiensi nitrogen pada jaringan klorofil yang memerlukan aplikasi pupuk NPK dengan rasio 10-10-10..."`;

export async function POST(request: Request) {
  try {
    // Read API key at request time
    // Use TEMAN_TANAM_ANTHROPIC_KEY to avoid conflict with system ANTHROPIC_API_KEY
    const anthropicApiKey = process.env.TEMAN_TANAM_ANTHROPIC_KEY;

    // Check API key
    if (!anthropicApiKey) {
      console.error('[tanya-tanam] TEMAN_TANAM_ANTHROPIC_KEY environment variable is not set');
      return NextResponse.json(
        {
          success: false,
          error: process.env.NODE_ENV === 'development'
            ? 'ANTHROPIC_API_KEY environment variable is not configured'
            : 'Service temporarily unavailable'
        },
        { status: 503 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = RequestSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join(', ');

      return NextResponse.json(
        { success: false, error: `Invalid request: ${errorMessage}` },
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

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: messages
    });

    // Extract the text response
    const aiMessage = response.content[0].type === 'text' ? response.content[0].text : '';

    return NextResponse.json({
      success: true,
      message: aiMessage
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[tanya-tanam] API Error:', errorMessage);

    // Return user-friendly error in production, detailed in development
    return NextResponse.json(
      {
        success: false,
        error: process.env.NODE_ENV === 'development'
          ? `Error: ${errorMessage}`
          : 'Waduh, ada masalah nih. Coba lagi ya!'
      },
      { status: 500 }
    );
  }
}
