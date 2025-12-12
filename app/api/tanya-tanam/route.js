import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

// Helper to read API key from .env.local
function getApiKey() {
  // First try process.env
  if (process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }

  // Fallback: read from .env.local file directly
  try {
    const envPath = join(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf8');
    const match = envContent.match(/ANTHROPIC_API_KEY=(.+)/);
    if (match) {
      return match[1].trim();
    }
  } catch (e) {
    console.error('Failed to read .env.local:', e.message);
  }

  return null;
}

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

Contoh respons yang BAIK:
"Daun menguning di bagian bawah biasanya tanda kekurangan nitrogen 🌱 Coba kasih pupuk organik atau kompos. Kalau dalam seminggu gak membaik, kabari aku lagi ya!"

Contoh respons yang SALAH (terlalu panjang/teknis):
"Berdasarkan analisis morfologi daun, terindikasi defisiensi nitrogen pada jaringan klorofil yang memerlukan aplikasi pupuk NPK dengan rasio 10-10-10..."`;

export async function POST(request) {
  try {
    const { message, plantContext, chatHistory = [] } = await request.json();

    // Get API key
    const apiKey = getApiKey();
    console.log('API Key present:', !!apiKey);

    if (!apiKey) {
      console.error('No API key found!');
      return NextResponse.json(
        { success: false, error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({ apiKey });

    // Build context message about the plant
    let contextMessage = '';
    if (plantContext) {
      contextMessage = `
[Konteks Tanaman]
- Nama: ${plantContext.name || 'Tidak diketahui'}
- Jenis: ${plantContext.species || 'Tidak diketahui'}
- Umur: ${plantContext.age || 'Tidak diketahui'} hari
- Lokasi: ${plantContext.location || 'Tidak diketahui'}
${plantContext.lastWatered ? `- Terakhir disiram: ${plantContext.lastWatered}` : ''}
${plantContext.lastFertilized ? `- Terakhir dipupuk: ${plantContext.lastFertilized}` : ''}

`;
    }

    // Build messages array for Claude
    const messages = [
      ...chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: contextMessage + message
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
    const aiMessage = response.content[0].text;

    return NextResponse.json({
      success: true,
      message: aiMessage
    });

  } catch (error) {
    console.error('Tanya Tanam API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Waduh, ada masalah nih. Coba lagi ya!'
      },
      { status: 500 }
    );
  }
}
