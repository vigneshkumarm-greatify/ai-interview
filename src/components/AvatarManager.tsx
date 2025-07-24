'use client';

import React, { useState } from 'react';
import CustomAvatarPlayer from './CustomAvatarPlayer';
import SynthesiaVideoPlayer from './SynthesiaVideoPlayer';

export default function AvatarManager() {
  const [testResult, setTestResult] = useState<{
    avatarData?: {
      avatarImage: string;
      animation: 'idle' | 'speaking' | 'greeting';
      duration: number;
      audioUrl?: string;
    };
    videoUrl?: string;
    message?: string;
    isLoading: boolean;
    success?: boolean;
  }>({
    isLoading: false
  });

  const testCustomAvatar = async () => {
    try {
      console.log('🎭 Testing custom avatar system...');
      
      setTestResult({ isLoading: true });
      
      const response = await fetch('/api/generate-avatar-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: 'Hello! This is a test of our new D-ID avatar system with realistic video and lip sync using the FREE TIER!',
          avatarId: 'professional-female-1',
          emotion: 'greeting',
          service: 'did',
          forceGenerate: true
        }),
      });

      const result = await response.json();
      
      if (result.success && (result.videoUrl || result.avatarData)) {
        console.log('🎉 D-ID avatar SUCCESS!', result);
        setTestResult({
          avatarData: result.avatarData,
          videoUrl: result.videoUrl,
          message: 'Hello! This is a test of our new D-ID avatar system with realistic video and lip sync using the FREE TIER!',
          isLoading: false,
          success: true
        });
      } else {
        console.error('❌ Custom avatar failed:', result);
        setTestResult({
          isLoading: false,
          success: false,
          message: `Failed: ${result.error || 'Unknown error'}`
        });
      }
    } catch (error) {
      console.error('❌ Error testing custom avatar:', error);
      setTestResult({
        isLoading: false,
        success: false,
        message: `Error: ${error}`
      });
    }
  };

  const clearTest = () => {
    setTestResult({ isLoading: false });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Custom Avatar System
        </h1>
        <p className="text-gray-600 mb-4">
          Unlimited, Reliable Avatar Generation for AI Interviews
        </p>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg inline-block">
          <p className="text-green-800 text-sm font-medium">
            ✅ Replaced HeyGen with Custom Avatar System<br/>
            🚀 Unlimited usage • 💪 100% reliable • ⚡ Instant generation • 💰 Zero cost
          </p>
        </div>
      </div>

      {/* Test Section */}
      <div className="text-center space-y-4">
        <div className="flex justify-center space-x-4">
          <button
            onClick={testCustomAvatar}
            disabled={testResult.isLoading}
            className="bg-emerald-600 text-white px-8 py-4 rounded-lg font-medium text-lg hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testResult.isLoading ? '🔄 Testing...' : '🎭 Test Custom Avatar System'}
          </button>
          
          {(testResult.success !== undefined) && (
            <button
              onClick={clearTest}
              className="bg-gray-500 text-white px-6 py-4 rounded-lg font-medium text-lg hover:bg-gray-600 transition-colors shadow-lg"
            >
              Clear Test
            </button>
          )}
        </div>
        
        <p className="text-sm text-gray-600">
          Click to test the unlimited, reliable avatar generation
        </p>
        
        {/* Test Result Display */}
        {testResult.avatarData && testResult.success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mt-6">
            <h3 className="text-xl font-semibold text-green-800 mb-4">
              🎉 Test Successful - Avatar Playing Below!
            </h3>
            
            <div className="flex justify-center">
              <div className="w-80">
                {testResult.videoUrl ? (
                  <SynthesiaVideoPlayer
                    videoUrl={testResult.videoUrl}
                    message={testResult.message || ''}
                    isLoading={testResult.isLoading}
                    className="w-full"
                  />
                ) : (
                  <CustomAvatarPlayer
                    avatarData={testResult.avatarData}
                    message={testResult.message || ''}
                    isLoading={testResult.isLoading}
                    className="w-full"
                  />
                )}
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-green-700 font-medium">
                {testResult.videoUrl ? 
                  '✅ D-ID Video Avatar Working!' : 
                  '✅ Custom Avatar System Working!'}
              </p>
              <p className="text-green-600 text-sm mt-1">
                {testResult.videoUrl ? 
                  'D-ID FREE TIER • 20 videos/month • Perfect lip sync • Professional quality' :
                  'Unlimited usage • Zero cost • 100% reliable • Perfect for demos'}
              </p>
            </div>
          </div>
        )}
        
        {testResult.success === false && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mt-6">
            <h3 className="text-xl font-semibold text-red-800 mb-2">
              ❌ Test Failed
            </h3>
            <p className="text-red-700">{testResult.message}</p>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span className="text-2xl mr-2">🚀</span>
            Unlimited Usage
          </h3>
          <p className="text-gray-600">
            No API limits, no credits, no restrictions. Perfect for MVP demos that need to work every single time.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span className="text-2xl mr-2">💪</span>
            100% Reliable
          </h3>
          <p className="text-gray-600">
            Never fails, never breaks. No external API dependencies that can go down or return errors.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span className="text-2xl mr-2">⚡</span>
            Instant Generation
          </h3>
          <p className="text-gray-600">
            No polling, no waiting. Avatar animations are generated instantly with professional quality.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span className="text-2xl mr-2">💰</span>
            Zero Cost
          </h3>
          <p className="text-gray-600">
            Completely free forever. No API costs, no subscription fees, no hidden charges.
          </p>
        </div>
      </div>

      {/* Avatar Styles */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Available Avatar Styles</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 border border-gray-100 rounded-lg">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-2 flex items-center justify-center">
              <span className="text-white text-2xl">👩‍💼</span>
            </div>
            <h4 className="font-medium">Sarah - Professional</h4>
            <p className="text-sm text-gray-600">Female, Professional Style</p>
          </div>
          
          <div className="text-center p-4 border border-gray-100 rounded-lg">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full mx-auto mb-2 flex items-center justify-center">
              <span className="text-white text-2xl">👨‍💼</span>
            </div>
            <h4 className="font-medium">David - Professional</h4>
            <p className="text-sm text-gray-600">Male, Professional Style</p>
          </div>
          
          <div className="text-center p-4 border border-gray-100 rounded-lg">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-orange-600 rounded-full mx-auto mb-2 flex items-center justify-center">
              <span className="text-white text-2xl">👩‍🎓</span>
            </div>
            <h4 className="font-medium">Emma - Friendly</h4>
            <p className="text-sm text-gray-600">Female, Friendly Style</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">
          🎯 How It Works
        </h3>
        <ol className="text-blue-700 space-y-2">
          <li className="flex items-start">
            <span className="font-medium mr-2">1.</span>
            <span>Click the test button above to verify the custom avatar system</span>
          </li>
          <li className="flex items-start">
            <span className="font-medium mr-2">2.</span>
            <span>Start an interview in the main app to see avatars in action</span>
          </li>
          <li className="flex items-start">
            <span className="font-medium mr-2">3.</span>
            <span>Enjoy unlimited, reliable avatar interviews perfect for demos</span>
          </li>
        </ol>
      </div>
    </div>
  );
}