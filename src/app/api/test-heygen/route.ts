import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  console.log('🧪 Testing HeyGen API with minimal request...');
  
  try {
    const apiKey = process.env.HEYGEN_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'HeyGen API key not configured'
      }, { status: 500 });
    }

    // Test with simple text-to-avatar video
    const testPayload = {
      video_inputs: [{
        character: {
          type: 'avatar',
          avatar_id: 'Abigail_expressive_2024112501',
          avatar_style: 'normal'
        },
        voice: {
          type: 'text',
          input_text: 'Hello, this is a test message from the AI interviewer.',
          voice_id: '1bd001e7e50f421d891986aad5158bc8' // Joey - Professional voice
        }
      }],
      test: true, // Use test mode for free tier
      aspect_ratio: '16:9'
    };

    console.log('📤 Test Request:', JSON.stringify(testPayload, null, 2));

    const response = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    const data = await response.json();
    
    console.log('📥 HeyGen Response:', JSON.stringify(data, null, 2));
    console.log('🔍 Response Status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('❌ HeyGen API Error - Full Response:', {
        status: response.status,
        statusText: response.statusText,
        data: data,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      let errorMessage = `HeyGen API error: ${response.status}`;
      
      // Try to extract specific error message
      if (data.message) {
        errorMessage += ` - ${data.message}`;
      } else if (data.error) {
        errorMessage += ` - ${data.error}`;
      } else if (data.errors && Array.isArray(data.errors)) {
        errorMessage += ` - ${data.errors.join(', ')}`;
      }
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        details: data,
        status: response.status,
        statusText: response.statusText,
        hint: response.status === 400 ? 'Check avatar_id and voice_id are valid' : undefined
      });
    }

    const videoId = data.data?.video_id || data.event_id;
      
    return NextResponse.json({
      success: true,
      message: 'HeyGen API test successful',
      videoId: videoId,
      response: data,
      note: 'Video generation started. Use the video ID to poll for completion.'
    });

  } catch (error) {
    console.error('❌ HeyGen test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Check server console for more information'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'HeyGen API Test Endpoint',
    usage: 'POST to this endpoint to test HeyGen video generation',
    note: 'This endpoint uses a minimal payload to test the API connection'
  });
}