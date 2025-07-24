export interface ParsedResume {
  personalInfo: {
    name: string;
    email?: string;
    phone?: string;
  };
  experience: Array<{
    company: string;
    role: string;
    duration: string;
    responsibilities: string[];
  }>;
  skills: string[];
  education: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
  rawText: string; // Store original resume text for feedback
  feedback?: ResumeFeedback; // Optional resume quality feedback
}

export interface ResumeFeedback {
  score: number; // 0-100
  strengths: string[];
  improvements: string[];
  formatting: string;
  contentQuality: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: 'behavioral' | 'technical';
  expectedDuration: number;
}

export interface ConversationalResponse {
  acknowledgment: string;
  question: string;
  isFollowUp: boolean;
  followUpType?: 'clarification' | 'example' | 'challenge' | 'outcome' | 'technical';
  shouldTransition: boolean;
  conversationPhase: 'initial' | 'follow_up' | 'transition' | 'completion';
}

export interface InterviewResponse {
  questionId: string;
  transcript: string;
  audioUrl?: string;
  score: number;
  feedback: string;
  timestamp: Date;
  analysis: {
    communication: number;    // 0-25
    content: number;         // 0-30  
    experience: number;      // 0-25
    performance: number;     // 0-20
  };
}

export interface FinalScore {
  overallScore: number;      // 0-100
  breakdown: {
    communication: number;   // 0-25
    content: number;        // 0-30
    experience: number;     // 0-25
    performance: number;    // 0-20
  };
  strengths: string[];
  improvementAreas: string[];
  detailedFeedback: string;
  recommendations: string[];
}

export interface InterviewSession {
  id: string;
  resume: ParsedResume;
  questions: InterviewQuestion[];
  responses: InterviewResponse[];
  finalScore?: FinalScore;
  startTime: Date;
  endTime?: Date;
  status: 'setup' | 'in-progress' | 'completed' | 'abandoned';
}

export interface AudioRecording {
  blob: Blob;
  url: string;
  duration: number;
  mimeType: string;
}

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  language?: string;
}

export interface AnalysisResult {
  score: number;
  feedback: string;
  analysis: {
    communication: number;
    content: number;
    experience: number;
    performance: number;
  };
}

export type InterviewStep = 
  | 'upload-resume'
  | 'processing-resume'
  | 'ready-to-start'
  | 'recording'
  | 'processing-response'
  | 'showing-feedback'
  | 'completed';

export interface InterviewConfig {
  maxQuestions: number;
  maxRecordingDuration: number;
  minRecordingDuration: number;
  audioFormat: string;
  sampleRate: number;
}