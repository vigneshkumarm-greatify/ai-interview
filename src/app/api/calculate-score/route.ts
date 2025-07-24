import { NextResponse } from 'next/server';
import { generateCompletion } from '@/lib/openai';
import { FinalScore } from '@/types/interview';

export const runtime = 'nodejs';

interface ScoreRequest {
  responses: Array<{
    question: string;
    transcript: string;
    score: number;
    feedback: string;
    analysis: {
      communication: number;
      content: number;
      experience: number;
      performance: number;
    };
  }>;
  role: string;
  resumeContext: {
    name: string;
    experience: string;
    skills: string[];
  };
}

export async function POST(request: Request) {
  console.log('📊 CALCULATE SCORE API - Computing final interview score');
  
  try {
    const body: ScoreRequest = await request.json();
    const { responses, role, resumeContext } = body;

    console.log('📝 Analyzing', responses.length, 'responses for final score');
    console.log('👤 Role:', role);

    // Calculate aggregate scores
    const aggregateScores = calculateAggregateScores(responses);
    
    // Generate comprehensive feedback
    const systemPrompt = buildFeedbackPrompt(role);
    const userPrompt = buildUserPrompt(responses, aggregateScores, resumeContext);

    console.log('🤖 Generating comprehensive feedback...');

    const feedbackResponse = await generateCompletion(systemPrompt, userPrompt, 0.8);
    
    console.log('✅ Feedback Response Generated');

    // Parse and build final score
    const finalScore = buildFinalScore(aggregateScores, feedbackResponse);
    
    return NextResponse.json({
      success: true,
      ...finalScore
    });

  } catch (error) {
    console.error('❌ Score Calculation Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to calculate final score',
      finalScore: getFallbackScore()
    }, { status: 500 });
  }
}

function calculateAggregateScores(responses: any[]) {
  if (responses.length === 0) {
    return {
      communication: 0,
      content: 0,
      experience: 0,
      performance: 0,
      overallScore: 0
    };
  }

  // Calculate averages for each category
  const totals = responses.reduce((acc, response) => {
    acc.communication += response.analysis.communication;
    acc.content += response.analysis.content;
    acc.experience += response.analysis.experience;
    acc.performance += response.analysis.performance;
    return acc;
  }, { communication: 0, content: 0, experience: 0, performance: 0 });

  const count = responses.length;
  
  return {
    communication: Math.round(totals.communication / count),
    content: Math.round(totals.content / count),
    experience: Math.round(totals.experience / count),
    performance: Math.round(totals.performance / count),
    overallScore: Math.round((totals.communication + totals.content + totals.experience + totals.performance) / count)
  };
}

function buildFeedbackPrompt(role: string): string {
  return `You are an expert ${role} interviewer providing comprehensive feedback after completing an interview.

Your task is to analyze the candidate's overall performance and provide:

1. STRENGTHS (3-4 key strengths demonstrated)
2. IMPROVEMENT AREAS (2-3 specific areas to work on)
3. DETAILED FEEDBACK (comprehensive 3-4 sentence assessment)
4. RECOMMENDATIONS (3-4 actionable next steps)

FEEDBACK GUIDELINES:
- Be specific and reference actual responses when possible
- Provide constructive, actionable advice
- Consider the role requirements and expectations
- Balance positive reinforcement with growth opportunities
- Focus on both technical and soft skills
- Be professional and encouraging

RESPONSE FORMAT (EXACT JSON):
{
  "strengths": [
    "First strength with specific example",
    "Second strength with context", 
    "Third strength demonstrated",
    "Fourth strength if applicable"
  ],
  "improvementAreas": [
    "First area for improvement with specific advice",
    "Second area with actionable steps",
    "Third area if applicable"
  ],
  "detailedFeedback": "Comprehensive 3-4 sentence assessment of overall performance, highlighting key themes and providing encouragement while being honest about areas for growth.",
  "recommendations": [
    "Specific actionable step 1",
    "Practical recommendation 2", 
    "Growth opportunity 3",
    "Professional development suggestion 4"
  ]
}`;
}

