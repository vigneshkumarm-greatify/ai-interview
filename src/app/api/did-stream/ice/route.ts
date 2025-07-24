import { NextRequest, NextResponse } from 'next/server';
import { createDIDService } from '@/lib/did-avatar-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🧊 Processing ICE candidate...');
    
    const didService = createDIDService();
    
    if (!didService) {
      return NextResponse.json({
        success: false,
        error: 'D-ID API key not configured'
      }, { status: 400 });
    }
    
    const body = await request.json();
    const { streamId, candidate } = body;
    
    if (!streamId || !candidate) {
      return NextResponse.json({
        success: false,
        error: 'streamId and candidate are required'
      }, { status: 400 });
    }
    
    // Create RTCIceCandidate object
    const iceCandidate = new RTCIceCandidate({
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex
    });
    
    // Send ICE candidate to D-ID
    const success = await didService.sendICECandidate(streamId, iceCandidate);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to send ICE candidate'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'ICE candidate sent successfully'
    });
    
  } catch (error) {
    console.error('❌ Error processing ICE candidate:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}