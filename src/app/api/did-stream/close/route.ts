import { NextRequest, NextResponse } from 'next/server';
import { createDIDService } from '@/lib/did-avatar-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🔚 Closing D-ID stream...');
    
    const didService = createDIDService();
    
    if (!didService) {
      return NextResponse.json({
        success: false,
        error: 'D-ID API key not configured'
      }, { status: 400 });
    }
    
    const body = await request.json();
    const { streamId } = body;
    
    if (!streamId) {
      return NextResponse.json({
        success: false,
        error: 'streamId is required'
      }, { status: 400 });
    }
    
    // Close D-ID stream
    const success = await didService.closeStream(streamId);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to close stream'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Stream closed successfully'
    });
    
  } catch (error) {
    console.error('❌ Error closing stream:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}