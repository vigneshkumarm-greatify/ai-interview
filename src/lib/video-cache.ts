// Video cache system for common interview phrases to save API credits

interface CachedVideo {
  videoUrl: string;
  duration: number;
  timestamp: Date;
  avatarId: string;
  text: string;
}

// Common phrases that will be cached to save API calls
export const CACHEABLE_PHRASES = [
  // Greetings
  'Hello! I\'m excited to interview you today.',
  'Welcome to your interview!',
  'Thank you for joining me today.',
  
  // Acknowledgments
  'That\'s interesting!',
  'Great!',
  'I see.',
  'That sounds fascinating!',
  'Excellent!',
  'That\'s a good point.',
  'Interesting approach.',
  'I understand.',
  
  // Transitions
  'Let me ask you about something else.',
  'Moving on to the next topic.',
  'That\'s helpful context. Now,',
  'Building on that,',
  'Given your experience,',
  
  // Conclusions
  'Thank you for sharing that with me.',
  'That concludes our interview.',
  'I appreciate your time today.',
  'This has been very insightful.'
];

class VideoCache {
  private cache = new Map<string, CachedVideo>();
  private readonly CACHE_EXPIRY_HOURS = 24; // Cache videos for 24 hours
  private readonly MAX_CACHE_SIZE = 100; // Maximum number of cached videos

  /**
   * Generate cache key from text and avatar ID
   */
  private getCacheKey(text: string, avatarId: string): string {
    return `${avatarId}:${text.toLowerCase().trim()}`;
  }

  /**
   * Check if a phrase should be cached
   */
  isCacheable(text: string): boolean {
    const normalizedText = text.toLowerCase().trim();
    return CACHEABLE_PHRASES.some(phrase => 
      phrase.toLowerCase() === normalizedText
    );
  }

  /**
   * Get cached video if available and not expired
   */
  getCachedVideo(text: string, avatarId: string): CachedVideo | null {
    const key = this.getCacheKey(text, avatarId);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if expired
    const ageHours = (Date.now() - cached.timestamp.getTime()) / (1000 * 60 * 60);
    if (ageHours > this.CACHE_EXPIRY_HOURS) {
      this.cache.delete(key);
      console.log(`🗑️ Expired cached video removed: ${text.substring(0, 30)}...`);
      return null;
    }

    console.log(`🎯 Using cached video: ${text.substring(0, 30)}...`);
    return cached;
  }

  /**
   * Store video in cache
   */
  setCachedVideo(text: string, avatarId: string, videoUrl: string, duration: number): void {
    if (!this.isCacheable(text)) {
      return; // Don't cache non-common phrases
    }

    // Implement LRU cache - remove oldest if at capacity
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      console.log('🗑️ Removed oldest cached video to make space');
    }

    const key = this.getCacheKey(text, avatarId);
    const cachedVideo: CachedVideo = {
      videoUrl,
      duration,
      timestamp: new Date(),
      avatarId,
      text
    };

    this.cache.set(key, cachedVideo);
    console.log(`💾 Cached video: ${text.substring(0, 30)}... (${this.cache.size}/${this.MAX_CACHE_SIZE})`);
  }

  /**
   * Clear all cached videos
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Video cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const now = new Date();
    let expiredCount = 0;
    
    for (const [key, video] of this.cache.entries()) {
      const ageHours = (now.getTime() - video.timestamp.getTime()) / (1000 * 60 * 60);
      if (ageHours > this.CACHE_EXPIRY_HOURS) {
        expiredCount++;
      }
    }

    return {
      totalCached: this.cache.size,
      expiredCount,
      maxSize: this.MAX_CACHE_SIZE,
      expiryHours: this.CACHE_EXPIRY_HOURS
    };
  }

  /**
   * Clean up expired videos
   */
  cleanupExpired(): number {
    const now = new Date();
    const keysToDelete: string[] = [];
    
    for (const [key, video] of this.cache.entries()) {
      const ageHours = (now.getTime() - video.timestamp.getTime()) / (1000 * 60 * 60);
      if (ageHours > this.CACHE_EXPIRY_HOURS) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`🗑️ Cleaned up ${keysToDelete.length} expired cached videos`);
    }

    return keysToDelete.length;
  }

  /**
   * Pre-warm cache with common phrases for a specific avatar
   */
  async prewarmCache(avatarId: string, generateVideoFn: (text: string, avatarId: string) => Promise<{videoUrl?: string, duration?: number}>): Promise<void> {
    console.log(`🔥 Pre-warming cache for avatar ${avatarId}...`);
    
    // Pre-generate videos for most common phrases
    const highPriorityPhrases = CACHEABLE_PHRASES.slice(0, 5); // First 5 phrases
    
    for (const phrase of highPriorityPhrases) {
      if (!this.getCachedVideo(phrase, avatarId)) {
        try {
          const result = await generateVideoFn(phrase, avatarId);
          if (result.videoUrl && result.duration) {
            this.setCachedVideo(phrase, avatarId, result.videoUrl, result.duration);
          }
          
          // Small delay between requests to avoid API rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to pre-warm phrase: ${phrase}`, error);
        }
      }
    }
    
    console.log('✅ Cache pre-warming completed');
  }
}

// Singleton instance
let videoCacheInstance: VideoCache | null = null;

export function getVideoCache(): VideoCache {
  if (!videoCacheInstance) {
    videoCacheInstance = new VideoCache();
    
    // Clean up expired videos every hour
    setInterval(() => {
      videoCacheInstance?.cleanupExpired();
    }, 60 * 60 * 1000);
  }
  return videoCacheInstance;
}