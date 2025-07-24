import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  console.log('🎵 Fetching HeyGen voices...');
  
  try {
    const apiKey = process.env.HEYGEN_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'HeyGen API key not configured'
      }, { status: 500 });
    }

    const response = await fetch('https://api.heygen.com/v1/voice/list', {
      headers: {
        'X-API-KEY': apiKey
      }
    });

    const data = await response.json();
    
    console.log('📥 HeyGen Voices Response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `HeyGen voices API error: ${response.status} - ${JSON.stringify(data)}`,
        status: response.status
      });
    }

    // Extract and categorize voices
    const voices = data.data || data.voices || [];
    
    const categorizedVoices = {
      english: voices.filter((v: any) => v.language === 'English' || v.language === 'en'),
      professional: voices.filter((v: any) => 
        v.name?.toLowerCase().includes('professional') || 
        v.style?.toLowerCase().includes('professional')
      ),
      all: voices
    };

    return NextResponse.json({
      success: true,
      total: voices.length,
      voices: categorizedVoices,
      recommended: voices.slice(0, 5), // First 5 as recommendations
      raw: data // Full response for debugging
    });

  } catch (error) {
    console.error('❌ Error fetching HeyGen voices:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}