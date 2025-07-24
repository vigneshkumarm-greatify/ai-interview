# AI Voice Interview MVP - Technical Documentation

## Project Summary

A simplified AI-powered voice interview system where users upload resumes, AI generates personalized questions, conducts voice-to-voice conversations with intelligent follow-ups, and provides basic feedback. No video avatars - just audio conversation.

## MVP Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │────│   API Routes     │────│   OpenAI API    │
│   (Frontend)    │    │   (Backend)      │    │   (GPT-4)       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Audio API │    │   Local Storage  │    │ Speech Services │
│   (Recording)   │    │   (Session Data) │    │ (TTS/STT APIs)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Technology Stack

### Frontend (Next.js 14)
- **Framework**: Next.js with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Audio**: Web Audio API, MediaRecorder
- **State**: React hooks (no external state management)
- **Storage**: localStorage for session persistence

### Backend (Next.js API Routes)
- **AI**: OpenAI GPT-4 API
- **Speech-to-Text**: OpenAI Whisper API
- **Text-to-Speech**: OpenAI TTS API
- **File Processing**: PDF parsing with pdf-parse
- **Storage**: No database - session data in memory/localStorage

### External Services
- **OpenAI API**: GPT-4 for questions + Whisper STT + TTS
- **File Storage**: Temporary local storage only

## Core Components

### 1. Resume Parser
**Input**: PDF/DOC file upload
**Process**: 
- Extract text using pdf-parse library
- Send to GPT-4 to structure into JSON (name, skills, experience, education)
- Generate 5-8 interview questions based on resume content

**API**: `/api/parse-resume`

### 2. Question Generator
**Input**: Parsed resume data
**Process**:
- Use GPT-4 to create role-appropriate questions
- Mix of behavioral (60%) and technical (40%) questions
- Store questions in component state

**No separate API** - integrated in resume parsing

### 3. Voice Conversation Engine
**Flow**:
1. AI asks question using TTS → plays audio
2. User responds → record audio using MediaRecorder
3. Send audio to Whisper API → get transcript
4. Send transcript + conversation history to GPT-4
5. GPT-4 decides: follow-up question OR next question
6. Loop until all questions covered

**APIs**: 
- `/api/speech-to-text` (Whisper)
- `/api/text-to-speech` (OpenAI TTS)
- `/api/analyze-response` (GPT-4 analysis)

### 4. Response Analyzer
**Input**: User's transcript + current question
**Process**:
- GPT-4 analyzes response quality (1-10 score)
- Determines if follow-up needed
- Generates follow-up question or moves to next

**Output**: Score + next action (follow-up/continue)

## File Structure

```
src/
├── app/
│   ├── page.tsx                 # Main interview interface
│   ├── api/
│   │   ├── parse-resume/route.ts       # Resume upload & parsing
│   │   ├── speech-to-text/route.ts     # Whisper API integration
│   │   ├── text-to-speech/route.ts     # OpenAI TTS integration
│   │   ├── analyze-response/route.ts   # Response analysis
│   │   └── calculate-score/route.ts    # Final scoring system
│   └── globals.css
├── components/
│   ├── ResumeUpload.tsx         # File upload component
│   ├── VoiceRecorder.tsx        # Audio recording interface
│   ├── InterviewProgress.tsx    # Progress tracking
│   ├── ScoreDisplay.tsx         # Final score visualization
│   └── Results.tsx              # Complete feedback display
├── lib/
│   ├── resume-parser.ts         # Resume processing logic
│   ├── audio-utils.ts           # Audio handling utilities
│   └── interview-engine.ts     # Interview flow management
└── types/
    └── interview.ts             # TypeScript interfaces
```

## Data Flow

### 1. Resume Upload Flow
```
User uploads PDF → Extract text → Send to GPT-4 → 
Parse into structured data → Generate questions → Store in state
```

### 2. Interview Flow
```
Start interview → Play first question (TTS) → 
Record user response → Transcribe (Whisper) → 
Analyze response (GPT-4) → Decide next action → 
Generate follow-up OR next question → Loop until complete
```

### 3. Session Management
```
Store current state in localStorage:
- Parsed resume data
- Generated questions
- Current question index  
- Response history
- Scores
```

## API Specifications

### Resume Parsing API
```typescript
POST /api/parse-resume
Content-Type: multipart/form-data

Request: FormData with 'resume' file
Response: {
  personalInfo: { name, email, phone },
  experience: [{ company, role, duration, skills }],
  skills: string[],
  education: [{ institution, degree, year }],
  questions: InterviewQuestion[]
}
```

### Speech-to-Text API
```typescript
POST /api/speech-to-text
Content-Type: multipart/form-data

Request: FormData with 'audio' blob
Response: {
  transcript: string
}
```

### Text-to-Speech API
```typescript
POST /api/text-to-speech
Content-Type: application/json

Request: { text: string }
Response: {
  audioUrl: string (base64 or blob URL)
}
```

### Response Analysis API
```typescript
POST /api/analyze-response
Content-Type: application/json

Request: {
  question: string,
  response: string,
  conversationHistory: Array<{role, content}>
}

Response: {
  score: number (1-10),
  feedback: string,
  needsFollowUp: boolean,
  followUpQuestion?: string,
  nextAction: 'followup' | 'continue' | 'complete'
}
```

## Component Interfaces

