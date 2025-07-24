import { NextResponse } from 'next/server';
import { generateCompletion } from '@/lib/openai';

export const runtime = 'nodejs';

interface ConversationEntry {
  speaker: 'AI' | 'USER';
  message: string;
  timestamp: Date;
}

interface ConversationRequest {
  conversation: ConversationEntry[];
  latestUserResponse: string;
  role: string;
  resumeContext: {
    name: string;
    experience: string;
    skills: string[];
  };
}

interface ConversationResponse {
  acknowledgment: string;
  nextQuestion: string;
  responseType: 'follow_up' | 'transition' | 'complete';
  shouldScore: boolean;
  conversationContext: {
    topicDepth: number;
    questionsAsked: number;
    currentTopic: string;
  };
}

export async function POST(request: Request) {
  console.log('🎯 CONVERSATION MANAGER API - Processing user response');
  
  try {
    const body: ConversationRequest = await request.json();
    const { conversation, latestUserResponse, role, resumeContext } = body;

    console.log('📝 Latest User Response:', latestUserResponse);
    console.log('📊 Conversation Length:', conversation.length);

    // Build complete conversation history for context
    const conversationHistory = buildConversationHistory(conversation);
    
    // Analyze user response and determine next action
    const systemPrompt = buildSystemPrompt(role);
    const userPrompt = buildUserPrompt(conversationHistory, latestUserResponse, resumeContext);

    console.log('🤖 System Prompt:', systemPrompt);
    console.log('👤 User Prompt:', userPrompt);

    // Single API call for complete conversational response
    let apiResponse: string;
    let retryCount = 0;
    const maxRetries = 1;

    while (retryCount <= maxRetries) {
      try {
        apiResponse = await generateCompletion(systemPrompt, userPrompt, 0.8);
        console.log('✅ OpenAI Response:', apiResponse);
        break;
      } catch (error) {
        console.error(`❌ API Call Failed (Attempt ${retryCount + 1}):`, error);
        retryCount++;
        
        if (retryCount > maxRetries) {
          // Return user-friendly error response
          return NextResponse.json({
            success: false,
            error: "I'm having trouble processing your response. Could you please repeat that?",
            shouldRetry: true
          }, { status: 200 }); // Return 200 to handle gracefully on frontend
        }
      }
    }

    // Parse the AI response
    const parsedResponse = parseAIResponse(apiResponse!, conversation.length);
    
    return NextResponse.json({
      success: true,
      ...parsedResponse
    });

  } catch (error) {
    console.error('❌ Conversation Manager Error:', error);
    return NextResponse.json({
      success: false,
      error: "I'm having trouble processing your response. Could you please repeat that?",
      shouldRetry: true
    }, { status: 200 });
  }
}

function buildConversationHistory(conversation: ConversationEntry[]): string {
  return conversation.map(entry => 
    `${entry.speaker}: "${entry.message}"`
  ).join('\n');
}

function buildSystemPrompt(role: string): string {
  return `You are an experienced ${role} interviewer conducting a technical interview based on the candidate's resume.

🚨 CRITICAL REQUIREMENTS:

1. ALL questions MUST be based on skills/technologies from their RESUME
2. NEVER ask about technologies they haven't mentioned or don't have
3. BALANCE between project details, technical skills, and problem-solving
4. LIMIT project deep-dives to 2-3 questions maximum
5. TRANSITION to technical questions about their ACTUAL skills

INTERVIEW STRUCTURE:
1. **Project Overview** (2-3 questions max): What they built, main challenges
2. **Technical Skills** (from resume): How they use specific technologies listed
3. **Problem Solving**: Scenarios using their actual tech stack
4. **Best Practices**: Related to their listed skills only
5. **Behavioral**: Team situations, learning experiences

IMPORTANT RULES:
- Only ask about technologies EXPLICITLY in their resume/conversation
- After 2-3 project questions → Move to technical skills
- Reference their specific skills when asking technical questions
- Never introduce new technologies they haven't mentioned

CONVERSATION FLOW:
- Acknowledge their response appropriately
- For projects: 2-3 exchanges MAX then transition
- Move to technical questions about their LISTED skills
- Ask problem-solving scenarios using THEIR tech stack

RESPONSE STRUCTURE (EXACT JSON):
{
  "acknowledgment": "[Natural acknowledgment]",
  "nextQuestion": "[Question based on THEIR skills/experience]",
  "responseType": "[follow_up|transition|complete]",
  "shouldScore": [true when transitioning topics],
  "currentTopic": "[project|technical|problem_solving|behavioral]",
  "topicDepth": [number of exchanges on current topic]
}

TRANSITION EXAMPLES:
- "Great project experience! I see you work with [THEIR SKILL]. How do you typically..."
- "Excellent! Since you mentioned [THEIR TECHNOLOGY], can you explain..."
- "That's interesting! Given your experience with [THEIR SKILL], how would you approach..."

FORBIDDEN:
- Asking about technologies not in their resume
- Going too deep into project implementation (max 2-3 questions)
- Generic questions unrelated to their background`;
}

