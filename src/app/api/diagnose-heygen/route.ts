import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  console.log('🔍 FULL DIAGNOSTIC: Testing HeyGen API step by step');
  
  try {
    const apiKey = process.env.HEYGEN_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        step: 'api_key_check',
        error: 'HeyGen API key not configured'
      }, { status: 500 });
    }

    console.log('✅ Step 1: API key found');

    // Step 1: Test basic connectivity with a working endpoint
    console.log('🔍 Step 2: Testing basic API connectivity...');
    
    const connectivityTest = await fetch('https://api.heygen.com/v1/voice/list', {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
      }
    });

    const connectivityText = await connectivityTest.text();
    console.log('📡 Connectivity response status:', connectivityTest.status);
    console.log('📡 Connectivity response headers:', Object.fromEntries(connectivityTest.headers.entries()));
    console.log('📡 Connectivity response text (first 500 chars):', connectivityText.substring(0, 500));

    let connectivityData;
    try {
      connectivityData = JSON.parse(connectivityText);
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        step: 'connectivity_test',
        error: 'API returned non-JSON response',
        status: connectivityTest.status,
        responseText: connectivityText.substring(0, 1000),
        analysis: connectivityTest.status === 404 ? 'API endpoint not found - possible URL issue' :
                 connectivityTest.status === 401 ? 'Authentication failed - check API key' :
                 connectivityTest.status === 403 ? 'Access denied - API key lacks permissions' :
                 'Unknown response format'
      });
    }

    console.log('✅ Step 2: Connectivity successful, got JSON response');

    // Step 2: Test video generation endpoint specifically
    console.log('🔍 Step 3: Testing video generation endpoint...');

    const videoPayload = {
      video_inputs: [{
        character: {
          type: 'avatar',
          avatar_id: 'Abigail_expressive_2024112501',
          avatar_style: 'normal'
        },
        voice: {
          type: 'text',
          input_text: 'Hello, this is a diagnostic test.',
          voice_id: '2f72ee82b83d4b00af16c4771d611752'
        }
      }],
      test: true,
      aspect_ratio: '16:9'
    };

    console.log('📤 Video generation payload:', JSON.stringify(videoPayload, null, 2));

    const videoResponse = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(videoPayload)
    });

    const videoResponseText = await videoResponse.text();
    console.log('🎬 Video response status:', videoResponse.status);
    console.log('🎬 Video response headers:', Object.fromEntries(videoResponse.headers.entries()));
    console.log('🎬 Video response text:', videoResponseText);

    let videoData;
    try {
      videoData = JSON.parse(videoResponseText);
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        step: 'video_generation_test',
        error: 'Video generation API returned non-JSON response',
        status: videoResponse.status,
        responseText: videoResponseText,
        analysis: videoResponse.status === 404 ? 'Video generation endpoint not found - wrong URL or API version' :
                 videoResponse.status === 401 ? 'Authentication failed for video generation' :
                 videoResponse.status === 403 ? 'Access denied for video generation - upgrade plan needed?' :
                 videoResponse.status === 500 ? 'HeyGen server error' :
                 'Unknown video generation error'
      });
    }

    // If we get here, video generation returned JSON
    console.log('✅ Step 3: Video generation returned JSON response');

    if (!videoResponse.ok) {
      return NextResponse.json({
        success: false,
        step: 'video_generation_response',
        error: `Video generation failed with status ${videoResponse.status}`,
        status: videoResponse.status,
        responseData: videoData,
        analysis: 'Video generation API accessible but request failed - check payload format'
      });
    }

    // Success!
    return NextResponse.json({
      success: true,
      message: 'All diagnostic steps passed!',
      steps: {
        api_key: 'OK',
        connectivity: 'OK', 
        video_generation: 'OK'
      },
      connectivityData: connectivityData,
      videoData: videoData,
      videoId: videoData.data?.video_id || videoData.video_id
    });

  } catch (error) {
    console.error('❌ Diagnostic error:', error);
    
    return NextResponse.json({
      success: false,
      step: 'network_error',
      error: error instanceof Error ? error.message : 'Unknown network error',
      type: 'network_or_parsing_error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'HeyGen Full Diagnostic Endpoint',
    usage: 'POST to run complete HeyGen API diagnosis',
    purpose: 'Step-by-step testing to identify exact failure point'
  });
}