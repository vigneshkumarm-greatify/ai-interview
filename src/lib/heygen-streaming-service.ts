// HeyGen Streaming API Service for real-time avatar responses
// This uses HeyGen's streaming API which might work better for interviews

export interface StreamingAvatarConfig {
  avatarId: string;
  quality?: 'low' | 'medium' | 'high';
  voice?: {
    voiceId: string;
    rate?: number;
    emotion?: string;
  };
}

export interface StreamingSession {
  sessionId: string;
  streamUrl: string;
  status: 'connecting' | 'ready' | 'streaming' | 'ended' | 'error';
}

export class HeyGenStreamingService {
  private apiKey: string;
  private baseUrl = 'https://api.heygen.com/v1/streaming.new';
  private sessionId?: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Create a new streaming session
   */
  async createSession(config: StreamingAvatarConfig): Promise<StreamingSession> {
    try {
      console.log('🎥 Creating HeyGen streaming session...');

      // HeyGen streaming API requires simpler payload
      const payload = {
        quality: config.quality || 'medium',
        avatar_name: config.avatarId,
        voice: {
          voice_id: config.voice?.voiceId || '1bd001e7e50f421d891986aad5158bc8'
        }
      };

      console.log('📤 Streaming request:', JSON.stringify(payload, null, 2));

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('📥 Streaming response:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(`HeyGen streaming error: ${response.status} - ${JSON.stringify(data)}`);
      }

      // Extract session details from response
      const sessionId = data.data?.session_id || data.session_id;
      const streamUrl = data.data?.url || data.url || data.ice_servers?.[0]?.url;

      if (!sessionId) {
        throw new Error('No session ID returned from HeyGen');
      }

      this.sessionId = sessionId;

      return {
        sessionId,
        streamUrl: streamUrl || '',
        status: 'ready'
      };

    } catch (error) {
      console.error('❌ Failed to create streaming session:', error);
      throw error;
    }
  }

  /**
   * Send text to the avatar for speech
   */
  async sendText(text: string): Promise<void> {
    if (!this.sessionId) {
      throw new Error('No active streaming session');
    }

    try {
      console.log('💬 Sending text to avatar:', text);

      const response = await fetch(`https://api.heygen.com/v1/streaming.task`, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: this.sessionId,
          text: text
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Failed to send text: ${response.status} - ${JSON.stringify(data)}`);
      }

      console.log('✅ Text sent successfully');

    } catch (error) {
      console.error('❌ Failed to send text:', error);
      throw error;
    }
  }

  /**
   * Start the streaming session
   */
  async startStreaming(): Promise<void> {
    if (!this.sessionId) {
      throw new Error('No active streaming session');
    }

    try {
      console.log('▶️ Starting streaming...');

      const response = await fetch(`https://api.heygen.com/v1/streaming.start`, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: this.sessionId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Failed to start streaming: ${response.status} - ${JSON.stringify(data)}`);
      }

      console.log('✅ Streaming started');

    } catch (error) {
      console.error('❌ Failed to start streaming:', error);
      throw error;
    }
  }

  /**
   * Stop the streaming session
   */
  async stopStreaming(): Promise<void> {
    if (!this.sessionId) {
      return;
    }

    try {
      console.log('⏹️ Stopping streaming...');

      const response = await fetch(`https://api.heygen.com/v1/streaming.stop`, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: this.sessionId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to stop streaming:', response.status, data);
      }

      this.sessionId = undefined;
      console.log('✅ Streaming stopped');

    } catch (error) {
      console.error('❌ Error stopping streaming:', error);
    }
  }

  /**
   * Create a simple avatar video using the template API
   */
  async createSimpleVideo(text: string, avatarId: string): Promise<{ videoUrl?: string; error?: string }> {
    try {
      console.log('🎬 Creating simple avatar video...');

      // Try using the template API which might be simpler
      const payload = {
        test: true,
        caption: false,
        title: text,
        variables: {
          text: text
        },
        template_id: 'default_template' // Use a default template
      };

      console.log('📤 Template request:', JSON.stringify(payload, null, 2));

      const response = await fetch('https://api.heygen.com/v2/template/generate', {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('📥 Template response:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        return { error: `Template API error: ${response.status} - ${JSON.stringify(data)}` };
      }

      const videoId = data.data?.video_id || data.video_id;
      if (!videoId) {
        return { error: 'No video ID returned' };
      }

      // Poll for completion
      const videoUrl = await this.pollForVideo(videoId);
      return { videoUrl };

    } catch (error) {
      console.error('❌ Failed to create simple video:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Poll for video completion
   */
  private async pollForVideo(videoId: string, maxAttempts = 20): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
          headers: {
            'X-API-KEY': this.apiKey
          }
        });

        const data = await response.json();
        console.log(`⏳ Poll attempt ${i + 1}:`, data.data?.status || data.status);

        if (data.data?.status === 'completed' && data.data?.video_url) {
          return data.data.video_url;
        }

        if (data.data?.status === 'failed') {
          throw new Error('Video generation failed');
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error('Polling error:', error);
        throw error;
      }
    }

    throw new Error('Video generation timeout');
  }
}

// Factory function
export function createStreamingService(): HeyGenStreamingService | null {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ HEYGEN_API_KEY not configured');
    return null;
  }
  return new HeyGenStreamingService(apiKey);
}