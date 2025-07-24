// Synthesia AI Avatar Service - Real Video Lip Sync
export interface SynthesiaAvatarConfig {
  id: string;
  name: string;
  synthesia_id: string; // Synthesia avatar ID
  gender: 'male' | 'female';
  style: 'professional' | 'friendly';
  thumbnail: string; // Preview image
}

export interface SynthesiaVideoRequest {
  text: string;
  avatarId: string;
  voice_id?: string;
  background?: string;
}

export interface SynthesiaVideoResponse {
  success: boolean;
  videoUrl?: string;
  videoId?: string;
  status?: 'processing' | 'complete' | 'failed';
  error?: string;
  estimatedTime?: number;
}

// Available Synthesia avatars (using free/demo avatars)
export const SYNTHESIA_AVATARS: SynthesiaAvatarConfig[] = [
  {
    id: 'anna-professional',
    name: 'Anna - Professional',
    synthesia_id: 'anna_costume1_cameraA', // Synthesia's free avatar
    gender: 'female',
    style: 'professional',
    thumbnail: 'https://synthesia-ttv-data.s3-eu-west-1.amazonaws.com/avatar_thumbnails/anna_costume1_cameraA.jpg'
  },
  {
    id: 'daniel-professional', 
    name: 'Daniel - Professional',
    synthesia_id: 'daniel_costume1_cameraA', // Synthesia's free avatar
    gender: 'male',
    style: 'professional',
    thumbnail: 'https://synthesia-ttv-data.s3-eu-west-1.amazonaws.com/avatar_thumbnails/daniel_costume1_cameraA.jpg'
  },
  {
    id: 'sarah-friendly',
    name: 'Sarah - Friendly',
    synthesia_id: 'sarah_costume1_cameraA', // Synthesia's free avatar
    gender: 'female', 
    style: 'friendly',
    thumbnail: 'https://synthesia-ttv-data.s3-eu-west-1.amazonaws.com/avatar_thumbnails/sarah_costume1_cameraA.jpg'
  }
];

export class SynthesiaAvatarService {
  private apiKey: string;
  private baseUrl = 'https://api.synthesia.io/v2';

  constructor() {
    this.apiKey = process.env.SYNTHESIA_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ SYNTHESIA_API_KEY not found in environment variables');
    }
  }

  /**
   * Generate realistic video avatar with Synthesia
   */
  async generateVideo(request: SynthesiaVideoRequest): Promise<SynthesiaVideoResponse> {
    try {
      console.log('🎬 Generating Synthesia video avatar...');

      if (!this.apiKey) {
        throw new Error('Synthesia API key not configured');
      }

      // Get avatar configuration
      const avatar = this.getAvatarConfig(request.avatarId);
      if (!avatar) {
        throw new Error(`Avatar not found: ${request.avatarId}`);
      }

      // Create video with Synthesia API
      const videoData = {
        test: true, // Use test mode for free tier
        input: [
          {
            avatarSettings: {
              horizontalAlign: "center",
              scale: 1,
              style: "rectangular",
              seamless: false
            },
            avatar: avatar.synthesia_id,
            scriptText: request.text,
            background: request.background || "soft_office",
            voice: request.voice_id || this.getDefaultVoice(avatar.gender)
          }
        ],
        title: `Interview Avatar - ${avatar.name}`,
        description: "AI Interview Assistant Video",
        visibility: "private",
        callbackId: `interview_${Date.now()}`
      };

      console.log('📤 Sending request to Synthesia API...');
      
      const response = await fetch(`${this.baseUrl}/videos`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(videoData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Synthesia API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      console.log('✅ Synthesia video creation initiated:', result.id);

      // Poll for completion
      const videoUrl = await this.pollForCompletion(result.id);

      return {
        success: true,
        videoUrl: videoUrl,
        videoId: result.id,
        status: 'complete'
      };

    } catch (error) {
      console.error('❌ Synthesia video generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'failed'
      };
    }
  }

  /**
   * Poll Synthesia API until video is ready
   */
  private async pollForCompletion(videoId: string): Promise<string | undefined> {
    const maxAttempts = 30; // 5 minutes max
    const pollInterval = 10000; // 10 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        console.log(`🔄 Polling Synthesia video status (${attempt + 1}/${maxAttempts})...`);
        
        const response = await fetch(`${this.baseUrl}/videos/${videoId}`, {
          headers: {
            'Authorization': this.apiKey,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`);
        }

        const status = await response.json();
        console.log('📊 Video status:', status.status);

        if (status.status === 'complete' && status.download) {
          console.log('🎉 Synthesia video ready!');
          return status.download;
        }

        if (status.status === 'failed') {
          throw new Error('Video generation failed');
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));

      } catch (error) {
        console.error('❌ Error polling video status:', error);
        if (attempt === maxAttempts - 1) {
          throw error;
        }
      }
    }

    throw new Error('Video generation timed out');
  }

  /**
   * Get avatar configuration by ID
   */
  private getAvatarConfig(avatarId: string): SynthesiaAvatarConfig | undefined {
    return SYNTHESIA_AVATARS.find(avatar => avatar.id === avatarId);
  }

  /**
   * Get default voice based on gender
   */
  private getDefaultVoice(gender: string): string {
    return gender === 'female' ? 'af-ZA-female-1' : 'en-US-male-2';
  }

  /**
   * Get available avatars
   */
  getAvailableAvatars(): SynthesiaAvatarConfig[] {
    return SYNTHESIA_AVATARS;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; service: string; hasApiKey: boolean }> {
    return {
      status: this.apiKey ? 'ready' : 'missing-api-key',
      service: 'synthesia-avatar-service',
      hasApiKey: !!this.apiKey
    };
  }
}

// Factory function
export function createSynthesiaAvatarService(): SynthesiaAvatarService {
  return new SynthesiaAvatarService();
}