function buildUserPrompt(conversationHistory: string, latestResponse: string, resumeContext: any): string {
  // Count project-related exchanges
  const projectExchanges = conversationHistory.toLowerCase().split('\n').filter(line => 
    line.includes('project') || line.includes('built') || line.includes('developed')
  ).length;

  return `FULL CONVERSATION HISTORY:
${conversationHistory}

LATEST USER RESPONSE: "${latestResponse}"

CANDIDATE'S RESUME CONTEXT:
- Name: ${resumeContext.name}
- Experience: ${resumeContext.experience}
- ALL SKILLS: ${resumeContext.skills.join(', ')}

SKILL CLASSIFICATION:
- TECHNICAL SKILLS (ask technical questions): ${resumeContext.skills.filter(skill => 
    ['javascript', 'typescript', 'react', 'vue', 'angular', 'node', 'python', 'java', 'html', 'css', 
     'mongodb', 'mysql', 'postgresql', 'redis', 'docker', 'kubernetes', 'aws', 'azure', 'git', 
     'api', 'rest', 'graphql', 'microservices', 'express', 'django', 'flask', 'spring'].some(tech => 
     skill.toLowerCase().includes(tech.toLowerCase()))).join(', ') || 'None identified'}
- BEHAVIORAL SKILLS (ask behavioral questions): ${resumeContext.skills.filter(skill => 
    ['problem-solving', 'empathy', 'leadership', 'communication', 'teamwork', 'management', 
     'collaboration', 'analytical', 'creative'].some(soft => 
     skill.toLowerCase().includes(soft.toLowerCase()))).join(', ') || 'None identified'}

IMPORTANT: Only ask TECHNICAL questions about technical skills, BEHAVIORAL questions about soft skills

CONVERSATION ANALYSIS:
1. Number of project-related questions so far: ${projectExchanges}
2. Did they ask for clarification? ${latestResponse.toLowerCase().includes('what do you mean') || latestResponse.toLowerCase().includes('which') ? 'YES' : 'NO'}
3. Current topic depth: Count how many exchanges on current topic

TASK - Generate response based on these rules:

IF PROJECT DISCUSSION (and already 2-3 project questions):
- Acknowledge their project experience
- TRANSITION to technical questions about their LISTED skills
- Example: "Great project work! I see you have ${resumeContext.skills[0]} in your skills. How do you..."
- Set responseType: "transition", topicDepth: 0

IF NEED TO ASK TECHNICAL QUESTIONS:
- Focus on TECHNICAL SKILLS ONLY (JavaScript, React, Python, APIs, etc.)
- Ask about coding, debugging, implementation, best practices
- Examples for technical skills:
  - "How do you handle state management in React?"
  - "What's your approach to debugging JavaScript issues?"
  - "Can you explain how you structure your API endpoints?"
  - "How do you optimize database queries?"
  - "What testing strategies do you use?"

IF ASKING BEHAVIORAL QUESTIONS:
- Focus on BEHAVIORAL SKILLS (problem-solving, empathy, leadership, etc.)
- Ask about situations, examples, team scenarios
- Examples for behavioral skills:
  - "Tell me about a time you used problem-solving to overcome a challenge"
  - "How do you show empathy when working with difficult stakeholders?"
  - "Describe a situation where you had to lead a team through a difficult project"

IF CLARIFICATION NEEDED:
- Apologize and clarify
- Reference their actual skills/experience
- Set responseType: "follow_up"

TOPIC BALANCE CHECK:
- Projects: Maximum 2-3 questions
- Technical Skills: Ask about their LISTED technologies
- Problem Solving: Using their ACTUAL tech stack
- Behavioral: Related to their experience

FORBIDDEN:
- Don't ask about skills NOT in their resume
- Don't go deeper than 3 questions on any project
- Don't ask generic questions unrelated to their background

Generate response in EXACT JSON format with proper topic tracking.`;
}

function parseAIResponse(aiResponse: string, conversationLength: number): ConversationResponse {
  try {
    // Try to parse JSON response
    const parsed = JSON.parse(aiResponse);
    
    // Calculate conversation context
    const questionsAsked = Math.floor((conversationLength + 1) / 2); // Rough estimate
    
    return {
      acknowledgment: parsed.acknowledgment || "I see.",
      nextQuestion: parsed.nextQuestion || "Could you tell me more about that?",
      responseType: parsed.responseType || 'follow_up',
      shouldScore: parsed.shouldScore || false,
      conversationContext: {
        topicDepth: parsed.topicDepth || 1,
        questionsAsked: questionsAsked,
        currentTopic: parsed.currentTopic || 'general'
      }
    };
  } catch (error) {
    console.error('❌ Failed to parse AI response:', error);
    console.log('📝 Raw AI Response:', aiResponse);
    
    // Extract acknowledgment and question from raw text if JSON parsing fails
    const lines = aiResponse.split('\n').filter(line => line.trim());
    let acknowledgment = "I see.";
    let nextQuestion = "Could you tell me more about that?";
    
    // Try to extract acknowledgment and question from response
    if (lines.length >= 2) {
      acknowledgment = lines[0];
      nextQuestion = lines[1];
    } else if (lines.length === 1) {
      // Single line response - split by punctuation
      const parts = aiResponse.split(/[.!?]+/).filter(part => part.trim());
      if (parts.length >= 2) {
        acknowledgment = parts[0] + (aiResponse.includes('!') ? '!' : '.');
        nextQuestion = parts[1].trim() + '?';
      }
    }
    
    const questionsAsked = Math.floor((conversationLength + 1) / 2);
    
    return {
      acknowledgment,
      nextQuestion,
      responseType: questionsAsked >= 8 ? 'complete' : 'follow_up',
      shouldScore: false,
      conversationContext: {
        topicDepth: 1,
        questionsAsked: questionsAsked,
        currentTopic: 'general'
      }
    };
  }
}