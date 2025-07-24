import { NextResponse } from 'next/server';
import { generateCompletion } from '@/lib/openai';
import { AnalysisResult } from '@/types/interview';

export const runtime = 'nodejs';

interface AnalyzeRequest {
  transcript: string;
  question: string;
  role: string;
  resumeContext: {
    name: string;
    experience: string;
    skills: string[];
  };
}

export async function POST(request: Request) {
  console.log('🔍 ANALYZE RESPONSE API - Processing response analysis');
  
  try {
    const body: AnalyzeRequest = await request.json();
    const { transcript, question, role, resumeContext } = body;

    console.log('📝 Analyzing transcript:', transcript.substring(0, 100) + '...');
    console.log('❓ Question:', question);
    console.log('👤 Role:', role);

    // Build analysis prompt
    const systemPrompt = buildAnalysisPrompt(role);
    const userPrompt = buildUserPrompt(transcript, question, resumeContext);

    console.log('🤖 Generating analysis...');

    // Get analysis from OpenAI
    const analysisResponse = await generateCompletion(systemPrompt, userPrompt, 0.7);
    
    console.log('✅ Analysis Response:', analysisResponse);

    // Parse the analysis response
    const analysis = parseAnalysisResponse(analysisResponse);
    
    return NextResponse.json({
      success: true,
      ...analysis
    });

  } catch (error) {
    console.error('❌ Analysis Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze response',
      analysis: {
        score: 50,
        feedback: 'Unable to analyze response at this time.',
        analysis: {
          communication: 12,
          content: 15,
          experience: 12,
          performance: 11
        }
      }
    }, { status: 500 });
  }
}

function buildAnalysisPrompt(role: string): string {
  return `You are an expert ${role} interviewer analyzing a candidate's response.

SCORING CRITERIA (Total: 100 points):

1. COMMUNICATION (0-25 points):
   - Clarity and articulation
   - Structure and organization
   - Professional language
   - Confidence in delivery

2. CONTENT (0-30 points):
   - Technical accuracy
   - Depth of knowledge
   - Relevant examples
   - Problem-solving approach

3. EXPERIENCE (0-25 points):
   - Relevant work experience
   - Project complexity
   - Real-world application
   - Learning from challenges

4. PERFORMANCE (0-20 points):
   - Response completeness
   - Addressing the question directly
   - Time management
   - Overall impression

ANALYSIS REQUIREMENTS:
- Provide specific, actionable feedback
- Highlight both strengths and areas for improvement
- Reference the candidate's actual response content
- Be constructive and professional
- Consider the role requirements

RESPONSE FORMAT (EXACT JSON):
{
  "score": [total score 0-100],
  "feedback": "[2-3 sentences of specific feedback]",
  "analysis": {
    "communication": [0-25],
    "content": [0-30],
    "experience": [0-25],
    "performance": [0-20]
  }
}`;
}

function buildUserPrompt(transcript: string, question: string, resumeContext: any): string {
  return `INTERVIEW QUESTION: "${question}"

CANDIDATE'S RESPONSE: "${transcript}"

CANDIDATE CONTEXT:
- Name: ${resumeContext.name}
- Experience: ${resumeContext.experience}
- Skills: ${resumeContext.skills.join(', ')}

ANALYSIS TASK:
Analyze this response considering:
1. How well they answered the specific question asked
2. The quality of their communication and explanation
3. Relevance to their background and the role
4. Technical accuracy and depth (if applicable)
5. Use of concrete examples or experiences

Provide scores for each category and specific feedback about what they did well and what could be improved.

Return response in exact JSON format specified in system prompt.`;
}

function parseAnalysisResponse(response: string): AnalysisResult {
  try {
    const parsed = JSON.parse(response);
    
    // Validate and normalize scores
    const communication = Math.max(0, Math.min(25, parsed.analysis?.communication || 0));
    const content = Math.max(0, Math.min(30, parsed.analysis?.content || 0));
    const experience = Math.max(0, Math.min(25, parsed.analysis?.experience || 0));
    const performance = Math.max(0, Math.min(20, parsed.analysis?.performance || 0));
    
    const totalScore = communication + content + experience + performance;
    
    return {
      score: Math.max(0, Math.min(100, totalScore)),
      feedback: parsed.feedback || 'Analysis completed.',
      analysis: {
        communication,
        content,
        experience,
        performance
      }
    };
  } catch (error) {
    console.error('❌ Failed to parse analysis response:', error);
    console.log('📝 Raw response:', response);
    
    // Return fallback analysis
    return {
      score: 60,
      feedback: 'Response provided good insights with room for more specific examples.',
      analysis: {
        communication: 15,
        content: 18,
        experience: 15,
        performance: 12
      }
    };
  }
}