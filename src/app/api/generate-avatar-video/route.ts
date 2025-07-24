import { NextResponse } from 'next/server';
import { createCustomAvatarService } from '@/lib/custom-avatar-service';
import { createSynthesiaAvatarService } from '@/lib/synthesia-avatar-service';
import { createDIDService } from '@/lib/did-avatar-service';

export const runtime = 'nodejs';

interface VideoRequest {
  text: string;
  avatarId: string;
  emotion?: 'greeting' | 'question' | 'encouragement' | 'neutral';
  forceGenerate?: boolean; // Skip cache for testing
  service?: 'synthesia' | 'did' | 'custom'; // Choose avatar service
}

export async function POST(request: Request) {
  console.log('🎬 AVATAR VIDEO API - Generating talking avatar video');
  
  try {
    const body: VideoRequest = await request.json();
    const { text, avatarId, emotion = 'neutral', forceGenerate = false, service = 'did' } = body;

    console.log('📝 Video Request:', { 
      text: text.substring(0, 50) + '...', 
      avatarId, 
      emotion, 
      service 
    });

    // Validate input
    if (!text || !avatarId) {
      return NextResponse.json({
        success: false,
        error: 'Text and avatarId are required'
      }, { status: 400 });
    }

    if (text.length > 500) {
      return NextResponse.json({
        success: false,
        error: 'Text too long (max 500 characters)'
      }, { status: 400 });
    }

    const startTime = Date.now();

    // ONLY use D-ID - no fallback to custom avatars
    console.log('🎬 Using D-ID for realistic video avatar (FREE TIER)...');
    
    const didService = createDIDService();
    
    if (!didService) {
      console.log('❌ D-ID API key not configured');
      return NextResponse.json({
        success: false,
        error: 'D-ID API key not configured. Please add DID_API_KEY to your environment variables.',
        requiresApiKey: true
      }, { status: 400 });
    }
    
    // Map avatar ID to image URL
    const avatarImageUrl = getDIDAvatarImage(avatarId);
    
    // Generate D-ID video with real lip sync (FREE: 20 videos/month)
    const result = await didService.generateVideo({
      text,
      avatarImageUrl,
      voiceId: getDIDVoiceForEmotion(emotion)
    });

    const generationTime = Date.now() - startTime;
    console.log(`⏱️ D-ID generation took ${generationTime}ms`);

    if (!result.success) {
      console.log('❌ D-ID failed:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error || 'D-ID video generation failed',
        service: 'did'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      videoUrl: result.videoUrl,
      videoId: result.videoId || result.talkId,
      duration: result.duration || Math.ceil(text.split(' ').length / 2.5),
      cached: false,
      creditsCost: 1, // Uses free tier credits
      generationTime: generationTime,
      service: 'did',
      realistic: true, // Real video with lip sync
      freeTier: true // Uses D-ID free tier (20 videos/month)
    });

  } catch (error) {
    console.error('❌ Avatar video generation error:', error);
    
    // Check if it's an API limit error
    const isRateLimitError = error instanceof Error && 
      (error.message.includes('rate limit') || error.message.includes('quota'));
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      fallbackToAudio: true,
      rateLimited: isRateLimitError
    }, { status: 500 });
  }
}

/**
 * Generate custom avatar as fallback
 */
