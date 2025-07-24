'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface DIDStreamingPlayerProps {
  avatarImageUrl: string;
  onReady?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

interface StreamConnection {
  streamId: string;
  peerConnection: RTCPeerConnection;
  isConnected: boolean;
}

export default function DIDStreamingPlayer({ 
  avatarImageUrl, 
  onReady, 
  onError,
  className = '' 
}: DIDStreamingPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [connection, setConnection] = useState<StreamConnection | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  /**
   * Initialize D-ID streaming connection
   */
  const initializeStream = useCallback(async () => {
    if (isInitializing || connection?.isConnected) return;
    
    setIsInitializing(true);
    setConnectionStatus('connecting');

    try {
      console.log('🎬 Initializing D-ID streaming...');

      // Step 1: Create stream session
      const streamResponse = await fetch('/api/did-stream/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_url: avatarImageUrl,
          config: { stitch: true, fluent: true }
        })
      });

      const streamData = await streamResponse.json();
      
      if (!streamData.success) {
        throw new Error(streamData.error || 'Failed to create stream');
      }

      console.log('✅ Stream created:', streamData.streamId);

      // Step 2: Setup WebRTC peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Handle incoming video stream
      peerConnection.ontrack = (event) => {
        console.log('📺 Received video stream');
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          setConnectionStatus('connected');
          onReady?.();
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          console.log('🧊 Sending ICE candidate');
          await fetch('/api/did-stream/ice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              streamId: streamData.streamId,
              candidate: {
                candidate: event.candidate.candidate,
                sdpMid: event.candidate.sdpMid,
                sdpMLineIndex: event.candidate.sdpMLineIndex
              }
            })
          });
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('🔗 Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'failed') {
          setConnectionStatus('error');
          onError?.('WebRTC connection failed');
        }
      };

      // Step 3: Set remote description from D-ID offer
      if (streamData.offerSdp) {
        await peerConnection.setRemoteDescription({
          type: 'offer',
          sdp: streamData.offerSdp
        });

        // Step 4: Create and send answer
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        const sdpResponse = await fetch('/api/did-stream/sdp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            streamId: streamData.streamId,
            answerSdp: answer.sdp
          })
        });

        if (!sdpResponse.ok) {
          throw new Error('Failed to send SDP answer');
        }

        console.log('✅ WebRTC connection established');
      }

      setConnection({
        streamId: streamData.streamId,
        peerConnection,
        isConnected: true
      });

    } catch (error) {
      console.error('❌ Stream initialization failed:', error);
      setConnectionStatus('error');
      onError?.(error instanceof Error ? error.message : 'Stream initialization failed');
    } finally {
      setIsInitializing(false);
    }
  }, [avatarImageUrl, isInitializing, connection?.isConnected, onReady, onError]);

  /**
   * Send message to streaming avatar
   */
  const sendMessage = useCallback(async (text: string, voiceId?: string) => {
    if (!connection?.streamId) {
      console.warn('⚠️ No active stream connection');
      return false;
    }

    try {
      console.log('💬 Sending message to avatar:', text);

      const response = await fetch('/api/did-stream/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId: connection.streamId,
          text,
          voiceId
        })
      });

      const data = await response.json();
      return data.success;

    } catch (error) {
      console.error('❌ Failed to send message:', error);
      return false;
    }
  }, [connection?.streamId]);

  /**
   * Close streaming connection
   */
  const closeStream = useCallback(async () => {
    if (!connection) return;

    try {
      console.log('🔚 Closing stream connection');

      // Close WebRTC connection
      connection.peerConnection.close();

      // Close D-ID stream
      await fetch('/api/did-stream/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId: connection.streamId })
      });

      setConnection(null);
      setConnectionStatus('disconnected');

    } catch (error) {
      console.error('❌ Failed to close stream:', error);
    }
  }, [connection]);

  // Auto-initialize on mount
  useEffect(() => {
    initializeStream();
    
    // Cleanup on unmount
    return () => {
      closeStream();
    };
  }, [initializeStream, closeStream]);

  // Expose methods to parent component
  useEffect(() => {
    if (videoRef.current) {
      (videoRef.current as any).sendMessage = sendMessage;
      (videoRef.current as any).closeStream = closeStream;
      (videoRef.current as any).initializeStream = initializeStream;
    }
  }, [sendMessage, closeStream, initializeStream]);

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={false}
        className="w-full h-full object-cover rounded-lg"
        style={{ backgroundColor: '#000' }}
      />
      
      {/* Connection Status Overlay */}
      <div className="absolute top-2 right-2">
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          connectionStatus === 'connected' ? 'bg-green-500 text-white' :
          connectionStatus === 'connecting' ? 'bg-yellow-500 text-white' :
          connectionStatus === 'error' ? 'bg-red-500 text-white' :
          'bg-gray-500 text-white'
        }`}>
          {connectionStatus === 'connected' ? '🔴 Live' :
           connectionStatus === 'connecting' ? '🔄 Connecting' :
           connectionStatus === 'error' ? '❌ Error' :
           '⚪ Disconnected'}
        </div>
      </div>

      {/* Loading Overlay */}
      {isInitializing && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm">Initializing stream...</p>
          </div>
        </div>
      )}
    </div>
  );
}