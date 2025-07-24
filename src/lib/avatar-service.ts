// HeyGen Avatar Service for generating talking avatar videos
export interface AvatarConfig {
  id: string;
  name: string;
  gender: 'male' | 'female';
  style: 'professional' | 'friendly';
  thumbnail: string;
  heygenAvatarId: string;
}

// Predefined professional avatars for MVP
export const AVAILABLE_AVATARS: AvatarConfig[] = [
  {
    id: 'professional-female-1',
    name: 'Abigail Upper Body',
    gender: 'female',
    style: 'professional',
    thumbnail: '/avatars/professional-female-1.jpg',
    heygenAvatarId: 'Abigail_expressive_2024112501'
  },
  {
    id: 'professional-male-1',
    name: 'Abigail Office Front',
    gender: 'female',
    style: 'professional',
    thumbnail: '/avatars/professional-male-1.jpg',
    heygenAvatarId: 'Abigail_standing_office_front'
  },
  {
    id: 'friendly-female-1',
    name: 'Armando Sweater Front',
    gender: 'male',
    style: 'professional',
    thumbnail: '/avatars/friendly-female-1.jpg',
    heygenAvatarId: 'Armando_Sweater_Front_public'
  }
];


export interface VideoGenerationRequest {
  text: string;
  avatarId: string;
  audioUrl?: string; // If we already have TTS audio
  voiceSettings?: {
    voice_id: string;
    speed: number;
    emotion?: string;
  };
}

export interface VideoGenerationResponse {
  success: boolean;
  videoUrl?: string;
  duration?: number;
  error?: string;
  creditsCost?: number;
}

export class AvatarService {
  private apiKey: string;
  private baseUrl = 'https://api.heygen.com/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate a talking avatar video from text or audio
   */
  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    try {
      console.log('🎬 Generating avatar video with HeyGen API...');

      // HeyGen v2 API format with minimal required fields
      const avatarId = this.getHeyGenAvatarId(request.avatarId);
      const payload = {
        video_inputs: [{
          character: {
            type: 'avatar',
            avatar_id: avatarId,
            avatar_style: 'normal'
          },
          voice: {
            type: 'text',
            input_text: request.text.trim(),
            voice_id: request.voiceSettings?.voice_id || '2f72ee82b83d4b00af16c4771d611752' // Jenny - Professional
          }
        }],
        test: true, // Use test mode for free tier
        aspect_ratio: '16:9'
      };

      console.log('📤 HeyGen API Request:', JSON.stringify(payload, null, 2));

      const response = await fetch(`${this.baseUrl}/video/generate`, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      console.log('📥 HeyGen API Response:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        console.error('❌ HeyGen API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        
        // Extract detailed error information
        let errorMessage = `HeyGen API error: ${response.status}`;
        let errorDetails = '';
        
        if (data.message) {
          errorDetails = data.message;
        } else if (data.error) {
          errorDetails = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
        } else if (data.errors && Array.isArray(data.errors)) {
          errorDetails = data.errors.join(', ');
        } else if (data.detail) {
          errorDetails = data.detail;
        } else {
          errorDetails = JSON.stringify(data);
        }
        
        errorMessage += ` - ${errorDetails}`;
        
        console.error('💥 Full HeyGen Error Response:', {
          status: response.status,
          statusText: response.statusText,
          data: data,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        throw new Error(errorMessage);
      }

      // HeyGen returns a video_id for async generation
      const videoId = data.data?.video_id || data.event_id;
      
      if (!videoId) {
        throw new Error('No video ID returned from HeyGen API');
      }
      
      console.log('✅ Avatar video generation initiated:', videoId);

      // Poll for completion
      const videoUrl = await this.pollForCompletion(videoId);

      return {
        success: true,
        videoUrl,
        duration: this.estimateDuration(request.text),
        creditsCost: this.calculateCredits(request.text)
      };

    } catch (error) {
      console.error('❌ Avatar video generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Poll HeyGen API for video completion
   */
  private async pollForCompletion(videoId: string, maxAttempts = 30): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/video_status.get?video_id=${videoId}`, {
          headers: {
            'X-API-KEY': this.apiKey
          }
        });

        const data = await response.json();
        console.log(`🔍 Polling attempt ${attempt + 1}:`, data);

        if (data.data?.status === 'completed' && data.data?.video_url) {
          return data.data.video_url;
        }

        if (data.data?.status === 'failed') {
          throw new Error(`Video generation failed: ${data.data?.error || 'Unknown error'}`);
        }

        // Wait 2 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`⏳ Waiting for video completion... (${attempt + 1}/${maxAttempts})`);

      } catch (error) {
        console.error('Polling error:', error);
        throw error;
      }
    }

    throw new Error('Video generation timeout');
  }

  /**
   * Get HeyGen avatar ID from our avatar config
   */
  private getHeyGenAvatarId(avatarId: string): string {
    const avatar = AVAILABLE_AVATARS.find(a => a.id === avatarId);
    return avatar?.heygenAvatarId || AVAILABLE_AVATARS[0].heygenAvatarId;
  }

  /**
   * Estimate video duration based on text length
   */
  private estimateDuration(text: string): number {
    // Rough estimate: 150 words per minute = 2.5 words per second
    const wordCount = text.split(' ').length;
    return Math.max(3, Math.ceil(wordCount / 2.5)); // Minimum 3 seconds
  }

  /**
   * Calculate credit cost for HeyGen (minimum 30 seconds = 0.1 credits)
   */
  private calculateCredits(text: string): number {
    const duration = this.estimateDuration(text);
    const thirtySecondBlocks = Math.ceil(duration / 30);
    return thirtySecondBlocks * 0.1;
  }

  /**
   * Get avatar configuration by ID
   */
  getAvatarConfig(avatarId: string): AvatarConfig | undefined {
    return AVAILABLE_AVATARS.find(avatar => avatar.id === avatarId);
  }

  /**
   * List all available avatars
   */
  getAvailableAvatars(): AvatarConfig[] {
    return AVAILABLE_AVATARS;
  }
}

// Singleton instance
let avatarServiceInstance: AvatarService | null = null;

export function getAvatarService(): AvatarService {
  if (!avatarServiceInstance) {
    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey) {
      throw new Error('HEYGEN_API_KEY environment variable is required');
    }
    avatarServiceInstance = new AvatarService(apiKey);
  }
  return avatarServiceInstance;
}