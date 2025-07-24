import { NextRequest, NextResponse } from 'next/server';
import { createDIDService } from '@/lib/did-avatar-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🎬 Creating D-ID stream session...');
    
    const didService = createDIDService();
    
    if (!didService) {
      return NextResponse.json({
        success: false,
        error: 'D-ID API key not configured'
      }, { status: 400 });
    }
    
    const body = await request.json();
    const { source_url, driver_url, config } = body;
    
    if (!source_url) {
      return NextResponse.json({
        success: false,
        error: 'source_url is required'
      }, { status: 400 });
    }
    
    // Create streaming session
    const streamResponse = await didService.createStream({
      source_url,
      driver_url,
      config: config || { stitch: true, fluent: true }
    });
    
    if (!streamResponse.success) {
      return NextResponse.json({
        success: false,
        error: streamResponse.error || 'Failed to create stream'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      streamId: streamResponse.streamId,
      sessionId: streamResponse.sessionId,
      offerSdp: streamResponse.offerSdp,
      message: 'D-ID stream session created successfully'
    });
    
  } catch (error) {
    console.error('❌ Error creating D-ID stream:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}