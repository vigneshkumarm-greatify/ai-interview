'use client';

import React, { useState, useRef, useEffect } from 'react';

interface CustomAvatarPlayerProps {
  avatarData?: {
    avatarImage: string;
    animation: 'idle' | 'speaking' | 'greeting';
    duration: number;
    audioUrl?: string;
  };
  message: string;
  isLoading?: boolean;
  onVideoEnded?: () => void;
  onVideoError?: () => void;
  className?: string;
  autoPlay?: boolean; // Control whether to auto-start
  shouldPlay?: boolean; // External control for playback
}

export default function CustomAvatarPlayer({
  avatarData,
  message,
  isLoading = false,
  onVideoEnded,
  onVideoError,
  className = '',
  autoPlay = true,
  shouldPlay = true
}: CustomAvatarPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentAnimation, setCurrentAnimation] = useState<'idle' | 'speaking' | 'greeting'>('idle');
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-play when avatar data is provided (controllable)
  useEffect(() => {
    if (avatarData && !hasError && autoPlay && shouldPlay) {
      playAvatar();
    }
  }, [avatarData, hasError, autoPlay, shouldPlay]);

  // Stop playing if shouldPlay becomes false
  useEffect(() => {
    if (!shouldPlay && isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      setCurrentAnimation('idle');
    }
  }, [shouldPlay, isPlaying]);

  const playAvatar = async () => {
    if (!avatarData) return;
    
    try {
      setIsPlaying(true);
      setCurrentAnimation(avatarData.animation);
      
      // Play audio if available
      if (avatarData.audioUrl && audioRef.current) {
        audioRef.current.volume = volume;
        
        // Start lip sync when audio actually starts playing
        audioRef.current.onplaying = () => {
          console.log('🎵 Audio started - beginning lip sync');
          setIsPlaying(true);
          setCurrentAnimation('speaking');
        };
        
        // Stop lip sync when audio ends
        audioRef.current.onended = () => {
          console.log('🎵 Audio ended - stopping lip sync');
          handleAvatarEnded();
        };
        
        // Stop lip sync if audio pauses
        audioRef.current.onpause = () => {
          console.log('⏸️ Audio paused - pausing lip sync');
          setCurrentAnimation('idle');
        };
        
        await audioRef.current.play();
        console.log('🔊 Playing avatar audio with lip sync');
      } else {
        console.log('🎭 Playing avatar animation only (no audio)');
        // Auto-end after duration if no audio
        animationTimeoutRef.current = setTimeout(() => {
          handleAvatarEnded();
        }, avatarData.duration * 1000);
      }
      
    } catch (error) {
      console.error('Avatar playback failed:', error);
      handleAvatarError();
    }
  };

  const handleAvatarError = () => {
    console.log('📱 Avatar error, continuing with animation');
    setHasError(true);
    setIsPlaying(false);
    onVideoError?.();
  };

  const handleAvatarEnded = () => {
    setIsPlaying(false);
    setCurrentAnimation('idle');
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    onVideoEnded?.();
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current && avatarData?.audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        setCurrentAnimation('idle');
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
      } else {
        playAvatar();
      }
    }
  };

  // Generate avatar styles based on animation
  const getAvatarStyles = () => {
    const baseStyles = `
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
      border-radius: 20px;
      overflow: hidden;
      transition: all 0.3s ease;
    `;

    const animationStyles = {
      idle: 'transform: scale(1); opacity: 0.95;',
      speaking: 'transform: scale(1.02); opacity: 1;',
      greeting: 'transform: scale(1.05); opacity: 1;'
    };

    return baseStyles + animationStyles[currentAnimation];
  };

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Avatar Container */}
      <div className="relative aspect-[3/4] bg-gradient-to-b from-blue-900 to-blue-950">
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-sm">Preparing avatar...</p>
            </div>
          </div>
        )}

        {/* Custom Avatar Display */}
        {avatarData && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Professional AI Avatar with Real Photo */}
            <div 
              className="w-48 h-64 rounded-2xl shadow-2xl transition-all duration-300 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                animation: isPlaying ? (
                  currentAnimation === 'speaking' ? 'speaking 0.5s ease-in-out infinite alternate' :
                  currentAnimation === 'greeting' ? 'greeting 2s ease-in-out' :
                  'idle 3s ease-in-out infinite'
                ) : 'none'
              }}
            >
              {/* Professional Avatar Image */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-44 h-60 rounded-xl overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200 shadow-inner">
                  {/* Professional headshot placeholder - using CSS to create realistic avatar */}
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-gray-100">
                    {/* Real Professional Photo Avatar */}
                    <img 
                      src={avatarData.avatarImage}
                      alt="Professional AI Interviewer"
                      className={`w-full h-full object-cover transition-all duration-500 ${
                        isPlaying && currentAnimation === 'speaking' ? 'scale-110' : 'scale-100'
                      }`}
                      style={{
                        filter: isPlaying && currentAnimation === 'speaking' 
                          ? 'brightness(1.15) contrast(1.1) saturate(1.1)' 
                          : 'brightness(1) contrast(1) saturate(1)',
                        objectPosition: 'center top'
                      }}
                      onError={(e) => {
                        // Fallback to a default professional avatar if image fails to load
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=600&fit=crop&crop=face&auto=format&q=80';
                      }}
                    />
                    
                    {/* Professional Speaking Animation Overlay */}
                    {isPlaying && currentAnimation === 'speaking' && (
                      <div className="absolute inset-0">
                        {/* Subtle speaking glow */}
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent rounded-xl animate-pulse"></div>
                        
                        {/* Professional sound visualization */}
                        <div className="absolute bottom-6 right-6 flex space-x-1">
                          <div className="w-1 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms', animationDuration: '0.6s'}}></div>
                          <div className="w-1 h-5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '100ms', animationDuration: '0.7s'}}></div>
                          <div className="w-1 h-4 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '200ms', animationDuration: '0.8s'}}></div>
                          <div className="w-1 h-6 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '300ms', animationDuration: '0.6s'}}></div>
                          <div className="w-1 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '400ms', animationDuration: '0.9s'}}></div>
                        </div>
                        
                        {/* Live indicator */}
                        <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center animate-pulse">
                          <div className="w-2 h-2 bg-white rounded-full mr-1 animate-ping"></div>
                          LIVE
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Professional Name Badge */}
              <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 backdrop-blur-sm text-gray-800 px-3 py-2 rounded-lg text-xs shadow-lg border border-gray-200">
                <div className="font-bold text-gray-900">AI Interview Assistant</div>
                <div className="text-blue-600 text-xs font-medium flex items-center">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>

            {/* Speaking Indicator */}
            {isPlaying && (
              <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                Speaking
              </div>
            )}
          </div>
        )}

        {/* Fallback Display */}
        {!avatarData && !isLoading && (
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
              className="w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors"
              disabled={isLoading || !avatarData}
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

            {/* Status */}
            <div className="text-xs text-gray-400">
              {isLoading ? 'Preparing...' : 
               avatarData ? 'Custom Avatar' : 'Ready'}
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-2">
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

      {/* Hidden Audio Element */}
      {avatarData?.audioUrl && (
        <audio
          ref={audioRef}
          src={avatarData.audioUrl}
          onEnded={handleAvatarEnded}
          preload="auto"
        />
      )}

      <style jsx>{`
        @keyframes speaking {
          0% { transform: scale(1); }
          100% { transform: scale(1.02); }
        }
        
        @keyframes greeting {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes idle {
          0%, 100% { opacity: 0.95; }
          50% { opacity: 1; }
        }
        
        /* Realistic Lip Sync Animation */
        .speaking-mouth .mouth-opening {
          animation: lipSync 0.3s ease-in-out infinite;
        }
        
        @keyframes lipSync {
          0% { 
            ry: 2; 
            cy: 106;
            opacity: 0.8;
          }
          25% { 
            ry: 5; 
            cy: 108;
            opacity: 1;
          }
          50% { 
            ry: 3; 
            cy: 107;
            opacity: 0.9;
          }
          75% { 
            ry: 6; 
            cy: 109;
            opacity: 1;
          }
          100% { 
            ry: 2; 
            cy: 106;
            opacity: 0.8;
          }
        }
        
        /* Jaw movement animation */
        .speaking-mouth {
          animation: jawMovement 0.4s ease-in-out infinite alternate;
        }
        
        @keyframes jawMovement {
          0% { 
            transform: translateY(0px);
          }
          100% { 
            transform: translateY(1px);
          }
        }
      `}</style>
    </div>
  );
}