import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  console.log('🔍 Checking HeyGen voices that support interactive avatars...');
  
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

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `HeyGen API error: ${response.status}`,
        details: data
      });
    }

    console.log('📥 Raw HeyGen voices response:', JSON.stringify(data, null, 2));
    
    // Handle different possible response structures
    let voices: any[] = [];
    
    if (data.data && Array.isArray(data.data)) {
      voices = data.data;
    } else if (data.data && data.data.voices && Array.isArray(data.data.voices)) {
      // Try nested structure: { data: { voices: [...] } }
      voices = data.data.voices;
    } else if (data.data && typeof data.data === 'object') {
      // If data.data is an object, check if it has array properties
      const arrayProps = Object.keys(data.data).filter(key => Array.isArray(data.data[key]));
      if (arrayProps.length > 0) {
        voices = data.data[arrayProps[0]]; // Use first array property
        console.log(`📋 Using voices from property: ${arrayProps[0]}`);
      } else {
        console.error('❌ No array found in data.data object');
        return NextResponse.json({
          success: false,
          error: 'No array found in voices response',
          debug: {
            responseKeys: Object.keys(data),
            dataKeys: Object.keys(data.data),
            dataStructure: JSON.stringify(data.data).substring(0, 500)
          }
        });
      }
    } else if (Array.isArray(data)) {
      voices = data;
    } else {
      console.error('❌ Unexpected voices API response structure');
      return NextResponse.json({
        success: false,
        error: 'Unexpected voices API response structure',
        debug: {
          responseKeys: Object.keys(data),
          responseType: typeof data,
          isArray: Array.isArray(data),
          dataType: data.data ? typeof data.data : 'undefined'
        }
      });
    }

    // Filter for voices that support interactive avatars
    const avatarSupportedVoices = voices.filter((voice: any) => 
      voice.support_interactive_avatar === true
    );

    console.log('✅ Avatar-supported voices found:', avatarSupportedVoices.length);
    console.log('🎵 Avatar voices:', avatarSupportedVoices.map((v: any) => ({
      id: v.voice_id,
      name: v.name,
      language: v.language,
      gender: v.gender
    })));

    return NextResponse.json({
      success: true,
      avatarSupportedVoices,
      totalVoices: voices.length,
      avatarSupportedCount: avatarSupportedVoices.length,
      message: `Found ${avatarSupportedVoices.length} voices that support interactive avatars out of ${voices.length} total voices`
    });

  } catch (error) {
    console.error('❌ Error checking avatar voices:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}