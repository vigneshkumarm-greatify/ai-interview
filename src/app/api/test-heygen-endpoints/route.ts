import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  console.log('🔍 Testing multiple HeyGen endpoints to find working ones...');
  
  try {
    const apiKey = process.env.HEYGEN_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'HeyGen API key not configured'
      }, { status: 500 });
    }

    // List of endpoints to test
    const endpointsToTest = [
      // Basic info endpoints
      { url: 'https://api.heygen.com/v1/user/remaining_quota', method: 'GET', name: 'User Quota' },
      { url: 'https://api.heygen.com/v1/voice/list', method: 'GET', name: 'Voice List' },
      { url: 'https://api.heygen.com/v2/avatars', method: 'GET', name: 'Avatars V2' },
      { url: 'https://api.heygen.com/v1/avatar/list', method: 'GET', name: 'Avatar List V1' },
      
      // Video generation endpoints
      { url: 'https://api.heygen.com/v2/video/generate', method: 'POST', name: 'Video Generate V2' },
      { url: 'https://api.heygen.com/v1/video.new', method: 'POST', name: 'Video New V1' },
      
      // Streaming endpoints
      { url: 'https://api.heygen.com/v1/streaming.new', method: 'POST', name: 'Streaming New' },
    ];

    const results = [];

    for (const endpoint of endpointsToTest) {
      try {
        console.log(`🧪 Testing ${endpoint.name}: ${endpoint.method} ${endpoint.url}`);
        
        const fetchOptions: RequestInit = {
          method: endpoint.method,
          headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json'
          }
        };

        // Add minimal payload for POST requests
        if (endpoint.method === 'POST') {
          if (endpoint.url.includes('video/generate')) {
            fetchOptions.body = JSON.stringify({
              video_inputs: [{
                character: {
                  type: 'avatar',
                  avatar_id: 'Abigail_expressive_2024112501'
                },
                voice: {
                  type: 'text',
                  input_text: 'Test'
                }
              }],
              test: true
            });
          } else if (endpoint.url.includes('streaming')) {
            fetchOptions.body = JSON.stringify({
              quality: 'medium',
              avatar_name: 'Abigail_expressive_2024112501'
            });
          } else {
            fetchOptions.body = JSON.stringify({ test: true });
          }
        }

        const response = await fetch(endpoint.url, fetchOptions);
        const responseText = await response.text();
        
        let isJson = false;
        let responseData = null;
        
        try {
          responseData = JSON.parse(responseText);
          isJson = true;
        } catch (e) {
          // Not JSON
        }

        results.push({
          name: endpoint.name,
          url: endpoint.url,
          method: endpoint.method,
          status: response.status,
          statusText: response.statusText,
          isJson,
          isWorking: response.ok && isJson,
          responsePreview: isJson ? JSON.stringify(responseData).substring(0, 200) : responseText.substring(0, 200),
          headers: Object.fromEntries(response.headers.entries())
        });

        console.log(`${response.ok && isJson ? '✅' : '❌'} ${endpoint.name}: ${response.status} ${isJson ? 'JSON' : 'HTML/Text'}`);

      } catch (error) {
        results.push({
          name: endpoint.name,
          url: endpoint.url,
          method: endpoint.method,
          error: error instanceof Error ? error.message : 'Unknown error',
          isWorking: false
        });
        
        console.log(`❌ ${endpoint.name}: Network error`);
      }
    }

    const workingEndpoints = results.filter(r => r.isWorking);
    const failedEndpoints = results.filter(r => !r.isWorking);

    return NextResponse.json({
      success: workingEndpoints.length > 0,
      message: `Found ${workingEndpoints.length} working endpoints out of ${results.length} tested`,
      workingEndpoints,
      failedEndpoints,
      allResults: results,
      recommendation: workingEndpoints.length > 0 ? 
        `Use ${workingEndpoints[0].name} endpoint for connectivity testing` :
        'No working endpoints found - check API key or HeyGen service status'
    });

  } catch (error) {
    console.error('❌ Endpoint test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'HeyGen Endpoint Tester',
    usage: 'POST to test multiple HeyGen API endpoints',
    purpose: 'Find working endpoints for connectivity testing'
  });
}