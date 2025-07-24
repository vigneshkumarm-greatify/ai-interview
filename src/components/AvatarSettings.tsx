'use client';

import React, { useState } from 'react';
import { CUSTOM_AVATARS, CustomAvatarConfig } from '@/lib/custom-avatar-service';

interface AvatarSettingsProps {
  selectedAvatarId?: string;
  onAvatarSelected: (avatarId: string) => void;
  className?: string;
}

export default function AvatarSettings({
  selectedAvatarId,
  onAvatarSelected,
  className = ''
}: AvatarSettingsProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<CustomAvatarConfig | null>(
    CUSTOM_AVATARS.find(a => a.id === selectedAvatarId) || null
  );

  const handleAvatarSelect = (avatar: CustomAvatarConfig) => {
    setSelectedAvatar(avatar);
    onAvatarSelected(avatar.id);
  };

  const getStyleColor = (style: string) => {
    switch (style) {
      case 'professional':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'friendly':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getGenderIcon = (gender: string) => {
    if (gender === 'male') {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM7 9a1 1 0 012 0v2a1 1 0 11-2 0V9zm5-1a1 1 0 00-1 1v4a1 1 0 102 0v-1a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 00-1 1v1a1 1 0 11-2 0V9z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM7 9a1 1 0 012 0v2a1 1 0 11-2 0V9zm5-1a1 1 0 00-1 1v4a1 1 0 102 0v-1a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 00-1 1v1a1 1 0 11-2 0V9z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Choose Your AI Interviewer
        </h3>
        <p className="text-gray-600 text-sm">
          Select the avatar that will conduct your interview. Each interviewer has the same professional expertise.
        </p>
      </div>

      {/* Avatar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CUSTOM_AVATARS.map((avatar) => (
          <div
            key={avatar.id}
            onClick={() => handleAvatarSelect(avatar)}
            className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-lg ${
              selectedAvatar?.id === avatar.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            {/* Avatar Preview */}
            <div className="aspect-[3/4] bg-gradient-to-b from-blue-900 to-blue-950 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
              {/* Placeholder Avatar Icon */}
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              
              {/* Selected Overlay */}
              {selectedAvatar?.id === avatar.id && (
                <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Avatar Info */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 text-center">
                {avatar.name}
              </h4>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 justify-center">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStyleColor(avatar.style)}`}>
                  {avatar.style}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 flex items-center">
                  {getGenderIcon(avatar.gender)}
                  <span className="ml-1 capitalize">{avatar.gender}</span>
                </span>
              </div>
            </div>

            {/* Radio Button */}
            <div className="absolute top-2 right-2">
              <div className={`w-4 h-4 rounded-full border-2 ${
                selectedAvatar?.id === avatar.id
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 bg-white'
              }`}>
                {selectedAvatar?.id === avatar.id && (
                  <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Avatar Preview */}
      {selectedAvatar && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-blue-900">
                Selected: {selectedAvatar.name}
              </h4>
              <p className="text-sm text-blue-700">
                {selectedAvatar.style === 'professional' 
                  ? 'Formal, business-focused interview style'
                  : 'Warm, approachable conversation style'
                }
              </p>
            </div>
            <div className="text-blue-500">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Technical Note */}
      <div className="text-center text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
        <p>
          <strong>Note:</strong> Videos are generated in real-time using AI. If video generation fails, 
          the interview will automatically fall back to audio-only mode to ensure continuity.
        </p>
      </div>
    </div>
  );
}