import { NextRequest, NextResponse } from 'next/server';
import { createDIDService } from '@/lib/did-avatar-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🔗 Processing SDP answer...');
    
    const didService = createDIDService();
    
    if (!didService) {
      return NextResponse.json({
        success: false,
        error: 'D-ID API key not configured'
      }, { status: 400 });
    }
    
    const body = await request.json();
    const { streamId, answerSdp } = body;
    
    if (!streamId || !answerSdp) {
      return NextResponse.json({
        success: false,
        error: 'streamId and answerSdp are required'
      }, { status: 400 });
    }
    
    // Send SDP answer to D-ID
    const success = await didService.sendStreamSDP(streamId, answerSdp);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to send SDP answer'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'SDP answer sent successfully'
    });
    
  } catch (error) {
    console.error('❌ Error processing SDP:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}