// D-ID Avatar Service - More reliable alternative to HeyGen
export interface DIDConfig {
  avatarImageUrl: string; // Static image of the avatar
  voice?: {
    type: 'text' | 'audio';
    voice_id?: string;
    speed?: number;
  };
}

export interface DIDStreamConfig {
  source_url: string;
  driver_url?: string;
  config?: {
    stitch?: boolean;
    fluent?: boolean;
  };
}

export interface DIDStreamResponse {
  success: boolean;
  streamId?: string;
  sessionId?: string;
  offerSdp?: string;
  error?: string;
}

export interface DIDVideoRequest {
  text: string;
  avatarImageUrl: string;
  voiceId?: string;
}

export interface DIDVideoResponse {
  success: boolean;
  videoUrl?: string;
  duration?: number;
  error?: string;
  talkId?: string;
}

export class DIDVideoService {
  private apiKey: string;
  private baseUrl = 'https://api.d-id.com';

  constructor(apiKey: string) {
    // API key is already in correct format: username:password (no additional encoding needed)
    this.apiKey = apiKey;
  }

  /**
   * Create a streaming session for real-time avatar video
   */
  async createStream(config: DIDStreamConfig): Promise<DIDStreamResponse> {
    try {
      console.log('🎬 Creating D-ID streaming session...');

      const payload = {
        source_url: config.source_url,
        driver_url: config.driver_url,
        config: config.config || { stitch: true, fluent: true }
      };

      console.log('📤 D-ID Stream Request:', JSON.stringify(payload, null, 2));

      const response = await fetch(`${this.baseUrl}/talks/streams`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('📥 D-ID Stream Response:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(`D-ID Stream API error: ${response.status} - ${JSON.stringify(data)}`);
      }

      return {
        success: true,
        streamId: data.id,
        sessionId: data.session_id,
        offerSdp: data.offer?.sdp
      };

    } catch (error) {
      console.error('❌ D-ID stream creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send SDP answer to establish WebRTC connection
   */
  async sendStreamSDP(streamId: string, answerSdp: string): Promise<boolean> {
    try {
      console.log('🔗 Sending SDP answer for stream:', streamId);

      const response = await fetch(`${this.baseUrl}/talks/streams/${streamId}/sdp`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answer: {
            type: 'answer',
            sdp: answerSdp
          }
        })
      });

      const data = await response.json();
      console.log('📥 SDP Response:', JSON.stringify(data, null, 2));

      return response.ok;

    } catch (error) {
      console.error('❌ SDP submission failed:', error);
      return false;
    }
  }

  /**
   * Send ICE candidate for WebRTC connection
   */
  async sendICECandidate(streamId: string, candidate: RTCIceCandidate): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/talks/streams/${streamId}/ice`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex
        })
      });

      return response.ok;

    } catch (error) {
      console.error('❌ ICE candidate submission failed:', error);
      return false;
    }
  }

  /**
   * Send message to streaming avatar
   */
  async sendStreamMessage(streamId: string, text: string, voiceId?: string): Promise<boolean> {
    try {
      console.log('💬 Sending message to stream:', streamId);

      const payload = {
        script: {
          type: 'text',
          input: text,
          provider: {
            type: 'microsoft',
            voice_id: voiceId || 'en-US-JennyNeural'
          }
        }
      };

      const response = await fetch(`${this.baseUrl}/talks/streams/${streamId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('📥 Stream Message Response:', JSON.stringify(data, null, 2));

      return response.ok;

    } catch (error) {
      console.error('❌ Stream message failed:', error);
      return false;
    }
  }

  /**
   * Close streaming session
   */
  async closeStream(streamId: string): Promise<boolean> {
    try {
      console.log('🔚 Closing stream:', streamId);

      const response = await fetch(`${this.baseUrl}/talks/streams/${streamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${this.apiKey}`
        }
      });

