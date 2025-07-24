'use client';

import React, { useState, useEffect } from 'react';

interface DIDVideoPlayerProps {
  avatarImageUrl: string;
  onReady?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function DIDVideoPlayer({ 
  avatarImageUrl, 
  onReady, 
  onError,
  className = '' 
}: DIDVideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateVideo = async (text: string, voiceId?: string) => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setVideoUrl(null);

    try {
      console.log('🎬 Generating D-ID video...');

      const response = await fetch('/api/generate-avatar-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          avatarImageUrl,
          voiceId: voiceId || 'en-US-JennyNeural'
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate video');
      }

      console.log('✅ Video generated:', data.videoUrl);
      setVideoUrl(data.videoUrl);
      onReady?.();

    } catch (error) {
      console.error('❌ Video generation failed:', error);
      onError?.(error instanceof Error ? error.message : 'Video generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  // Expose generateVideo method to parent
  useEffect(() => {
    (window as any).generateDIDVideo = generateVideo;
  }, []);

  return (
    <div className={`relative ${className}`}>
      {videoUrl ? (
        <video
          src={videoUrl}
          controls
          autoPlay
          className="w-full h-full object-cover rounded-lg"
          onLoadedData={() => console.log('📺 Video loaded successfully')}
          onError={() => onError?.('Failed to load video')}
        />
      ) : (
        <div className="w-full h-full bg-black rounded-lg flex items-center justify-center">
          {isGenerating ? (
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-sm">Generating lip-sync video...</p>
            </div>
          ) : (
            <div className="text-white text-center">
              <img 
                src={avatarImageUrl} 
                alt="Avatar" 
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
              />
              <p className="text-sm">Ready to generate video</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}