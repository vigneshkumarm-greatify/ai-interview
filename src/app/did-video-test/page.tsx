'use client';

import React, { useState } from 'react';

export default function DIDVideoTestPage() {
  const [message, setMessage] = useState('Hello! This is a test of D-ID lip-sync technology.');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState('professional-female-1');

  const avatars = [
    { id: 'professional-female-1', name: 'Professional Female', preview: 'https://cdn.pixabay.com/photo/2018/01/15/07/51/woman-3083383_1280.jpg' },
    { id: 'professional-male-1', name: 'Professional Male', preview: 'https://cdn.pixabay.com/photo/2016/11/21/12/42/beard-1845166_1280.jpg' },
    { id: 'friendly-female-1', name: 'Friendly Female', preview: 'https://cdn.pixabay.com/photo/2017/08/06/12/06/people-2591874_1280.jpg' },
    { id: 'amy-professional', name: 'Amy Professional', preview: 'https://cdn.pixabay.com/photo/2018/01/15/07/51/woman-3083383_1280.jpg' },
    { id: 'john-professional', name: 'John Professional', preview: 'https://cdn.pixabay.com/photo/2016/11/21/12/42/beard-1845166_1280.jpg' },
    { id: 'lisa-friendly', name: 'Lisa Friendly', preview: 'https://cdn.pixabay.com/photo/2017/08/06/12/06/people-2591874_1280.jpg' }
  ];

  const generateVideo = async () => {
    if (!message.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);

    try {
      console.log('🎬 Generating D-ID video...');

      const response = await fetch('/api/generate-avatar-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message.trim(),
          avatarId: selectedAvatar,
          emotion: 'neutral',
          service: 'did'
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate video');
      }

      console.log('✅ Video generated:', data.videoUrl);
      setVideoUrl(data.videoUrl);

    } catch (err) {
      console.error('❌ Video generation failed:', err);
      setError(err instanceof Error ? err.message : 'Video generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const quickTests = [
    "Hello! Welcome to our AI voice interview platform.",
    "I'm your virtual interviewer. Let's begin with a simple question.",
    "Can you tell me about your professional background?",
    "What technologies do you enjoy working with?",
    "Thank you for sharing. This concludes our test session."
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">D-ID Video Generation Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Player */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Generated Video</h2>
            
            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
              {videoUrl ? (
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-cover"
                  onLoadedData={() => console.log('📺 Video loaded successfully')}
                  onError={() => setError('Failed to load video')}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {isGenerating ? (
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p className="text-sm">Generating lip-sync video...</p>
                    </div>
                  ) : (
                    <div className="text-white text-center">
                      <img 
                        src={avatars.find(a => a.id === selectedAvatar)?.preview} 
                        alt="Avatar" 
                        className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                      />
                      <p className="text-sm">Ready to generate video</p>
                      <p className="text-xs opacity-75">{avatars.find(a => a.id === selectedAvatar)?.name}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {error && (
              <div className="text-red-600 text-sm mb-4">
                ❌ {error}
              </div>
            )}
          </div>
          
          {/* Controls */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Message Controls</h2>
            
            {/* Message input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text for Avatar to Speak
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              <button
                onClick={generateVideo}
                disabled={!message.trim() || isGenerating}
                className="mt-2 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Video...
                  </>
                ) : (
                  'Generate Lip-Sync Video'
                )}
              </button>
            </div>
            
            {/* Quick test buttons */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700">Quick Tests:</h3>
              
              {quickTests.map((test, index) => (
                <button
                  key={index}
                  onClick={() => setMessage(test)}
                  className="w-full text-left bg-gray-100 hover:bg-gray-200 p-2 rounded text-sm transition-colors"
                >
                  {test}
                </button>
              ))}
            </div>
            
            {/* Avatar Selection */}
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 mb-2">Select Avatar:</h3>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                {avatars.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => {
                      setSelectedAvatar(avatar.id);
                      setVideoUrl(null); // Clear previous video
                      console.log('Selected avatar:', avatar.id);
                    }}
                    className={`flex items-center gap-3 p-3 rounded text-sm transition-colors ${
                      selectedAvatar === avatar.id 
                        ? 'bg-blue-100 border-2 border-blue-500' 
                        : 'bg-gray-100 hover:bg-gray-200 border-2 border-transparent'
                    }`}
                  >
                    <img 
                      src={avatar.preview} 
                      alt={avatar.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="font-medium">{avatar.name}</span>
                    {selectedAvatar === avatar.id && (
                      <span className="ml-auto text-blue-600 text-xs">✓ Selected</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Type your message or click a quick test</li>
                <li>• Click "Generate Lip-Sync Video"</li>
                <li>• Wait ~10 seconds for D-ID to generate</li>
                <li>• Video plays automatically with perfect lip-sync</li>
                <li>• Uses your working D-ID API (avatarId format)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}