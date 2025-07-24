import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  console.log('🔍 DEBUG: Testing minimal HeyGen request to identify 400 error');
  
  try {
    const apiKey = process.env.HEYGEN_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'HeyGen API key not configured'
      }, { status: 500 });
    }

    // Ultra minimal payload to test what HeyGen expects
    const minimalPayload = {
      video_inputs: [{
        character: {
          type: 'avatar',
          avatar_id: 'Abigail_expressive_2024112501',
          avatar_style: 'normal'
        },
        voice: {
          type: 'text',
          input_text: 'Hello, this is a test message for the AI interview system.',
          voice_id: '2f72ee82b83d4b00af16c4771d611752' // Jenny - Professional
        }
      }],
      test: true,
      aspect_ratio: '16:9'
    };

    console.log('📤 Minimal test payload:', JSON.stringify(minimalPayload, null, 2));

    const response = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(minimalPayload)
    });

    const data = await response.json();
    
    console.log('📥 HeyGen Response Status:', response.status);
    console.log('📥 HeyGen Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('📥 HeyGen Response Data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        httpStatus: response.status,
        httpStatusText: response.statusText,
        responseHeaders: Object.fromEntries(response.headers.entries()),
        responseData: data,
        analysis: analyzeHeyGenError(response.status, data)
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Minimal HeyGen request succeeded!',
      videoId: data.data?.video_id || data.video_id,
      responseData: data
    });

  } catch (error) {
    console.error('❌ Debug HeyGen error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      type: 'network_or_parsing_error'
    }, { status: 500 });
  }
}

function analyzeHeyGenError(status: number, data: any) {
  const analysis = [];

  if (status === 400) {
    analysis.push('BAD REQUEST - Invalid request format or parameters');
    
    if (data.message?.includes('avatar')) {
      analysis.push('LIKELY ISSUE: Avatar ID invalid or not accessible');
    }
    
    if (data.message?.includes('voice')) {
      analysis.push('LIKELY ISSUE: Voice settings invalid');
    }
    
    if (data.message?.includes('credit') || data.message?.includes('quota')) {
      analysis.push('LIKELY ISSUE: Insufficient credits or quota exceeded');
    }
    
    if (data.message?.includes('permission') || data.message?.includes('access')) {
      analysis.push('LIKELY ISSUE: API key lacks permissions for this avatar');
    }
  }

  if (status === 401) {
    analysis.push('UNAUTHORIZED - API key invalid or expired');
  }

  if (status === 403) {
    analysis.push('FORBIDDEN - API key lacks required permissions');
  }

  if (status === 429) {
    analysis.push('RATE LIMITED - Too many requests');
  }

  return analysis;
}

export async function GET() {
  return NextResponse.json({
    message: 'HeyGen Debug Endpoint',
    usage: 'POST to test minimal HeyGen API request',
    purpose: 'Identify specific cause of 400 errors'
  });
}