      return response.ok;

    } catch (error) {
      console.error('❌ Stream closure failed:', error);
      return false;
    }
  }

  /**
   * Generate talking avatar video with D-ID
   */
  async generateVideo(request: DIDVideoRequest): Promise<DIDVideoResponse> {
    try {
      console.log('🎬 Generating video with D-ID API...');

      const payload = {
        script: {
          type: 'text',
          input: request.text,
          provider: {
            type: 'microsoft',
            voice_id: request.voiceId || 'en-US-JennyNeural'
          }
        },
        source_url: request.avatarImageUrl,
        config: {
          fluent: true,
          pad_audio: 0.0
        }
      };

      console.log('📤 D-ID Request:', JSON.stringify(payload, null, 2));

      const response = await fetch(`${this.baseUrl}/talks`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('📥 D-ID Response:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(`D-ID API error: ${response.status} - ${JSON.stringify(data)}`);
      }

      // D-ID returns a talk ID for polling
      const talkId = data.id;
      
      if (!talkId) {
        throw new Error('No talk ID returned from D-ID');
      }

      console.log('✅ D-ID video generation started:', talkId);

      // Poll for completion
      const videoUrl = await this.pollForCompletion(talkId);

      return {
        success: true,
        videoUrl,
        duration: this.estimateDuration(request.text),
        talkId
      };

    } catch (error) {
      console.error('❌ D-ID video generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Poll D-ID API for video completion
   */
  private async pollForCompletion(talkId: string, maxAttempts = 30): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/talks/${talkId}`, {
          headers: {
            'Authorization': `Basic ${this.apiKey}`
          }
        });

        const data = await response.json();
        console.log(`⏳ D-ID polling attempt ${attempt + 1}:`, data.status);

        if (data.status === 'done' && data.result_url) {
          return data.result_url;
        }

        if (data.status === 'error') {
          throw new Error(`D-ID generation failed: ${data.error}`);
        }

        // Wait 2 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error('D-ID polling error:', error);
        throw error;
      }
    }

    throw new Error('D-ID video generation timeout');
  }

  /**
   * Get list of available D-ID presenters/avatars
   */
  async getAvailablePresenters(): Promise<any[]> {
    try {
      console.log('🎭 Fetching D-ID built-in presenters...');
      
      const response = await fetch(`${this.baseUrl}/clips/actors`, {
        headers: {
          'Authorization': `Basic ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`D-ID API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ D-ID presenters fetched:', data);
      
      return data || [];
    } catch (error) {
      console.error('❌ Failed to fetch D-ID presenters:', error);
      return [];
    }
  }

  /**
   * Estimate video duration based on text length
   */
  private estimateDuration(text: string): number {
    const wordCount = text.split(' ').length;
    return Math.max(2, Math.ceil(wordCount / 2.5)); // ~150 words per minute
  }
}

// Simple Avatar Service using static images + TTS (fallback option)
export class SimpleAvatarService {
  /**
   * Create animated avatar using static image + audio
   */
  async generateSimpleAvatar(text: string, avatarImageUrl: string): Promise<DIDVideoResponse> {
    try {
      console.log('🎭 Creating simple animated avatar...');

      // For now, return the static image with audio instructions
      // This can be enhanced with CSS animations for mouth movement
      return {
        success: true,
        videoUrl: avatarImageUrl, // Return static image for now
        duration: this.estimateDuration(text),
        error: undefined
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private estimateDuration(text: string): number {
    const wordCount = text.split(' ').length;
    return Math.max(2, Math.ceil(wordCount / 2.5));
  }
}

// Factory function for D-ID service
export function createDIDService(): DIDVideoService | null {
  const apiKey = process.env.DID_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ DID_API_KEY not configured');
    return null;
  }
  return new DIDVideoService(apiKey);
}

// Factory function for simple avatar service (always available)
export function createSimpleAvatarService(): SimpleAvatarService {
  return new SimpleAvatarService();
}