'use client';

import React, { useState, useRef } from 'react';
import DIDStreamingPlayer from '@/components/DIDStreamingPlayer';

export default function StreamingTestPage() {
  const [message, setMessage] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const playerRef = useRef<HTMLVideoElement>(null);

  const avatarImageUrl = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face';

  const handleSendMessage = async () => {
    if (!message.trim() || !playerRef.current || !isReady) return;

    setIsSending(true);
    try {
      // Use the exposed sendMessage method from the player component
      const success = await (playerRef.current as any).sendMessage(message.trim());
      
      if (success) {
        console.log('✅ Message sent successfully');
        setMessage(''); // Clear input after successful send
      } else {
        setError('Failed to send message to avatar');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleTestMessages = async () => {
    const testMessages = [
      "Hello! Welcome to our AI voice interview platform.",
      "I'm your virtual interviewer. Let's begin with a simple question.",
      "Can you tell me about your professional background?",
      "That's great! What technologies do you enjoy working with?",
      "Thank you for sharing. This concludes our test session."
    ];

    for (const msg of testMessages) {
      setMessage(msg);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      if (playerRef.current && isReady) {
        await (playerRef.current as any).sendMessage(msg);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between messages
      }
    }
    
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">D-ID Streaming Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Player */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Live Avatar Stream</h2>
            
            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
              <DIDStreamingPlayer
                ref={playerRef}
                avatarImageUrl={avatarImageUrl}
                onReady={() => {
                  console.log('🎉 Stream is ready!');
                  setIsReady(true);
                  setError(null);
                }}
                onError={(err) => {
                  console.error('Stream error:', err);
                  setError(err);
                  setIsReady(false);
                }}
                className="w-full h-full"
              />
            </div>
            
            {/* Status indicators */}
            <div className="flex items-center justify-between text-sm">
              <div className={`flex items-center ${isReady ? 'text-green-600' : 'text-gray-600'}`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${isReady ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                {isReady ? 'Ready for messages' : 'Initializing...'}
              </div>
              
              {error && (
                <div className="text-red-600 text-xs">
                  ❌ {error}
                </div>
              )}
            </div>
          </div>
          
          {/* Controls */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Message Controls</h2>
            
            {/* Manual message input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send Message to Avatar
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                disabled={!isReady}
              />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || !isReady || isSending}
                className="mt-2 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  'Send Message'
                )}
              </button>
            </div>
            
            {/* Quick test buttons */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-700">Quick Tests</h3>
              
              <button
                onClick={() => setMessage("Hello! This is a test of the D-ID streaming lip-sync technology.")}
                disabled={!isReady}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm"
              >
                Load Test Message
              </button>
              
              <button
                onClick={handleTestMessages}
                disabled={!isReady || isSending}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 text-sm"
              >
                Run Full Test Sequence
              </button>
              
              <button
                onClick={() => {
                  if (playerRef.current) {
                    (playerRef.current as any).closeStream();
                  }
                }}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 text-sm"
              >
                Close Stream
              </button>
            </div>
            
            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Wait for "Ready for messages" status</li>
                <li>• Type a message and click "Send Message"</li>
                <li>• Watch the avatar speak with lip-sync</li>
                <li>• Use "Run Full Test Sequence" for automated testing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}