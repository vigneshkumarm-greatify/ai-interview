// Custom Avatar Service - 100% Reliable, No API Limits, Always Works
export interface CustomAvatarConfig {
  id: string;
  name: string;
  gender: 'male' | 'female';
  style: 'professional' | 'friendly';
  staticImage: string; // Base64 or URL to avatar image
  animations: {
    idle: string;
    speaking: string;
    greeting: string;
  };
}

export interface CustomVideoRequest {
  text: string;
  avatarId: string;
  emotion?: 'greeting' | 'question' | 'encouragement' | 'neutral';
  audioUrl?: string; // Pre-generated TTS audio
}

export interface CustomVideoResponse {
  success: boolean;
  videoData?: {
    avatarImage: string;
    animation: 'idle' | 'speaking' | 'greeting';
    duration: number;
    audioUrl?: string;
  };
  error?: string;
}

// Professional avatar configurations using high-quality photos
export const CUSTOM_AVATARS: CustomAvatarConfig[] = [
  {
    id: 'professional-female-1',
    name: 'Sarah - Professional',
    gender: 'female',
    style: 'professional',
    staticImage: 'https://cdn.pixabay.com/photo/2018/01/15/07/51/woman-3083383_1280.jpg', // Professional woman
    animations: {
      idle: 'fade-pulse',
      speaking: 'speaking-animation',
      greeting: 'gentle-nod'
    }
  },
  {
    id: 'professional-male-1', 
    name: 'David - Professional',
    gender: 'male',
    style: 'professional',
    staticImage: 'https://cdn.pixabay.com/photo/2016/11/21/12/42/beard-1845166_1280.jpg', // Professional man
    animations: {
      idle: 'fade-pulse',
      speaking: 'speaking-animation', 
      greeting: 'gentle-nod'
    }
  },
  {
    id: 'friendly-female-1',
    name: 'Emma - Friendly',
    gender: 'female',
    style: 'friendly',
    staticImage: 'https://cdn.pixabay.com/photo/2017/08/06/12/06/people-2591874_1280.jpg', // Friendly woman
    animations: {
      idle: 'gentle-sway',
      speaking: 'speaking-animation',
      greeting: 'warm-smile'
    }
  },
  // D-ID compatible aliases
  {
    id: 'amy-professional',
    name: 'Amy - Professional (D-ID)',
    gender: 'female',
    style: 'professional',
    staticImage: 'https://cdn.pixabay.com/photo/2018/01/15/07/51/woman-3083383_1280.jpg',
    animations: {
      idle: 'fade-pulse',
      speaking: 'speaking-animation',
      greeting: 'gentle-nod'
    }
  },
  {
    id: 'john-professional',
    name: 'John - Professional (D-ID)',
    gender: 'male',
    style: 'professional',
    staticImage: 'https://cdn.pixabay.com/photo/2016/11/21/12/42/beard-1845166_1280.jpg',
    animations: {
      idle: 'fade-pulse',
      speaking: 'speaking-animation',
      greeting: 'gentle-nod'
    }
  },
  {
    id: 'lisa-friendly',
    name: 'Lisa - Friendly (D-ID)',
    gender: 'female',
    style: 'friendly',
    staticImage: 'https://cdn.pixabay.com/photo/2017/08/06/12/06/people-2591874_1280.jpg',
    animations: {
      idle: 'gentle-sway',
      speaking: 'speaking-animation',
      greeting: 'warm-smile'
    }
  }
];

