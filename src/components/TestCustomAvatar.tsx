'use client';

import React from 'react';
import CustomAvatarPlayer from './CustomAvatarPlayer';

export default function TestCustomAvatar() {
  const testAvatarData = {
    avatarImage: '/avatars/sarah-professional.png',
    animation: 'greeting' as const,
    duration: 5,
    audioUrl: undefined
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Custom Avatar Test</h2>
      <div className="w-80">
        <CustomAvatarPlayer
          avatarData={testAvatarData}
          message="Hello! This is a test of the custom avatar system."
          isLoading={false}
          className="w-full"
        />
      </div>
    </div>
  );
}