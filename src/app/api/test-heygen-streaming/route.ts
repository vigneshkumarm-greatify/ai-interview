import { NextResponse } from 'next/server';
import { createStreamingService } from '@/lib/heygen-streaming-service';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  console.log('🧪 Testing HeyGen Streaming API...');
  
  try {
    const streamingService = createStreamingService();
    
    if (!streamingService) {
      return NextResponse.json({
        success: false,
        error: 'HeyGen API key not configured'
      }, { status: 500 });
    }

    const { method = 'streaming' } = await request.json();

    if (method === 'streaming') {
      // Test streaming session creation
      console.log('📡 Testing streaming session...');
      
      const session = await streamingService.createSession({
        avatarId: 'Abigail_expressive_2024112501',
        quality: 'medium',
        voice: {
          voiceId: '1bd001e7e50f421d891986aad5158bc8'
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Streaming session created successfully',
        session,
        note: 'Use the session ID to send text and start streaming'
      });

    } else if (method === 'simple') {
      // Test simple video creation
      console.log('🎥 Testing simple video creation...');
      
      const result = await streamingService.createSimpleVideo(
        'Hello! This is a test of the HeyGen avatar system.',
        'Abigail_expressive_2024112501'
      );

      if (result.error) {
        return NextResponse.json({
          success: false,
          error: result.error,
          method: 'simple'
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Simple video created successfully',
        videoUrl: result.videoUrl,
        method: 'simple'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid method. Use "streaming" or "simple"'
    });

  } catch (error) {
    console.error('❌ HeyGen streaming test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Check server console for more information'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'HeyGen Streaming API Test Endpoint',
    usage: 'POST with { "method": "streaming" | "simple" }',
    methods: {
      streaming: 'Test creating a streaming session',
      simple: 'Test creating a simple video'
    }
  });
}