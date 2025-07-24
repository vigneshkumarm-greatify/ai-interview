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

    const response = await fetch('https://api.heygen.com/v2/voices', {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    console.log('📥 HeyGen Voices Response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `HeyGen API error: ${response.status}`,
        details: data,
        status: response.status,
        statusText: response.statusText
      });
    }

    return NextResponse.json({
      success: true,
      voices: data,
      message: 'HeyGen voices fetched successfully'
    });

  } catch (error) {
    console.error('❌ HeyGen voices error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Check server console for more information'
    }, { status: 500 });
  }
}