### TypeScript Types
```typescript
interface ParsedResume {
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
}

interface InterviewQuestion {
  id: string;
  question: string;
  category: 'behavioral' | 'technical';
  expectedDuration: number; // seconds
}

interface InterviewResponse {
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

interface FinalScore {
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

interface InterviewSession {
  id: string;
  resume: ParsedResume;
  questions: InterviewQuestion[];
  responses: InterviewResponse[];
  currentQuestionIndex: number;
  status: 'pending' | 'in-progress' | 'completed';
  startedAt: Date;
  completedAt?: Date;
}
```

## MVP Implementation Steps

### Phase 1: Basic Resume Processing (Week 1)
1. Create file upload component
2. Implement PDF text extraction
3. Integrate GPT-4 for resume parsing
4. Design basic question generation
5. Create simple UI for displaying questions

### Phase 2: Voice Integration (Week 2)
1. Implement Web Audio API recording
2. Integrate Whisper API for speech-to-text
3. Add OpenAI TTS for question playback
4. Create voice recording interface
5. Test audio quality and latency

### Phase 3: Conversation Logic (Week 3)
1. Build response analysis with GPT-4
2. Implement follow-up question logic
3. Create conversation flow management
4. Add session persistence with localStorage
5. Build progress tracking interface

### Phase 4: Polish & Testing (Week 4)
1. Improve UI/UX for better user experience
2. Add error handling and loading states
3. Optimize API calls and reduce latency
4. Test with multiple resume types
5. Generate basic feedback reports

## Cost Estimation (MVP)

### OpenAI API Costs per interview:
- **Resume Parsing**: ~$0.10 (GPT-4 with resume text)
- **Question Generation**: ~$0.05 (5-8 questions)
- **Response Analysis**: ~$1.50 (15 analysis calls avg)
- **Speech-to-Text**: ~$0.60 (10 min audio at $0.006/min)
- **Text-to-Speech**: ~$0.45 (3000 characters at $15/1M chars)

**Total per interview**: ~$2.70

### Infrastructure:
- **Vercel Hosting**: Free tier sufficient for MVP
- **File Storage**: Temporary only, minimal cost
- **Total Monthly**: <$50 for 100+ interviews/month

## Performance Targets

### Response Times:
- **Resume parsing**: <10 seconds
- **Question generation**: <5 seconds  
- **Speech-to-text**: <3 seconds
- **Response analysis**: <5 seconds
- **Text-to-speech**: <3 seconds

### Audio Quality:
- **Recording**: 16kHz, 16-bit minimum
- **Playback**: Clear, natural-sounding speech
- **Latency**: <1 second for voice interactions

## Security & Privacy (MVP)

### Data Handling:
- **Resume files**: Processed in memory, not stored permanently
- **Audio recordings**: Temporary, deleted after transcription
- **Session data**: Stored in browser localStorage only
- **API keys**: Server-side environment variables only

### Privacy:
- **No user accounts**: Anonymous usage
- **No data persistence**: Everything cleared on session end
- **Minimal data collection**: Only what's needed for functionality

## Scoring System

### Final Score Calculation

The system generates a **comprehensive interview score** based on multiple evaluation criteria:

#### Score Components (Total: 100 points)

1. **Communication Skills (25 points)**
   - Clarity and articulation
   - Proper grammar and vocabulary
   - Speaking pace and confidence
   - Professional tone

2. **Content Quality (30 points)**
   - Relevance to the question asked
   - Depth and detail of responses
   - Use of specific examples (STAR method)
   - Technical accuracy when applicable

3. **Experience Alignment (25 points)**
   - How well responses match resume claims
   - Demonstration of stated skills
   - Consistency across different questions
   - Evidence of practical application

4. **Interview Performance (20 points)**
   - Response time and preparation
   - Handling of follow-up questions
   - Overall engagement level
   - Professional demeanor

#### Scoring API
```typescript
POST /api/calculate-final-score
Content-Type: application/json

Request: {
  responses: InterviewResponse[],
  resume: ParsedResume,
  questions: InterviewQuestion[]
}

Response: {
  overallScore: number,        // 0-100
  breakdown: {
    communication: number,     // 0-25
    content: number,          // 0-30
    experience: number,       // 0-25
    performance: number       // 0-20
  },
  strengths: string[],
  improvementAreas: string[],
  detailedFeedback: string,
  recommendations: string[]
}
```

#### Score Interpretation
- **90-100**: Exceptional candidate - Ready for senior roles
- **80-89**: Strong candidate - Good fit for target role
- **70-79**: Decent candidate - Some areas need improvement
- **60-69**: Below average - Significant preparation needed
- **Below 60**: Poor performance - Extensive practice required

### Results Display Component

The final results page shows:
- **Overall Score** with visual progress bar
- **Category Breakdown** with individual scores
- **Strengths** identified during interview
- **Areas for Improvement** with specific suggestions
- **Detailed Feedback** for each question
- **Recommendations** for skill development

## MVP Limitations

### What's NOT included:
- User accounts or authentication
- Database or persistent storage
- Video avatars or visual elements
- Advanced analytics or reporting
- Multi-language support
- Enterprise features
- Mobile app (web-only)
- Custom question templates

### Technical Constraints:
- **Session length**: Limited by browser tab lifecycle
- **Audio quality**: Dependent on user's microphone
- **Internet dependency**: Requires stable connection for AI APIs
- **Browser support**: Modern browsers only (Chrome/Firefox/Safari)

This MVP focuses on core functionality: resume analysis → voice conversation → comprehensive scoring. Perfect for validating the concept before adding complexity.