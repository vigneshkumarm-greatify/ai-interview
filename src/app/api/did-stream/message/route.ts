import { NextRequest, NextResponse } from 'next/server';
import { createDIDService } from '@/lib/did-avatar-service';

export async function POST(request: NextRequest) {
  try {
    console.log('💬 Sending message to D-ID stream...');
    
    const didService = createDIDService();
    
    if (!didService) {
      return NextResponse.json({
        success: false,
        error: 'D-ID API key not configured'
      }, { status: 400 });
    }
    
    const body = await request.json();
    const { streamId, text, voiceId } = body;
    
    if (!streamId || !text) {
      return NextResponse.json({
        success: false,
        error: 'streamId and text are required'
      }, { status: 400 });
    }
    
    // Send message to streaming avatar
    const success = await didService.sendStreamMessage(streamId, text, voiceId);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to send message to stream'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Message sent to stream successfully'
    });
    
  } catch (error) {
    console.error('❌ Error sending stream message:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}