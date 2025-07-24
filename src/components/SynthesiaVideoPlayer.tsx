'use client';

import React, { useState, useRef, useEffect } from 'react';

interface SynthesiaVideoPlayerProps {
  videoUrl?: string;
  message: string;
  isLoading?: boolean;
  onVideoEnded?: () => void;
  onVideoError?: () => void;
  className?: string;
  autoPlay?: boolean;
  shouldPlay?: boolean;
}

export default function SynthesiaVideoPlayer({
  videoUrl,
  message,
  isLoading = false,
  onVideoEnded,
  onVideoError,
  className = '',
  autoPlay = true,
  shouldPlay = true
}: SynthesiaVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-play when video URL is provided (controllable)
  useEffect(() => {
    if (videoUrl && !hasError && autoPlay && shouldPlay && videoRef.current) {
      playVideo();
    }
  }, [videoUrl, hasError, autoPlay, shouldPlay]);

  // Stop playing if shouldPlay becomes false
  useEffect(() => {
    if (!shouldPlay && isPlaying && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [shouldPlay, isPlaying]);

  const playVideo = async () => {
    if (!videoUrl || !videoRef.current) return;
    
    try {
      videoRef.current.volume = volume;
      await videoRef.current.play();
      setIsPlaying(true);
      console.log('🎬 Playing Synthesia video with real lip sync');
    } catch (error) {
      console.error('Video playback failed:', error);
      handleVideoError();
    }
  };

  const handleVideoError = () => {
    console.log('📱 Video error, notifying parent');
    setHasError(true);
    setIsPlaying(false);
    onVideoError?.();
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    onVideoEnded?.();
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setProgress(total > 0 ? (current / total) * 100 : 0);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        playVideo();
      }
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Video Container */}
      <div className="relative aspect-[3/4] bg-gradient-to-b from-blue-900 to-blue-950">
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-sm">Generating realistic video...</p>
              <p className="text-xs text-gray-400 mt-1">This may take 30-60 seconds</p>
            </div>
          </div>
        )}

        {/* Synthesia Video Display */}
        {videoUrl && !isLoading && (
          <div className="absolute inset-0">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-cover"
              onEnded={handleVideoEnded}
              onError={handleVideoError}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              playsInline
              muted={false}
            />
            
            {/* Video Overlay UI */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-50">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              
              {/* Live Indicator */}
              {isPlaying && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full mr-2 animate-ping"></div>
                  LIVE
                </div>
              )}
              
              {/* Synthesia Badge */}
              <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                Synthesia AI
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-80">
            <div className="text-center text-white">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm">Video generation failed</p>
              <p className="text-xs text-gray-300">Falling back to audio mode</p>
            </div>
          </div>
        )}

        {/* Fallback Display */}
        {!videoUrl && !isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-blue-900 to-blue-950">
            <div className="text-center text-white">
              <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-xs text-blue-200">AI Interviewer</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-gray-800 text-white">
        {/* Message Text */}
        <div className="mb-3">
          <p className="text-sm text-gray-200 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Player Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlayPause}
              className="w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors pointer-events-auto"
              disabled={isLoading || !videoUrl}
            >
              {isPlaying ? (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Status and Time */}
            <div className="text-xs text-gray-400">
              {isLoading ? 'Generating...' : 
               videoUrl ? `${formatTime(duration * (progress / 100))} / ${formatTime(duration)}` : 
               'Ready'}
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-2 pointer-events-auto">
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.78L4.91 13.31H3a1 1 0 01-1-1V7.69a1 1 0 011-1h1.91l3.473-3.47a1 1 0 011.617.78zM12 6.5a1 1 0 011.5 0 3.5 3.5 0 010 7 1 1 0 01-1.5 0 3.5 3.5 0 000-7z" clipRule="evenodd" />
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
}