# Claude Development Instructions - AI Voice Interview MVP

## Project Overview
You are helping build an AI Voice Interview MVP using Next.js 14. The system allows users to upload resumes, conducts voice-based interviews with AI-generated questions, analyzes responses, and provides comprehensive scoring.

## Your Role & Workflow

### 1. Primary Responsibilities
- Implement features from the technical documentation
- Update the implementation checklist after completing tasks
- Explain changes before making them and get user approval
- Maintain code quality and follow Next.js 14 best practices
- Use TypeScript throughout the project

### 2. Required Files to Maintain
- `implementation-checklist.md` - Track completed and pending tasks
- `CHANGELOG.md` - Log all changes made
- Technical documentation reference for specifications

### 3. Development Workflow

#### Before Making Changes:
1. **Explain the Change**: Describe what you're going to implement
2. **Why This Change**: Explain the purpose and benefits
3. **Impact Assessment**: What files will be created/modified
4. **Get Approval**: Wait for user confirmation before proceeding

#### After Completing Tasks:
1. **Update Checklist**: Mark completed items and add new discoveries
2. **Update Changelog**: Document what was implemented
3. **Status Report**: Brief summary of what's working and what's next

## Technical Specifications

### Technology Stack
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Audio**: Web Audio API, MediaRecorder
- **AI Services**: OpenAI GPT-4, Whisper, TTS APIs
- **Storage**: localStorage for MVP (no database)
- **State Management**: React hooks only

### Project Structure
```
src/
├── app/
│   ├── page.tsx                    # Main interview interface
│   ├── api/
│   │   ├── parse-resume/route.ts       # Resume processing
│   │   ├── speech-to-text/route.ts     # Audio transcription
│   │   ├── text-to-speech/route.ts     # Voice synthesis
│   │   ├── analyze-response/route.ts   # Response analysis
│   │   └── calculate-score/route.ts    # Final scoring
│   └── globals.css
├── components/
│   ├── ResumeUpload.tsx            # File upload
│   ├── VoiceRecorder.tsx           # Audio recording
│   ├── InterviewProgress.tsx       # Progress tracking
│   ├── ScoreDisplay.tsx            # Score visualization
│   └── Results.tsx                 # Final results
├── lib/
│   ├── resume-parser.ts            # Resume processing logic
│   ├── audio-utils.ts              # Audio utilities
│   └── interview-engine.ts         # Interview flow
├── types/
│   └── interview.ts                # TypeScript interfaces
├── implementation-checklist.md     # Task tracking
└── CHANGELOG.md                    # Change history
```

### Core Data Models
```typescript
interface ParsedResume {
  personalInfo: { name: string; email?: string; phone?: string };
  experience: Array<{ company: string; role: string; duration: string; responsibilities: string[] }>;
  skills: string[];
  education: Array<{ institution: string; degree: string; year: string }>;
}

interface InterviewQuestion {
  id: string;
  question: string;
  category: 'behavioral' | 'technical';
  expectedDuration: number;
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
```

## Implementation Guidelines

### Code Standards
- Use TypeScript strict mode
- Follow Next.js 14 App Router conventions
- Implement proper error handling
- Add loading states for all async operations
- Use Tailwind CSS for styling
- Keep components small and focused

### API Integration
- All OpenAI API calls server-side only
- Proper error handling for API failures
- Rate limiting considerations
- Secure API key management

### Audio Handling
- Support modern browsers (Chrome, Firefox, Safari)
- Handle microphone permissions
- Audio quality: minimum 16kHz, 16-bit
- Graceful fallback for audio issues

### State Management
- Use React hooks for local state
- localStorage for session persistence
- No external state management library needed

### Performance Targets
- Resume parsing: <10 seconds
- Speech processing: <3 seconds
- Response analysis: <5 seconds
- Overall interview latency: <2 seconds between interactions

## Communication Protocol

### When Starting a Task:
```
## Task: [Task Name]

**What I'm going to do:**
- [Specific implementation details]

**Files I'll create/modify:**
- [List of files]

**Why this change:**
- [Purpose and benefits]

**Estimated impact:**
- [What functionality this enables]

Please confirm if you want me to proceed with this implementation.
```

### After Completing a Task:
```
## Completed: [Task Name]

**What was implemented:**
- [Summary of changes]

**Files modified:**
- [List with brief description of changes]

**Testing status:**
- [What should work now]

**Next steps:**
- [What's ready to implement next]

Updated implementation-checklist.md with completion status.
```

## Error Handling Strategy
- Graceful degradation when APIs fail
- User-friendly error messages
- Retry mechanisms for transient failures
- Fallback options when possible

## Security Considerations
- No permanent data storage
- API keys server-side only
- Input validation for file uploads
- Audio data cleaned after processing

## Development Priorities
1. **Core Flow First**: Resume → Questions → Voice Interview → Scoring
2. **Basic UI**: Functional over fancy
3. **Error Handling**: Robust failure scenarios
4. **Performance**: Optimize API calls and audio processing
5. **Polish**: Improve UX after core functionality works


Remember: Always explain your planned changes and get approval before implementing. Update the checklist after each completed task.