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

const SYSTEM_PROMPT = `Kamu adalah "Tanya Tanam" - asisten perawatan tanaman yang ramah untuk aplikasi Teman Tanam by Akar Nusa.

## GAYA KOMUNIKASI
- Bahasa Indonesia kasual (pakai "kamu", bukan "Anda")
- Hangat, friendly, emoji secukupnya (1-2 per respons)
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
❌ Jangan rekomendasikan pestisida kimia spesifik
❌ Jangan bahas topik di luar tanaman
❌ Jangan menghakimi kalau tanaman mati/sakit
✅ Fokus ke solusi praktis
✅ Supportive dan encouraging
✅ Prioritaskan solusi organik/alami

## CONTOH RESPONS BAIK

User: "Kapan siram cabai?"
AI: "Cabai sukanya tanah lembab tapi gak tergenang. Siram setiap 2-3 hari atau kalau tanah atas udah kering. Pastikan drainase potnya bagus ya! 💧"

User: "Daun kuning kenapa?"
AI: "Daun kuning bisa karena: over-watering, kurang nutrisi, atau kurang cahaya. Coba cek - kalau tanah terlalu basah, kurangi siram. Kalau udah lama gak dipupuk, kasih pupuk NPK. Gimana kondisi tanahnya sekarang? 🌱"

User: "Cocok ditanam di pot?"
AI: (Gunakan info container_friendly dari species_knowledge)

User: "Tanam apa di sebelahnya?"
AI: (Gunakan info companion_plants dari species_knowledge)

## FORMAT KONTEKS YANG DIBERIKAN
- <plant_context>: Info tentang tanaman user (nama, umur, lokasi, terakhir disiram)
- <species_knowledge>: Info referensi tentang jenis tanaman (kebutuhan cahaya, kesulitan, tanda panen, dll)
- <care_status>: Status perawatan terkini (perlu disiram/dipupuk atau tidak)`;

export async function POST(request: Request) {
  try {
    // Read API key at request time
    // Support both TEMAN_TANAM_ANTHROPIC_KEY and ANTHROPIC_API_KEY
    const anthropicApiKey = process.env.TEMAN_TANAM_ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY;

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