async function generateCustomAvatar(text: string, avatarId: string, emotion: string, startTime: number) {
  const avatarService = createCustomAvatarService();

  console.log('🎭 Generating custom avatar animation (fallback)...');

  // Generate TTS audio first if needed
  let audioUrl;
  try {
    const ttsResponse = await fetch(`${process.env.NEXTJS_URL || 'http://localhost:3000'}/api/text-to-speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text, 
        emotion,
        voice: 'alloy' // Use OpenAI TTS
      })
    });
    
    if (ttsResponse.ok) {
      const ttsData = await ttsResponse.json();
      if (ttsData.success && ttsData.audio) {
        // Convert base64 audio to data URL for direct playback
        audioUrl = `data:audio/mp3;base64,${ttsData.audio}`;
        console.log('🔊 TTS audio generated for avatar (base64 converted to data URL)');
      }
    }
  } catch (error) {
    console.log('⚠️ TTS failed, avatar will be visual only:', error);
  }

  // Generate custom avatar (always succeeds!)
  const result = await avatarService.generateAvatar({
    text,
    avatarId,
    emotion,
    audioUrl
  });

  const generationTime = Date.now() - startTime;
  console.log(`⏱️ Custom avatar generation took ${generationTime}ms`);

  if (!result.success) {
    return NextResponse.json({
      success: false,
      error: result.error || 'Avatar generation failed',
      fallbackToAudio: true
    }, { status: 500 });
  }

  // Always succeeds with custom avatars!
  return NextResponse.json({
    success: true,
    avatarData: result.videoData, // Custom avatar data instead of videoUrl
    duration: result.videoData?.duration,
    cached: false,
    creditsCost: 0, // No cost - unlimited usage!
    generationTime: generationTime,
    service: 'custom-avatar',
    unlimited: true
  });
}

/**
 * Map avatar ID to D-ID compatible image URL
 * D-ID requires URLs to end with .jpg/.jpeg/.png without query parameters
 */
function getDIDAvatarImage(avatarId: string): string {
  // Using direct image URLs that D-ID will accept
  const avatarMap: Record<string, string> = {
    'amy-professional': 'https://cdn.pixabay.com/photo/2018/01/15/07/51/woman-3083383_1280.jpg',
    'john-professional': 'https://cdn.pixabay.com/photo/2016/11/21/12/42/beard-1845166_1280.jpg',
    'lisa-friendly': 'https://cdn.pixabay.com/photo/2017/08/06/12/06/people-2591874_1280.jpg',
    // Fallback to first avatar if not found
    'professional-female-1': 'https://cdn.pixabay.com/photo/2018/01/15/07/51/woman-3083383_1280.jpg',
    'professional-male-1': 'https://cdn.pixabay.com/photo/2016/11/21/12/42/beard-1845166_1280.jpg',
    'friendly-female-1': 'https://cdn.pixabay.com/photo/2017/08/06/12/06/people-2591874_1280.jpg'
  };

  return avatarMap[avatarId] || avatarMap['professional-female-1'];
}

/**
 * Get voice settings based on emotion for D-ID
 */
function getDIDVoiceForEmotion(emotion: string): string {
  switch (emotion) {
    case 'greeting':
      return 'en-US-JennyNeural'; // Friendly greeting voice
    case 'question':
      return 'en-US-SaraNeural'; // Professional questioning voice
    case 'encouragement':
      return 'en-US-AriaNeural'; // Supportive voice
    default:
      return 'en-US-JennyNeural'; // Default professional voice
  }
}

/**
 * Get voice settings based on emotion for Synthesia
 */
function getVoiceForEmotion(emotion: string): string {
  switch (emotion) {
    case 'greeting':
      return 'en-US-female-1'; // Friendly greeting voice
    case 'question':
      return 'en-US-female-2'; // Professional questioning voice
    case 'encouragement':
      return 'en-US-female-3'; // Supportive voice
    default:
      return 'en-US-female-1'; // Default professional voice
  }
}

/**
 * Get voice settings based on emotion using actual HeyGen voice IDs
 */
function getVoiceSettings(emotion: string) {
  switch (emotion) {
    case 'greeting':
      return {
        voice_id: '932643d355ed4a3d837370a3068bbd1b', // Josie - Cheerful (Female)
        speed: 0.95,
        emotion: 'cheerful'
      };
    case 'question':
      return {
        voice_id: '2f72ee82b83d4b00af16c4771d611752', // Jenny - Professional (Female)
        speed: 1.0,
        emotion: 'conversational'
      };
    case 'encouragement':
      return {
        voice_id: '628161fd1c79432d853b610e84dbc7a4', // Bella - Friendly (Female)
        speed: 0.9,
        emotion: 'empathetic'
      };
    default:
      return {
        voice_id: '2f72ee82b83d4b00af16c4771d611752', // Jenny - Professional (Female)
        speed: 1.0,
        emotion: 'neutral'
      };
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  try {
    const videoCache = getVideoCache();
    const cacheStats = videoCache.getCacheStats();
    
    return NextResponse.json({
      status: 'healthy',
      service: 'avatar-video-generation',
      cache: cacheStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}