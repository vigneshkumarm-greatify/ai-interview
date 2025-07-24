import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  console.log('🧪 Testing HeyGen API with different formats...');
  
  try {
    const apiKey = process.env.HEYGEN_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'HeyGen API key not configured'
      }, { status: 500 });
    }

    const { format = 'format1' } = await request.json();

    // Try different payload formats based on HeyGen API versions
    const payloadFormats: Record<string, any> = {
      // Format 1: Simple text-to-video
      format1: {
        text: 'Hello, this is a test message.',
        avatar_id: 'Abigail_expressive_2024112501',
        voice_id: '1bd001e7e50f421d891986aad5158bc8',
        test: true
      },
      
      // Format 2: Video generation v1 style
      format2: {
        script: {
          type: 'text',
          input: 'Hello, this is a test message.'
        },
        avatar: {
          avatar_id: 'Abigail_expressive_2024112501'
        },
        voice: {
          voice_id: '1bd001e7e50f421d891986aad5158bc8'
        },
        test: true
      },
      
      // Format 3: Minimal payload
      format3: {
        avatar_id: 'Abigail_expressive_2024112501',
        script: 'Hello, this is a test message.',
        test: true
      },
      
      // Format 4: With background
      format4: {
        video_inputs: [{
          character: {
            type: 'avatar',
            avatar_id: 'Abigail_expressive_2024112501'
          },
          voice: {
            type: 'text',
            input_text: 'Hello, this is a test message.'
          }
        }],
        background: {
          type: 'color',
          value: '#FFFFFF'
        },
        test: true
      }
    };

    const testPayload = payloadFormats[format] || payloadFormats.format1;
    
    console.log(`📤 Testing ${format}:`, JSON.stringify(testPayload, null, 2));

    // Try different endpoints
    const endpoints = [
      'https://api.heygen.com/v2/video/generate',
      'https://api.heygen.com/v1/video.new',
      'https://api.heygen.com/v2/video_translate/create',
      'https://api.heygen.com/v2/template/generate'
    ];

    const results = [];

    for (const endpoint of endpoints) {
      try {
        console.log(`\n🔗 Trying endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testPayload)
        });

        const data = await response.json();
        
        results.push({
          endpoint,
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          data: data
        });
        
        console.log(`📥 Response from ${endpoint}:`, {
          status: response.status,
          data: data
        });
        
        // If we get a successful response, return it immediately
        if (response.ok) {
          return NextResponse.json({
            success: true,
            message: `Success with endpoint: ${endpoint}`,
            endpoint,
            format,
            response: data,
            videoId: data.data?.video_id || data.video_id || data.event_id
          });
        }
      } catch (error) {
        console.error(`❌ Error with ${endpoint}:`, error);
        results.push({
          endpoint,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // All endpoints failed, return summary
    return NextResponse.json({
      success: false,
      error: 'All HeyGen endpoints failed',
      format,
      results,
      hint: 'Try different formats by passing { "format": "format2" } in request body'
    });

  } catch (error) {
    console.error('❌ HeyGen test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'HeyGen Simple Test Endpoint',
    usage: 'POST with { "format": "format1" | "format2" | "format3" | "format4" }',
    formats: {
      format1: 'Simple text-to-video',
      format2: 'Video generation v1 style',
      format3: 'Minimal payload',
      format4: 'With background'
    }
  });
}