'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AudioRecorder, transcribeAudio, formatDuration, checkAudioSupport } from '@/lib/audio-utils';
import { AudioRecording, TranscriptionResult } from '@/types/interview';
import { INTERVIEW_CONFIG } from '@/lib/config';

interface VoiceRecorderProps {
  question: string;
  onRecordingComplete: (transcript: string, audioUrl: string) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({ 
  question, 
  onRecordingComplete, 
  disabled = false 
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [audioSupport, setAudioSupport] = useState<ReturnType<typeof checkAudioSupport> | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const recorderRef = useRef<AudioRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  // Initialize audio support check
  useEffect(() => {
    const support = checkAudioSupport();
    setAudioSupport(support);
    
    if (!support.mediaRecorder || !support.audioContext || !support.getUserMedia) {
      setError('Audio recording not supported in this browser');
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (recorderRef.current?.isRecording()) {
        recorderRef.current.stopRecording();
      }
    };
  }, []);

  const requestPermission = async () => {
    if (!recorderRef.current) {
      recorderRef.current = new AudioRecorder();
    }
    
    const permission = await recorderRef.current.requestMicrophonePermission();
    setHasPermission(permission);
    
    if (!permission) {
      setError('Microphone permission required for voice recording');
    }
    
    return permission;
  };

  const updateAudioLevel = useCallback(() => {
    if (recorderRef.current && isRecording) {
      const level = recorderRef.current.getAudioLevel();
      setAudioLevel(level);
      animationRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [isRecording]);

  const startRecording = async () => {
    setError(null);
    
    // Check permission first
    if (hasPermission === null) {
      const granted = await requestPermission();
      if (!granted) return;
    } else if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    try {
      if (!recorderRef.current) {
        recorderRef.current = new AudioRecorder();
      }

      await recorderRef.current.startRecording();
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 100;
          
          // Auto-stop at max duration
          if (newDuration >= INTERVIEW_CONFIG.maxRecordingDuration) {
            stopRecording();
          }
          
          return newDuration;
        });
      }, 100);

      // Start audio level animation
      updateAudioLevel();
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError(error instanceof Error ? error.message : 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current || !isRecording) return;

    try {
      setIsProcessing(true);
      
      // Stop timer and animation
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      const recording = await recorderRef.current.stopRecording();
      setIsRecording(false);
      setAudioLevel(0);

      // Check minimum duration
      if (duration < INTERVIEW_CONFIG.minRecordingDuration) {
        setError(`Recording too short. Minimum ${INTERVIEW_CONFIG.minRecordingDuration / 1000} seconds required.`);
        setIsProcessing(false);
        return;
      }

      // Transcribe audio
      try {
        const transcription = await transcribeAudio(recording.blob);
        
        if (transcription.text.trim()) {
          onRecordingComplete(transcription.text, recording.url);
        } else {
          setError('No speech detected. Please try recording again.');
        }
      } catch (transcriptionError) {
        console.error('Transcription failed:', transcriptionError);
        setError('Failed to transcribe audio. Please try again.');
      }
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setError('Failed to process recording');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRecordingButtonText = () => {
    if (isProcessing) return 'Processing...';
    if (isRecording) return 'Stop Recording';
    return 'Start Recording';
  };

  const getRecordingButtonIcon = () => {
    if (isProcessing) {
      return (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
      );
    }
    
    if (isRecording) {
      return (
        <div className="w-4 h-4 bg-white rounded-sm"></div>
      );
    }
    
    return (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
      </svg>
    );
  };

  if (!audioSupport) {
    return (
      <div className="text-center p-6">
        <p className="text-gray-600">Loading audio recorder...</p>
      </div>
    );
  }

  if (error && !audioSupport.mediaRecorder) {
    return (
      <div className="text-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 font-medium">Audio recording not supported</p>
          <p className="text-red-500 text-sm mt-1">
            Please use a modern browser like Chrome, Firefox, or Safari
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      {/* Question Display */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Interview Question</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-gray-800">{question}</p>
        </div>
      </div>

      {/* Audio Visualizer */}
      {isRecording && (
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-2 h-16">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className="bg-red-500 rounded-full"
                style={{
                  width: '4px',
                  height: `${20 + (audioLevel * 40)}px`,
                  opacity: 0.3 + (audioLevel * 0.7),
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recording Controls */}
      <div className="text-center space-y-4">
        {/* Duration Display */}
        {(isRecording || duration > 0) && (
          <div className="text-2xl font-mono font-bold text-gray-900">
            {formatDuration(duration)}
          </div>
        )}

        {/* Record Button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isProcessing || (error !== null && !hasPermission)}
          className={`
            flex items-center justify-center space-x-3 px-8 py-4 rounded-full font-medium text-white transition-all duration-200
            ${isRecording 
              ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
              : 'bg-blue-600 hover:bg-blue-700'
            }
            ${(disabled || isProcessing) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {getRecordingButtonIcon()}
          <span>{getRecordingButtonText()}</span>
        </button>

        {/* Permission Request */}
        {hasPermission === false && (
          <button
            onClick={requestPermission}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Grant Microphone Permission
          </button>
        )}

        {/* Instructions */}
        <div className="text-sm text-gray-600 space-y-1">
          <p>Click to start recording your response</p>
          <p>Maximum recording time: {INTERVIEW_CONFIG.maxRecordingDuration / 1000} seconds</p>
          <p>Minimum recording time: {INTERVIEW_CONFIG.minRecordingDuration / 1000} seconds</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        </div>
      )}
    </div>
  );
}