function buildUserPrompt(responses: any[], aggregateScores: any, resumeContext: any): string {
  const responsesSummary = responses.map((r, i) => 
    `Question ${i + 1}: "${r.question}"\nResponse: "${r.transcript.substring(0, 200)}..."\nScore: ${r.score}/100\nFeedback: ${r.feedback}\n`
  ).join('\n');

  return `INTERVIEW SUMMARY:

CANDIDATE PROFILE:
- Name: ${resumeContext.name}
- Experience: ${resumeContext.experience}
- Skills: ${resumeContext.skills.join(', ')}

AGGREGATE SCORES:
- Communication: ${aggregateScores.communication}/25
- Content: ${aggregateScores.content}/30
- Experience: ${aggregateScores.experience}/25
- Performance: ${aggregateScores.performance}/20
- Overall Score: ${aggregateScores.overallScore}/100

DETAILED RESPONSES:
${responsesSummary}

ANALYSIS TASK:
Based on this interview performance, provide comprehensive feedback that:

1. Identifies the candidate's strongest demonstrated skills
2. Highlights specific areas where they excelled
3. Points out concrete areas for improvement
4. Provides actionable recommendations for professional growth
5. Considers their background and the role requirements

Focus on patterns across all responses and provide specific, actionable guidance.

Return response in exact JSON format specified in system prompt.`;
}

function buildFinalScore(aggregateScores: any, feedbackResponse: string): FinalScore {
  try {
    const parsed = JSON.parse(feedbackResponse);
    
    return {
      overallScore: aggregateScores.overallScore,
      breakdown: {
        communication: aggregateScores.communication,
        content: aggregateScores.content,
        experience: aggregateScores.experience,
        performance: aggregateScores.performance
      },
      strengths: parsed.strengths || [
        'Demonstrated good communication skills',
        'Showed relevant experience',
        'Provided concrete examples'
      ],
      improvementAreas: parsed.improvementAreas || [
        'Could provide more specific technical details',
        'Consider structuring responses more clearly'
      ],
      detailedFeedback: parsed.detailedFeedback || 'The candidate showed solid performance with good potential for growth in key areas.',
      recommendations: parsed.recommendations || [
        'Practice explaining technical concepts clearly',
        'Prepare more specific examples from past experience',
        'Focus on quantifying achievements and impact'
      ]
    };
  } catch (error) {
    console.error('❌ Failed to parse feedback response:', error);
    console.log('📝 Raw feedback response:', feedbackResponse);
    
    return {
      overallScore: aggregateScores.overallScore,
      breakdown: {
        communication: aggregateScores.communication,
        content: aggregateScores.content,
        experience: aggregateScores.experience,
        performance: aggregateScores.performance
      },
      strengths: [
        'Engaged well in the interview conversation',
        'Demonstrated relevant background knowledge',
        'Showed professional communication skills'
      ],
      improvementAreas: [
        'Could provide more detailed technical explanations',
        'Consider adding more specific examples from experience'
      ],
      detailedFeedback: 'The candidate demonstrated good foundational skills with opportunities to enhance technical depth and provide more specific examples in future interviews.',
      recommendations: [
        'Practice explaining technical concepts with specific examples',
        'Prepare stories that highlight problem-solving abilities',
        'Focus on quantifying achievements and business impact',
        'Continue developing expertise in core technical skills'
      ]
    };
  }
}

function getFallbackScore(): FinalScore {
  return {
    overallScore: 65,
    breakdown: {
      communication: 16,
      content: 20,
      experience: 16,
      performance: 13
    },
    strengths: [
      'Participated actively in the interview process',
      'Demonstrated willingness to engage with questions',
      'Showed professional demeanor throughout'
    ],
    improvementAreas: [
      'Technical analysis could not be completed',
      'Consider retaking interview for detailed feedback'
    ],
    detailedFeedback: 'Due to technical issues, we could not complete the full analysis of your interview. Your engagement was positive, and we recommend retaking the interview for comprehensive feedback.',
    recommendations: [
      'Retake the interview when technical issues are resolved',
      'Prepare specific examples from your experience',
      'Practice clear communication of technical concepts'
    ]
  };
}