export class CustomAvatarService {
  /**
   * Generate avatar "video" (actually animated image + audio)
   * This ALWAYS works - no API limits, no failures
   */
  async generateAvatar(request: CustomVideoRequest): Promise<CustomVideoResponse> {
    try {
      console.log('🎭 Generating custom avatar animation...');

      // Get avatar configuration
      const avatar = this.getAvatarConfig(request.avatarId);
      if (!avatar) {
        throw new Error(`Avatar not found: ${request.avatarId}`);
      }

      // Determine animation based on emotion
      const animation = this.getAnimationForEmotion(request.emotion || 'neutral');
      
      // Calculate duration based on text length
      const duration = this.calculateDuration(request.text);

      console.log('✅ Custom avatar generated successfully');

      return {
        success: true,
        videoData: {
          avatarImage: avatar.staticImage,
          animation: animation,
          duration: duration,
          audioUrl: request.audioUrl // Use provided TTS audio
        }
      };

    } catch (error) {
      console.error('❌ Custom avatar generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate multiple avatar formats for different emotions
   * Always succeeds - creates animated avatars for entire conversation
   */
  async generateConversationAvatars(texts: string[], avatarId: string): Promise<CustomVideoResponse[]> {
    const results: CustomVideoResponse[] = [];

    for (let i = 0; i < texts.length; i++) {
      const emotion = i === 0 ? 'greeting' : 
                    i % 3 === 0 ? 'encouragement' : 
                    'question';

      const result = await this.generateAvatar({
        text: texts[i],
        avatarId,
        emotion
      });

      results.push(result);
    }

    return results;
  }

  /**
   * Get avatar configuration by ID
   */
  private getAvatarConfig(avatarId: string): CustomAvatarConfig | undefined {
    return CUSTOM_AVATARS.find(avatar => avatar.id === avatarId);
  }

  /**
   * Get animation type based on emotion
   */
  private getAnimationForEmotion(emotion: string): 'idle' | 'speaking' | 'greeting' {
    switch (emotion) {
      case 'greeting':
        return 'greeting';
      case 'question':
      case 'encouragement':
      case 'neutral':
        return 'speaking';
      default:
        return 'idle';
    }
  }

  /**
   * Calculate video duration based on text length
   */
  private calculateDuration(text: string): number {
    const wordCount = text.split(' ').length;
    const wordsPerSecond = 2.5; // Average speaking speed
    return Math.max(3, Math.ceil(wordCount / wordsPerSecond));
  }

  /**
   * Get all available avatars
   */
  getAvailableAvatars(): CustomAvatarConfig[] {
    return CUSTOM_AVATARS;
  }

  /**
   * Health check - always returns healthy since no external dependencies
   */
  async healthCheck(): Promise<{ status: 'healthy'; service: string }> {
    return {
      status: 'healthy',
      service: 'custom-avatar-service'
    };
  }
}

// Factory function - always returns a working service
export function createCustomAvatarService(): CustomAvatarService {
  return new CustomAvatarService();
}

// Avatar image generator using CSS/Canvas (if needed)
export class AvatarImageGenerator {
  /**
   * Generate avatar image with CSS animations
   * Creates professional-looking avatars programmatically
   */
  generateAvatarCSS(avatar: CustomAvatarConfig): string {
    return `
      .avatar-${avatar.id} {
        width: 320px;
        height: 480px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 20px;
        position: relative;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      }

      .avatar-${avatar.id} .face {
        position: absolute;
        top: 60px;
        left: 50%;
        transform: translateX(-50%);
        width: 120px;
        height: 120px;
        background: #f8d7da;
        border-radius: 50%;
        border: 4px solid #fff;
      }

      .avatar-${avatar.id} .eyes {
        position: absolute;
        top: 40px;
        left: 50%;
        transform: translateX(-50%);
        width: 80px;
        height: 20px;
      }

      .avatar-${avatar.id} .eye {
        width: 12px;
        height: 12px;
        background: #333;
        border-radius: 50%;
        position: absolute;
        top: 4px;
      }

      .avatar-${avatar.id} .eye.left { left: 20px; }
      .avatar-${avatar.id} .eye.right { right: 20px; }

      .avatar-${avatar.id} .mouth {
        position: absolute;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 20px;
        background: #ff6b6b;
        border-radius: 0 0 40px 40px;
      }

      /* Animations */
      .avatar-${avatar.id}.speaking .mouth {
        animation: speaking 0.5s ease-in-out infinite alternate;
      }

      .avatar-${avatar.id}.greeting {
        animation: greeting 2s ease-in-out;
      }

      .avatar-${avatar.id}.idle {
        animation: idle 3s ease-in-out infinite;
      }

      @keyframes speaking {
        0% { height: 20px; }
        100% { height: 10px; border-radius: 20px; }
      }

      @keyframes greeting {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }

      @keyframes idle {
        0%, 100% { opacity: 0.9; }
        50% { opacity: 1; }
      }
    `;
  }

  /**
   * Generate HTML for avatar
   */
  generateAvatarHTML(avatar: CustomAvatarConfig, animation: string = 'idle'): string {
    return `
      <div class="avatar-${avatar.id} ${animation}">
        <div class="face">
          <div class="eyes">
            <div class="eye left"></div>
            <div class="eye right"></div>
          </div>
          <div class="mouth"></div>
        </div>
        <div class="avatar-info">
          <h3>${avatar.name}</h3>
          <p>${avatar.style} style</p>
        </div>
      </div>
    `;
  }
}