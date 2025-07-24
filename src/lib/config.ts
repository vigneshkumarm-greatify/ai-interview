import { InterviewConfig } from '@/types/interview';

export const API_CONFIG = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    orgId: process.env.OPENAI_ORG_ID,
    models: {
      gpt4: 'gpt-3.5-turbo', // Changed to more reliable model
      whisper: 'whisper-1',
      tts: 'tts-1',
      ttsHD: 'tts-1-hd',
    },
    ttsVoice: 'alloy' as const,
  },
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'AI Voice Interview',
    maxRecordingDuration: parseInt(process.env.NEXT_PUBLIC_MAX_RECORDING_DURATION || '120000'),
    maxFileSize: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760'),
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
  },
} as const;

export const INTERVIEW_CONFIG: InterviewConfig = {
  maxQuestions: 5,
  maxRecordingDuration: 120000, // 2 minutes in milliseconds
  minRecordingDuration: 3000,   // 3 seconds minimum
  audioFormat: 'webm',
  sampleRate: 16000,
};

export const SCORE_WEIGHTS = {
  communication: 0.25,
  content: 0.30,
  experience: 0.25,
  performance: 0.20,
} as const;

export const FILE_UPLOAD_CONFIG = {
  acceptedFormats: ['.pdf', '.doc', '.docx', '.txt'],
  maxSizeMB: 10,
  maxSizeBytes: 10 * 1024 * 1024,
} as const;

export const AUDIO_CONFIG = {
  mimeType: 'audio/webm',
  audioBitsPerSecond: 128000,
  sampleRate: 16000,
} as const;

export function validateEnvironment(): void {
  const requiredEnvVars = ['OPENAI_API_KEY'];
  
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
}