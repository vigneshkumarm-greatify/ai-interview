'use client';

import React, { useState, useRef, useEffect } from 'react';

export default function LiveInterviewPage() {
  const [userVideo, setUserVideo] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAIResponding, setIsAIResponding] = useState(false);
  const [currentAIVideo, setCurrentAIVideo] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Array<{type: 'user' | 'ai', text: string, timestamp: Date}>>([]);
  const [selectedAvatar, setSelectedAvatar] = useState('professional-female-1');
  
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const aiVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const avatars = [
    { id: 'professional-female-1', name: 'Sarah - Professional', preview: 'https://cdn.pixabay.com/photo/2018/01/15/07/51/woman-3083383_1280.jpg' },
    { id: 'professional-male-1', name: 'James - Professional', preview: 'https://cdn.pixabay.com/photo/2016/11/21/12/42/beard-1845166_1280.jpg' },
    { id: 'friendly-female-1', name: 'Emma - Friendly', preview: 'https://cdn.pixabay.com/photo/2017/08/06/12/06/people-2591874_1280.jpg' }
  ];

  const currentAvatar = avatars.find(a => a.id === selectedAvatar) || avatars[0];

  // Initialize user webcam
  useEffect(() => {
    const initWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 }, 
          audio: true 
        });
        setUserVideo(stream);
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('❌ Failed to access webcam:', error);
      }
    };

    initWebcam();

    return () => {
      if (userVideo) {
        userVideo.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Start recording user response
  const startRecording = async () => {
    if (!userVideo) return;

    setIsRecording(true);
    audioChunksRef.current = [];

    try {
      const mediaRecorder = new MediaRecorder(userVideo);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        processUserResponse();
      };

      mediaRecorder.start(100);
      console.log('🎤 Recording started...');
    } catch (error) {
      console.error('❌ Recording failed:', error);
      setIsRecording(false);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('🛑 Recording stopped');
    }
  };

  // Process user response and generate AI reply
  const processUserResponse = async () => {
    if (audioChunksRef.current.length === 0) return;

    try {
      // Convert audio to text
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', audioBlob);

      console.log('🎯 Converting speech to text...');
      const transcriptResponse = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData
      });

      const transcriptData = await transcriptResponse.json();
      
      if (!transcriptData.success) {
        throw new Error('Speech recognition failed');
      }

      const userText = transcriptData.text;
      console.log('📝 User said:', userText);

      // Add user message to conversation
      setConversation(prev => [...prev, {
        type: 'user',
        text: userText,
        timestamp: new Date()
      }]);

      // Show AI is responding (with animated indicator)
      setIsAIResponding(true);
      setCurrentAIVideo(null);

      // Generate AI response text
      const aiResponse = await generateAIResponse(userText);
      
      // Add AI response to conversation
      setConversation(prev => [...prev, {
        type: 'ai',
        text: aiResponse,
        timestamp: new Date()
      }]);

      // Generate AI avatar video in background
      await generateAIVideo(aiResponse);

    } catch (error) {
      console.error('❌ Failed to process response:', error);
      setIsAIResponding(false);
    }
  };

  // Generate AI response text
  const generateAIResponse = async (userInput: string): Promise<string> => {
    try {
      const response = await fetch('/api/analyze-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: userInput,
          context: 'interview'
        })
      });

      const data = await response.json();
      return data.aiResponse || "Thank you for sharing that. Can you tell me more about your experience?";
    } catch (error) {
      return "That's interesting. Could you elaborate on that point?";
    }
  };

  // Generate AI avatar video
  const generateAIVideo = async (text: string) => {
    try {
      console.log('🎬 Generating AI avatar video...');

      const response = await fetch('/api/generate-avatar-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          avatarId: selectedAvatar,
          emotion: 'neutral',
          service: 'did'
        })
      });

      const data = await response.json();
      
      if (data.success && data.videoUrl) {
        console.log('✅ AI video ready, switching from indicator to video');
        setCurrentAIVideo(data.videoUrl);
        setIsAIResponding(false);
      } else {
        console.error('❌ Video generation failed:', data.error);
        setIsAIResponding(false);
      }

    } catch (error) {
      console.error('❌ AI video generation error:', error);
      setIsAIResponding(false);
    }
  };

  // Animated speaking indicator component
  const SpeakingIndicator = () => (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-blue-600 to-purple-600 text-white">
      <img 
        src={currentAvatar.preview}
        alt={currentAvatar.name}
        className="w-32 h-32 rounded-full mb-6 object-cover border-4 border-white shadow-lg"
      />
      
      {/* Animated speaking indicator */}
      <div className="flex space-x-1 mb-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-2 h-8 bg-white rounded-full animate-pulse"
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: '0.8s'
            }}
          />
        ))}
      </div>
      
      <p className="text-sm opacity-90 animate-pulse">
        {currentAvatar.name} is responding...
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 shadow-lg">
        <h1 className="text-2xl font-bold text-center">🎯 Live AI Interview</h1>
        <p className="text-center text-gray-300 mt-1">Real-time conversation with AI interviewer</p>
      </div>

      <div className="flex flex-col lg:flex-row h-screen">
        {/* Left Panel - User Video */}
        <div className="lg:w-1/2 p-4">
          <div className="bg-gray-800 rounded-lg p-4 h-full">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              📹 You
              {isRecording && (
                <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full animate-pulse">
                  🔴 RECORDING
                </span>
              )}
            </h2>
            
            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
              <video
                ref={userVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>

            {/* Recording Controls */}
            <div className="flex gap-2 justify-center">
              <button
                onClick={startRecording}
                disabled={isRecording || isAIResponding}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
              >
                {isRecording ? '🎤 Recording...' : '🎤 Start Answer'}
              </button>
              
              <button
                onClick={stopRecording}
                disabled={!isRecording}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium"
              >
                ⏹️ Stop
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - AI Avatar */}
        <div className="lg:w-1/2 p-4">
          <div className="bg-gray-800 rounded-lg p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">🤖 AI Interviewer</h2>
              
              {/* Avatar Selector */}
              <select
                value={selectedAvatar}
                onChange={(e) => setSelectedAvatar(e.target.value)}
                className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
                disabled={isAIResponding}
              >
                {avatars.map(avatar => (
                  <option key={avatar.id} value={avatar.id}>
                    {avatar.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
              {isAIResponding ? (
                <SpeakingIndicator />
              ) : currentAIVideo ? (
                <video
                  ref={aiVideoRef}
                  src={currentAIVideo}
                  autoPlay
                  controls={false}
                  className="w-full h-full object-cover"
                  onEnded={() => setCurrentAIVideo(null)}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-700 to-gray-800">
                  <div className="text-center">
                    <img 
                      src={currentAvatar.preview}
                      alt={currentAvatar.name}
                      className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-gray-600"
                    />
                    <p className="text-gray-300">{currentAvatar.name}</p>
                    <p className="text-sm text-gray-400 mt-2">Ready to interview you</p>
                  </div>
                </div>
              )}
            </div>

            {/* AI Status */}
            <div className="text-center">
              {isAIResponding && (
                <p className="text-blue-400 text-sm animate-pulse">
                  🎬 Generating response video...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Conversation Log */}
      <div className="fixed bottom-4 right-4 w-80 max-h-60 bg-gray-800 rounded-lg p-4 overflow-y-auto">
        <h3 className="font-semibold mb-2">💬 Conversation</h3>
        <div className="space-y-2 text-sm">
          {conversation.map((msg, index) => (
            <div key={index} className={`p-2 rounded ${
              msg.type === 'user' ? 'bg-blue-600' : 'bg-green-600'
            }`}>
              <span className="font-medium">
                {msg.type === 'user' ? 'You' : 'AI'}: 
              </span>
              <span className="ml-1">{msg.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}