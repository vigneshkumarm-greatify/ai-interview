export interface VoiceSettings {
  emotion: 'greeting' | 'question' | 'encouragement' | 'conclusion' | 'neutral';
  speed?: number; // 0.5 to 2.0
  volume?: number; // 0 to 1
}

export class VoiceManager {
  private audioElement: HTMLAudioElement | null = null;
  private audioQueue: Array<{ audio: string; onComplete?: () => void }> = [];
  private isPlaying = false;

  async speak(text: string, settings: VoiceSettings): Promise<void> {
    try {
      // Start TTS request immediately
      const ttsPromise = fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          emotion: settings.emotion
        })
      });

      // Don't wait for TTS to complete, start processing immediately
      ttsPromise.then(async (response) => {
        try {
          const result = await response.json();
          
          if (result.success && result.audio) {
            // Play audio immediately when ready
            await this.playAudio(result.audio, settings);
          }
        } catch (error) {
          console.error('TTS processing failed:', error);
        }
      }).catch(error => {
        console.error('TTS request failed:', error);
      });

      // Return immediately to prevent blocking the UI
      return Promise.resolve();
      
    } catch (error) {
      console.error('Voice synthesis failed:', error);
      // Continue without voice
    }
  }

  private async playAudio(base64Audio: string, settings: VoiceSettings): Promise<void> {
    return new Promise((resolve) => {
      // Add to queue
      this.audioQueue.push({
        audio: base64Audio,
        onComplete: resolve
      });

      // Process queue if not already playing
      if (!this.isPlaying) {
        this.processAudioQueue(settings);
      }
    });
  }

  private async processAudioQueue(settings: VoiceSettings): Promise<void> {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const { audio, onComplete } = this.audioQueue.shift()!;

    try {
      // Create audio element
      const audioBlob = this.base64ToBlob(audio, 'audio/mp3');
      const audioUrl = URL.createObjectURL(audioBlob);
      
      this.audioElement = new Audio(audioUrl);
      this.audioElement.volume = settings.volume || 0.8;
      this.audioElement.playbackRate = settings.speed || 1.0;

      this.audioElement.onended = () => {
        URL.revokeObjectURL(audioUrl);
        if (onComplete) onComplete();
        this.processAudioQueue(settings);
      };

      this.audioElement.onerror = (error) => {
        console.error('Audio playback error:', error);
        URL.revokeObjectURL(audioUrl);
        if (onComplete) onComplete();
        this.processAudioQueue(settings);
      };

      await this.audioElement.play();
      
    } catch (error) {
      console.error('Failed to play audio:', error);
      if (onComplete) onComplete();
      this.processAudioQueue(settings);
    }
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  pause(): void {
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
    }
  }

  resume(): void {
    if (this.audioElement && this.audioElement.paused) {
      this.audioElement.play();
    }
  }

  stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    this.audioQueue = [];
    this.isPlaying = false;
  }

  setVolume(volume: number): void {
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, volume));
    }
  }
}

// Singleton instance
let voiceManagerInstance: VoiceManager | null = null;

export function getVoiceManager(): VoiceManager {
  if (!voiceManagerInstance) {
    voiceManagerInstance = new VoiceManager();
  }
  return voiceManagerInstance;
}

// Helper function to determine emotion based on text content
export function detectEmotion(text: string, context: 'greeting' | 'question' | 'response' | 'conclusion'): VoiceSettings['emotion'] {
  const lowerText = text.toLowerCase();
  
  switch (context) {
    case 'greeting':
      return 'greeting';
    
    case 'question':
      if (lowerText.includes('challenging') || lowerText.includes('difficult')) {
        return 'encouragement';
      }
      return 'question';
    
    case 'response':
      if (lowerText.includes('great') || lowerText.includes('excellent')) {
        return 'encouragement';
      }
      return 'neutral';
    
    case 'conclusion':
      return 'conclusion';
    
    default:
      return 'neutral';
  }
}