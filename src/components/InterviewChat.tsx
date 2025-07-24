'use client';

import React, { useState, useEffect, useRef } from 'react';
import { InterviewQuestion, ParsedResume } from '@/types/interview';
import { ConversationalInterviewer } from '@/lib/conversational-interviewer';
import VoiceRecorder from './VoiceRecorder';
import RoleSelection from './RoleSelection';
import AvatarSettings from './AvatarSettings';
import SynthesiaVideoPlayer from './SynthesiaVideoPlayer';
import { getVoiceManager, VoiceSettings } from '@/lib/voice-manager';
import { CUSTOM_AVATARS } from '@/lib/custom-avatar-service';

interface Message {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  videoUrl?: string;
  error?: string;
  isGeneratingVideo?: boolean;
}

interface InterviewChatProps {
  resume: ParsedResume;
  onInterviewComplete: (responses: Array<{questionId: string, transcript: string, audioUrl: string, question: string, score?: number, feedback?: string}>) => void;
}

export default function InterviewChat({ resume, onInterviewComplete }: InterviewChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [roleSelected, setRoleSelected] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [avatarSelected, setAvatarSelected] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState(CUSTOM_AVATARS[0].id);
  const [useVideoMode, setUseVideoMode] = useState(true);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [responses, setResponses] = useState<Array<{questionId: string, transcript: string, audioUrl: string, question: string, score?: number, feedback?: string}>>([]);
  const [progress, setProgress] = useState({ current: 0, total: 8, percentage: 0 });
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentQuestionText, setCurrentQuestionText] = useState('');
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  
  const interviewerRef = useRef<ConversationalInterviewer | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceManagerRef = useRef(getVoiceManager());
  const lastResponseRef = useRef<string>('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      voiceManagerRef.current.stop();
    };
  }, []);

  const addMessage = async (type: 'ai' | 'user', content: string, audioUrl?: string, speakMessage = false, emotion: VoiceSettings['emotion'] = 'neutral') => {
    const messageId = Date.now().toString();
    const message: Message = {
      id: messageId,
      type,
      content,
      timestamp: new Date(),
      audioUrl,
      isGeneratingVideo: type === 'ai' && useVideoMode && speakMessage
    };
    
    setMessages(prev => [...prev, message]);
    
    // If AI message and video mode is enabled, generate video
    if (type === 'ai' && speakMessage && useVideoMode) {
      // Stop any currently playing message
      setPlayingMessageId(null);
      // Generate new avatar video
      generateAvatarVideo(content, emotion, messageId);
    }
    
    // If AI message and speech is enabled (but not video), speak it with audio
    if (type === 'ai' && speakMessage && !useVideoMode) {
      setIsAISpeaking(true);
      // Don't await - let it speak in background to reduce delay
      voiceManagerRef.current.speak(content, {
        emotion,
        volume,
        speed: 1.0
      }).finally(() => {
        setIsAISpeaking(false);
      });
    }
  };

  const generateAvatarVideo = async (text: string, emotion: VoiceSettings['emotion'], messageId: string) => {
    try {
      setIsGeneratingVideo(true);
      console.log('🎬 Generating avatar video for message:', messageId);

      const response = await fetch('/api/generate-avatar-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          avatarId: selectedAvatarId,
          emotion,
          service: 'did' // Use D-ID for realistic video lip sync (FREE TIER)
        }),
      });

      const result = await response.json();

      if (result.success && result.videoUrl) {
        // Update the message with video URL
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                videoUrl: result.videoUrl,
                isGeneratingVideo: false 
              }
            : msg
        ));
        
        // Set this message as the currently playing one
        setPlayingMessageId(messageId);
        console.log('✅ D-ID avatar generated successfully');
      } else {
        // Show error message
        console.error('❌ D-ID avatar generation failed:', result.error);
        
        // Update message to show error
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                isGeneratingVideo: false,
                error: result.error || 'D-ID video generation failed'
              }
            : msg
        ));
        
        // If API key is missing, show setup instructions
        if (result.requiresApiKey) {
          alert('D-ID API key not configured!\n\n1. Sign up at d-id.com\n2. Get your API key\n3. Add DID_API_KEY to your .env.local file\n4. Restart the server');
        }
      }
    } catch (error) {
      console.error('❌ Avatar video generation error:', error);
      // Update message to show error
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              isGeneratingVideo: false,
              error: 'Failed to generate D-ID video'
            }
          : msg
      ));
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const fallbackToAudio = async (text: string, emotion: VoiceSettings['emotion'], messageId: string) => {
    // Update message to remove video loading state
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isGeneratingVideo: false }
        : msg
    ));

    // Play audio instead
    setIsAISpeaking(true);
    try {
      await voiceManagerRef.current.speak(text, {
        emotion,
        volume,
        speed: 1.0
      });
    } finally {
      setIsAISpeaking(false);
    }
  };

  const handleRoleSelected = (role: string, description: string) => {
    setSelectedRole(role);
    setRoleDescription(description);
    setRoleSelected(true);
  };

  const handleAvatarSelected = (avatarId: string) => {
    setSelectedAvatarId(avatarId);
    setAvatarSelected(true);
  };

  const startInterview = async () => {
    try {
      interviewerRef.current = new ConversationalInterviewer(resume, selectedRole, roleDescription);
      setInterviewStarted(true);
      
      // AI greeting message with voice
      const greetingMessage = `Hello ${resume.personalInfo.name}! I'm excited to interview you today for the ${selectedRole} position. I've reviewed your resume and I'm looking forward to learning more about your experience. Let's begin!`;
      await addMessage('ai', greetingMessage, undefined, true, 'greeting');
      
      // Ask first question after greeting
      setTimeout(() => {
        askNextQuestion();
      }, 3000); // Give more time for greeting to be heard and processed
      
    } catch (error) {
      console.error('Failed to start interview:', error);
      await addMessage('ai', 'I apologize, but there was an issue starting the interview. Please try again.');
    }
  };

  const askNextQuestion = async () => {
    if (!interviewerRef.current) return;
    
    try {
      const { question, shouldEnd } = await interviewerRef.current.generateNextQuestion(lastResponseRef.current);
      
      if (shouldEnd) {
        // Interview complete
        await addMessage('ai', question, undefined, true, 'conclusion');
        setTimeout(() => completeInterview(), 2000);
        return;
      }
      
      setCurrentQuestionText(question);
      setProgress(interviewerRef.current.getProgress());
      
      // Add question as AI message with voice
      await addMessage('ai', question, undefined, true, 'question');
      setIsWaitingForResponse(true);
      
    } catch (error) {
      console.error('Failed to generate next question:', error);
      await addMessage('ai', 'Let me think of another question for you.');
      setTimeout(() => askNextQuestion(), 1000);
    }
  };

  const handleRecordingComplete = async (transcript: string, audioUrl: string) => {
    if (!interviewerRef.current) return;
    
    // Add user response to chat (no voice for user messages)
    await addMessage('user', transcript, audioUrl);
    
    // Save response and update reference
    const newResponse = {
      questionId: Date.now().toString(),
      transcript,
      audioUrl,
      question: currentQuestionText
    };
    setResponses(prev => [...prev, newResponse]);
    lastResponseRef.current = transcript;
    
    setIsWaitingForResponse(false);
    setIsAnalyzing(true);
    
    // Show "analyzing response" indicator for realistic thinking time
    console.log('🤔 Starting to analyze user response...');
    
    // Analyze the response in the background
    analyzeResponse(transcript, currentQuestionText);
    
    // Realistic delay to analyze the response (2-4 seconds)
    const analysisDelay = Math.random() * 2000 + 2000; // 2-4 seconds
    setTimeout(() => {
      console.log('🎯 Analysis complete, generating next question...');
      setIsAnalyzing(false);
      askNextQuestion();
    }, analysisDelay);
  };

  const analyzeResponse = async (transcript: string, question: string) => {
    try {
      console.log('📊 Analyzing response for scoring...');
      
      const response = await fetch('/api/analyze-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript,
          question,
          role: selectedRole,
          resumeContext: {
            name: resume.personalInfo.name,
            experience: resume.experience.map(exp => `${exp.role} at ${exp.company}`).join(', '),
            skills: resume.skills
          }
        }),
      });

      if (response.ok) {
        const analysis = await response.json();
        if (analysis.success) {
          // Update the last response with analysis data
          setResponses(prev => {
            const updated = [...prev];
            if (updated.length > 0) {
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                score: analysis.score,
                feedback: analysis.feedback
              };
            }
            return updated;
          });
          console.log('✅ Response analysis completed:', analysis.score);
        }
      }
    } catch (error) {
      console.error('❌ Failed to analyze response:', error);
    }
  };

  const completeInterview = async () => {
    // Complete interview after a delay
    setTimeout(() => {
      onInterviewComplete(responses);
    }, 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Show role selection first
  if (!roleSelected) {
    return <RoleSelection onRoleSelected={handleRoleSelected} />;
  }

  // Show avatar selection after role is selected
  if (!avatarSelected) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Select Your AI Interviewer
          </h2>
          <p className="text-gray-600">
            Choose the avatar that will conduct your {selectedRole} interview
          </p>
        </div>
        
        <AvatarSettings 
          selectedAvatarId={selectedAvatarId}
          onAvatarSelected={handleAvatarSelected}
        />
        
        <div className="text-center mt-8">
          <button
            onClick={() => setAvatarSelected(true)}
            disabled={!selectedAvatarId}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Interview
          </button>
        </div>
      </div>
    );
  }

  // Show interview start screen
  if (!interviewStarted) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="text-center space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Ready for Your {selectedRole} Interview?
            </h2>
            
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              I'll be conducting your {selectedRole} interview today. This will be a dynamic, conversational interview 
              where I'll ask follow-up questions based on your responses and dive deep into your experience.
            </p>
            
            <div className="bg-white rounded-lg p-4 mb-6 max-w-md mx-auto">
              <h3 className="font-semibold text-gray-900 mb-2">Interview Features:</h3>
              <ul className="text-sm text-gray-600 space-y-1 text-left">
                <li>• 🎬 Talking AI interviewer with realistic video avatar</li>
                <li>• 💬 Dynamic, conversational flow with follow-ups</li>
                <li>• 🎯 Questions tailored to your resume and experience</li>
                <li>• 🔄 Audio fallback if video generation fails</li>
                <li>• 📊 Real-time response analysis and scoring</li>
                <li>• ⚡ ~8 questions with intelligent adaptation</li>
              </ul>
            </div>
            
            <button
              onClick={startInterview}
              className="bg-blue-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-blue-700 transition-colors text-lg shadow-lg hover:shadow-xl"
            >
              🎙️ Start {selectedRole} Interview
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Progress Bar and Voice Controls */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Question {progress.current} of {progress.total}
          </span>
          <div className="flex items-center space-x-4">
            {/* Video Mode Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-600">
                {useVideoMode ? 'Video' : 'Audio'}
              </span>
              <button
                onClick={() => setUseVideoMode(!useVideoMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  useVideoMode ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useVideoMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* AI Speaking/Video Generating Indicator */}
            {(isAISpeaking || isGeneratingVideo) && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
                <span className="text-xs">
                  {isGeneratingVideo ? 'Generating Video...' : 'AI Speaking...'}
                </span>
              </div>
            )}
            
            {/* Volume Control */}
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12 6a1 1 0 011.414 0A4.024 4.024 0 0115 10a4.024 4.024 0 01-1.586 3.414 1 1 0 01-1.414-1.414A2.024 2.024 0 0013 10a2.024 2.024 0 00-1-1.414A1 1 0 0112 6z" clipRule="evenodd" />
              </svg>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => {
                  const newVolume = parseFloat(e.target.value);
                  setVolume(newVolume);
                  voiceManagerRef.current.setVolume(newVolume);
                }}
                className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <span className="text-sm text-gray-500">
              {Math.round(progress.percentage)}% Complete
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="bg-white rounded-xl shadow-lg mb-6">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Interview Chat</h3>
        </div>
        
        <div className="p-6 max-h-96 overflow-y-auto space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="space-y-4">
              {message.type === 'ai' ? (
                // AI message with video avatar
                <div className="flex justify-start">
                  <div className="max-w-md">
                    {message.error ? (
                      // Show error state
                      <div className="w-64 h-80 bg-red-50 border-2 border-red-200 rounded-lg flex flex-col items-center justify-center p-4">
                        <div className="text-red-500 mb-4">
                          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-red-800 font-semibold mb-2">D-ID Video Failed</h3>
                        <p className="text-red-600 text-sm text-center">{message.error}</p>
                        <div className="mt-4 text-xs text-gray-600 text-center">
                          <p>Audio-only mode active</p>
                        </div>
                      </div>
                    ) : message.videoUrl ? (
                      // D-ID video with real lip sync
                      <SynthesiaVideoPlayer
                        videoUrl={message.videoUrl}
                        message={message.content}
                        isLoading={message.isGeneratingVideo}
                        className="w-64 h-80"
                        autoPlay={true}
                        shouldPlay={playingMessageId === message.id}
                        onVideoEnded={() => {
                          if (playingMessageId === message.id) {
                            setPlayingMessageId(null);
                          }
                        }}
                      />
                    ) : (
                      // Loading state
                      <div className="w-64 h-80 bg-gray-100 border-2 border-gray-200 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                          <p className="text-sm text-gray-600">Generating D-ID video...</p>
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2 text-center">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ) : (
                // User message (text only)
                <div className="flex justify-end">
                  <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-2xl bg-blue-600 text-white">
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-blue-200">
                        {formatTime(message.timestamp)}
                      </span>
                      {message.audioUrl && (
                        <button
                          onClick={() => {
                            const audio = new Audio(message.audioUrl);
                            audio.play();
                          }}
                          className="ml-2 p-1 rounded-full hover:bg-opacity-20 hover:bg-white"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Voice Recorder */}
      {isWaitingForResponse && currentQuestionText && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <VoiceRecorder
            question="Your turn to respond:"
            onRecordingComplete={handleRecordingComplete}
          />
        </div>
      )}

      {/* AI Analyzing Indicator */}
      {isAnalyzing && (
        <div className="flex justify-start mb-4">
          <div className="bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-2xl max-w-xs">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <span className="text-xs text-yellow-600">Analyzing your response...</span>
            </div>
          </div>
        </div>
      )}

      {/* AI Thinking Indicator - only show when not analyzing and not waiting for response */}
      {!isWaitingForResponse && !isAnalyzing && interviewStarted && progress.current < progress.total && (
        <div className="flex justify-start mb-4">
          <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-2xl max-w-xs">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <span className="text-xs text-blue-600">
                {Math.random() > 0.5 
                  ? "Analyzing your response..." 
                  : "Thinking of a follow-up question..."}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}