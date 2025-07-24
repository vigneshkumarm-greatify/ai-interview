import { NextResponse } from 'next/server';
import { createDIDService } from '@/lib/did-avatar-service';

export async function GET() {
  try {
    console.log('🎭 Testing D-ID built-in presenters...');
    
    const didService = createDIDService();
    
    if (!didService) {
      return NextResponse.json({
        success: false,
        error: 'D-ID API key not configured'
      }, { status: 400 });
    }
    
    // Get available presenters from D-ID
    const presenters = await didService.getAvailablePresenters();
    
    return NextResponse.json({
      success: true,
      presenters,
      count: presenters.length,
      message: 'D-ID built-in presenters fetched successfully'
    });
    
  } catch (error) {
    console.error('❌ Error testing D-ID presenters:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}