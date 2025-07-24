import { ParsedResume, InterviewQuestion, ConversationalResponse } from '@/types/interview';
import { generateCompletion } from './openai';
import { ConversationManager, ConversationState } from './conversation-state';

export interface InterviewContext {
  resume: ParsedResume;
  role: string;
  roleDescription: string;
  conversationHistory: Array<{
    question: string;
    answer: string;
    timestamp: Date;
  }>;
  currentTopic: string;
  interviewStage: 'opening' | 'technical' | 'behavioral' | 'experience' | 'closing';
}

export class DynamicInterviewer {
  private context: InterviewContext;
  private questionCount = 0;
  private maxQuestions = 8; // Flexible based on conversation depth
  private lastTopicsMentioned: string[] = [];
  private conversationManager: ConversationManager;
  private coreTopics: string[] = ['technical_experience', 'project_deep_dive', 'problem_solving', 'team_collaboration'];

  constructor(resume: ParsedResume, role: string, roleDescription: string) {
    this.context = {
      resume,
      role,
      roleDescription,
      conversationHistory: [],
      currentTopic: 'introduction',
      interviewStage: 'opening'
    };
    this.conversationManager = new ConversationManager();
  }

  private analyzeAnswerForTopics(answer: string): string[] {
    const topics: string[] = [];
    const lowerAnswer = answer.toLowerCase();
    
    console.log('🔍 ANALYZING USER ANSWER:', answer);
    
    // Extract specific entities that require follow-up
    
    // 1. Years/Duration mentioned (critical for experience follow-up)
    const yearMatches = answer.match(/(\d+)\s*(year|yr|month|week)/gi);
    if (yearMatches) {
      yearMatches.forEach(match => {
        topics.push(`EXPERIENCE_DURATION: ${match}`);
        console.log('📅 Found duration:', match);
      });
    }
    
    // 2. Company names (look for capitalized words that might be companies)
    const companyPatterns = [
      /at\s+([A-Z][a-zA-Z\s&]+?)(?:\s|,|\.|\b(?:for|where|as|in|during))/g,
      /worked\s+(?:at|for)\s+([A-Z][a-zA-Z\s&]+?)(?:\s|,|\.|\b(?:for|where|as|in|during))/g,
      /company\s+called\s+([A-Z][a-zA-Z\s&]+?)(?:\s|,|\.|\b)/g
    ];
    
    companyPatterns.forEach(pattern => {
      const matches = answer.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const companyName = match.replace(/(at|worked|for|company called)\s+/gi, '').trim();
          if (companyName.length > 2) {
            topics.push(`COMPANY: ${companyName}`);
            console.log('🏢 Found company:', companyName);
          }
        });
      }
    });
    
    // 3. Specific projects mentioned
    const projectPatterns = [
      /built\s+(?:a\s+)?([a-zA-Z\s]+?)(?:\s|,|\.|\b(?:using|with|for|that))/gi,
      /created\s+(?:a\s+)?([a-zA-Z\s]+?)(?:\s|,|\.|\b(?:using|with|for|that))/gi,
      /developed\s+(?:a\s+)?([a-zA-Z\s]+?)(?:\s|,|\.|\b(?:using|with|for|that))/gi,
      /project\s+(?:was\s+)?(?:a\s+)?([a-zA-Z\s]+?)(?:\s|,|\.|\b(?:using|with|for|that))/gi
    ];
    
    projectPatterns.forEach(pattern => {
      const matches = answer.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const projectName = match.replace(/(built|created|developed|project\s+(?:was\s+)?(?:a\s+)?)\s+/gi, '').trim();
          if (projectName.length > 3 && !projectName.match(/^(a|an|the|with|using|for|that)$/i)) {
            topics.push(`PROJECT: ${projectName}`);
            console.log('🚀 Found project:', projectName);
          }
        });
      }
    });
    
    // 4. Technologies mentioned
    const techKeywords = this.context.resume.skills.concat([
      'react', 'vue', 'angular', 'javascript', 'typescript', 'python', 'java', 'node',
      'express', 'django', 'flask', 'spring', 'docker', 'kubernetes', 'aws', 'azure',
      'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'graphql', 'rest api'
    ]);
    
    techKeywords.forEach(tech => {
      if (lowerAnswer.includes(tech.toLowerCase())) {
        topics.push(`TECH: ${tech}`);
        console.log('💻 Found technology:', tech);
      }
    });
    
    // 5. Challenges or problems mentioned
    const challengeKeywords = ['challenge', 'problem', 'difficult', 'issue', 'bug', 'error', 'struggle'];
    challengeKeywords.forEach(keyword => {
      if (lowerAnswer.includes(keyword)) {
        topics.push(`CHALLENGE: ${keyword}`);
        console.log('⚡ Found challenge:', keyword);
      }
    });
    
    // 6. Roles/responsibilities mentioned
    const rolePatterns = [
      /(?:as|was)\s+(?:a\s+)?([a-zA-Z\s]+?)(?:\s|,|\.|\b(?:at|for|in|where))/gi,
      /role\s+(?:was\s+)?(?:a\s+)?([a-zA-Z\s]+?)(?:\s|,|\.|\b(?:at|for|in|where))/gi
    ];
    
    rolePatterns.forEach(pattern => {
      const matches = answer.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const roleName = match.replace(/(as|was|role\s+(?:was\s+)?(?:a\s+)?)\s+/gi, '').trim();
          if (roleName.length > 3) {
            topics.push(`ROLE: ${roleName}`);
            console.log('👔 Found role:', roleName);
          }
        });
      }
    });
    
    console.log('🎯 EXTRACTED TOPICS:', topics);
    return topics;
  }

  async generateNextQuestion(previousAnswer?: string): Promise<{ question: string; shouldEnd: boolean }> {
    console.log('🎯 GENERATING CONVERSATIONAL RESPONSE');
    console.log('📝 Previous Answer:', previousAnswer);
    
    // Handle first question - always ask for self-introduction
    if (this.questionCount === 0) {
      const firstQuestion = `To start, could you tell me a bit about yourself and your background in ${this.context.role}?`;
      
      this.context.conversationHistory.push({
        question: firstQuestion,
        answer: '',
        timestamp: new Date()
      });
      
      this.questionCount++;
      return { question: firstQuestion, shouldEnd: false };
    }

    // Check if interview should end
    if (this.questionCount >= this.maxQuestions || this.shouldEndInterview()) {
      return this.generateClosingQuestion();
    }

    // STRICT CONVERSATIONAL FLOW - Must follow question-generation.md
    if (!previousAnswer) {
      console.error('❌ No previous answer provided - cannot generate conversational follow-up');
      return this.getFallbackQuestion();
    }

    // Update conversation history with the user's answer
    if (this.context.conversationHistory.length > 0) {
      const lastEntry = this.context.conversationHistory[this.context.conversationHistory.length - 1];
      lastEntry.answer = previousAnswer;
    }

    // Extract what they mentioned for follow-up
    const mentionedDetails = this.extractSpecificMentions(previousAnswer);
    console.log('🔍 EXTRACTED MENTIONS:', mentionedDetails);

    // Generate acknowledgment + follow-up based on what they said
    const conversationalResponse = await this.generateStrictConversationalResponse(previousAnswer, mentionedDetails);
    
    // Add new question to history
    this.context.conversationHistory.push({
      question: conversationalResponse,
      answer: '',
      timestamp: new Date()
    });
    
    this.questionCount++;
    
    return {
      question: conversationalResponse,
      shouldEnd: false
    };
  }

  private async generateInitialQuestion(): Promise<{ question: string; shouldEnd: boolean }> {
    const topic = this.selectNextTopic();
    this.conversationManager.resetTopic(topic);
    
    const systemPrompt = this.buildInitialSystemPrompt();
    const userPrompt = this.buildInitialUserPrompt(topic);
    
    try {
      const response = await generateCompletion(systemPrompt, userPrompt, 0.8);
      const question = this.extractQuestion(response);
      
      this.context.conversationHistory.push({
        question,
        answer: '',
        timestamp: new Date()
      });
      
      this.questionCount++;
      return { question, shouldEnd: false };
    } catch (error) {
      console.error('Failed to generate initial question:', error);
      return this.getFallbackQuestion();
    }
  }

  private async generateConversationalResponse(previousAnswer: string): Promise<ConversationalResponse> {
    // Analyze the user's response
    const analysis = this.conversationManager.analyzeResponse(previousAnswer);
    
    // Determine if we should follow up or transition
    const conversationState = this.conversationManager.getState();
    const shouldFollowUp = analysis.shouldFollowUp && !this.conversationManager.shouldTransitionTopic();
    
    if (shouldFollowUp) {
      // Generate follow-up question
      const followUp = await this.generateFollowUpQuestion(previousAnswer, analysis);
      
      return {
        acknowledgment: analysis.acknowledgment,
        question: followUp,
        isFollowUp: true,
        followUpType: analysis.followUpType,
        shouldTransition: false,
        conversationPhase: 'follow_up'
      };
    } else {
      // Generate transition to new topic
      const transition = await this.generateTopicTransition(previousAnswer, analysis);
      
      return {
        acknowledgment: analysis.acknowledgment,
        question: transition,
        isFollowUp: false,
        shouldTransition: true,
        conversationPhase: 'transition'
      };
    }
  }

  private async generateFollowUpQuestion(previousAnswer: string, analysis: any): Promise<string> {
    const systemPrompt = this.buildFollowUpSystemPrompt();
    const userPrompt = this.buildFollowUpUserPrompt(previousAnswer, analysis);
    
    console.log('🔄 GENERATING FOLLOW-UP');
    console.log('📋 Follow-up Type:', analysis.followUpType);
    
    try {
      const response = await generateCompletion(systemPrompt, userPrompt, 0.85);
      const question = this.extractQuestion(response);
      
      // Update conversation state
      const state = this.conversationManager.getState();
      this.conversationManager.updateState({
        followUpCount: state.followUpCount + 1,
        topicDepth: state.topicDepth + 1,
        phase: 'follow_up'
      });
      
      return question;
    } catch (error) {
      console.error('Failed to generate follow-up:', error);
      return "Can you tell me more about that?";
    }
  }

  private async generateTopicTransition(previousAnswer: string, analysis: any): Promise<string> {
    const nextTopic = this.selectNextTopic();
    this.conversationManager.resetTopic(nextTopic);
    
    const systemPrompt = this.buildTransitionSystemPrompt();
    const userPrompt = this.buildTransitionUserPrompt(previousAnswer, nextTopic, analysis);
    
    console.log('🔄 GENERATING TOPIC TRANSITION');
    console.log('📋 Next Topic:', nextTopic);
    
    try {
      const response = await generateCompletion(systemPrompt, userPrompt, 0.8);
      const question = this.extractQuestion(response);
      
      return question;
    } catch (error) {
      console.error('Failed to generate transition:', error);
      return "Let me ask you about something else. " + this.getFallbackQuestion().question;
    }
  }

  private shouldEndInterview(): boolean {
    // End if we've had a good conversation with some depth
    if (this.questionCount >= 6 && this.context.conversationHistory.length >= 6) {
      const avgAnswerLength = this.context.conversationHistory
        .filter(entry => entry.answer)
        .reduce((sum, entry) => sum + entry.answer.split(' ').length, 0) / this.context.conversationHistory.length;
      
      // End if answers are getting very short (candidate might be tired)
      return avgAnswerLength < 10;
    }
    return false;
  }

  private buildInitialSystemPrompt(): string {
    return `You are an experienced ${this.context.role} interviewer having a natural conversation with a candidate.

🎯 CRITICAL: You must conduct this interview like a REAL HUMAN INTERVIEWER who actively listens and responds to what the candidate says.

ROLE CONTEXT:
- Position: ${this.context.role}
- Key skills: ${this.context.roleDescription}

CANDIDATE BACKGROUND:
- Name: ${this.context.resume.personalInfo.name}
- Experience: ${this.context.resume.experience.map(exp => `${exp.role} at ${exp.company} (${exp.duration})`).join(', ')}
- Skills: ${this.context.resume.skills.join(', ')}
- Education: ${this.context.resume.education.map(edu => `${edu.degree} from ${edu.institution}`).join(', ')}

INTERVIEW PRINCIPLES FROM question-generation.md:
1. ALWAYS start with self-introduction question
2. LISTEN to every response and acknowledge it
3. Ask 2-3 follow-up questions about what they mention before moving topics
4. Show genuine curiosity about their specific experiences
5. Reference previous answers in new questions

CONVERSATION FLOW:
- Ask open-ended questions that encourage storytelling
- Build on what they share with natural follow-ups
- Create conversational bridges between topics
- Make them feel heard and understood

RESPOND WITH: Only the question, naturally worded.`;
  }

  private buildFollowUpSystemPrompt(): string {
    return `You are an experienced interviewer who ACTIVELY LISTENS and follows up on what the candidate just shared.

🚨 CRITICAL FROM question-generation.md:
- You MUST acknowledge their response first
- You MUST ask about something SPECIFIC they mentioned
- You CANNOT ask generic questions unrelated to their answer
- You MUST show genuine curiosity about their experience

ACTIVE LISTENING REQUIREMENTS:
1. Start with acknowledgment: "That's interesting!" / "Great!" / "I see!"
2. Reference something specific they said
3. Ask for more details about that specific thing
4. Build on their response naturally

FORBIDDEN:
- Generic questions like "What are your strengths?"
- Questions that ignore what they just said
- Multiple questions at once
- Robotic transitions

REQUIRED FORMAT:
[Acknowledgment] + [Specific follow-up about what they mentioned]

RESPOND WITH: Only the acknowledged follow-up question.`;
  }

  private buildTransitionSystemPrompt(): string {
    return `You are an experienced interviewer transitioning to a new topic while maintaining conversational flow.

TRANSITION PRINCIPLES:
- Acknowledge what they shared previously
- Create smooth bridge to new topic
- Reference previous discussion when relevant
- Maintain natural conversation feel

TRANSITION EXAMPLES:
- "Given your experience with [previous topic], I'm curious about..."
- "That [previous response] is really interesting. Let me ask you about..."
- "Your approach to [previous topic] shows great thinking. Now I'd like to explore..."

RESPOND WITH: Only the transition question with natural bridge.`;
  }

  private buildInitialUserPrompt(topic: string): string {
    // ALWAYS start with self-introduction, regardless of topic
    if (this.questionCount === 0) {
      return `Ask them to introduce themselves and tell you about their background. This should be open-ended to let them share what they think is most important about their experience. 

Example: "To start, could you tell me a bit about yourself and your background in ${this.context.role}?"

Make it conversational and welcoming.`;
    }

    const topicQuestions = {
      'technical_experience': `Ask an open-ended question about their technical background that's relevant to the ${this.context.role} role. Reference something specific from their resume.`,
      'project_deep_dive': `Ask them to describe a significant project they worked on. Make it conversational and encourage detail.`,
      'problem_solving': `Ask about a challenging technical problem they solved. Frame it as a story they can tell.`,
      'team_collaboration': `Ask about their experience working with teams or collaborating with others.`
    };

    return topicQuestions[topic] || `Start with a warm, open-ended question about their background relevant to the ${this.context.role} position.`;
  }

  private buildFollowUpUserPrompt(previousAnswer: string, analysis: any): string {
    const conversationContext = this.conversationManager.getConversationContext();
    
    return `${conversationContext}

CANDIDATE JUST SAID: "${previousAnswer}"

🚨 CRITICAL: You MUST ask a follow-up question about something SPECIFIC they mentioned in their answer above.

WHAT THEY MENTIONED:
- Technologies: ${analysis.extractedInfo.technologies.join(', ') || 'none'}
- Projects: ${analysis.extractedInfo.projects.join(', ') || 'none'}  
- Companies: ${analysis.extractedInfo.companies.join(', ') || 'none'}
- Challenges: ${analysis.extractedInfo.challenges.join(', ') || 'none'}

MANDATORY REQUIREMENTS:
1. Start with an acknowledgment: "That's interesting!" / "Great!" / "I see!"
2. Pick ONE specific thing they mentioned (project, company, technology, challenge)
3. Ask for more details about that SPECIFIC thing
4. Use their exact words from their response

FOLLOW-UP PATTERNS (CHOOSE ONE):
- "That [specific thing they mentioned] sounds interesting! Can you tell me more about [specific detail]?"
- "I'd love to hear more about [specific project/company/tech they mentioned]. What was [specific question]?"
- "You mentioned [exact words they used] - how did you [specific follow-up]?"

EXAMPLES:
If they said: "I worked on a chatbot for my company"
CORRECT: "That chatbot project sounds interesting! What kind of functionality did you build into it?"
WRONG: "What technologies are you excited about?" (ignores what they said)

Generate ONE specific follow-up that directly references something they mentioned.`;
  }

  private buildTransitionUserPrompt(previousAnswer: string, nextTopic: string, analysis: any): string {
    const conversationContext = this.conversationManager.getConversationContext();
    
    return `${conversationContext}

CANDIDATE'S LAST RESPONSE: "${previousAnswer}"

NEXT TOPIC TO EXPLORE: ${nextTopic}

TRANSITION INSTRUCTIONS:
Create a smooth transition that:
1. Briefly acknowledges something from their previous response
2. Creates a natural bridge to the new topic: ${nextTopic}
3. Asks an engaging question about the new topic

TOPIC GUIDANCE:
- technical_experience: Explore their technical skills and experience
- project_deep_dive: Deep dive into a specific project they worked on
- problem_solving: How they approach and solve complex problems
- team_collaboration: Working with others, leadership, communication

Make the transition feel natural and conversational, not abrupt.`;
  }

  private selectNextTopic(): string {
    const conversationState = this.conversationManager.getState();
    const coveredTopics = conversationState.totalTopicsCovered;
    
    // Find uncovered topics
    const availableTopics = this.coreTopics.filter(topic => !coveredTopics.includes(topic));
    
    if (availableTopics.length === 0) {
      // All core topics covered, generate wrap-up questions
      return 'wrap_up';
    }
    
    // Return first uncovered topic
    return availableTopics[0];
  }

  private updateConversationState(previousAnswer: string, response: ConversationalResponse): void {
    // Update conversation history
    if (this.context.conversationHistory.length > 0) {
      const lastEntry = this.context.conversationHistory[this.context.conversationHistory.length - 1];
      lastEntry.answer = previousAnswer;
    }

    // Add new question to history
    this.context.conversationHistory.push({
      question: response.question,
      answer: '',
      timestamp: new Date()
    });

    // Update conversation manager
    this.conversationManager.updateState({
      lastResponse: previousAnswer,
      questionsAsked: this.questionCount
    });

    this.questionCount++;
  }

  private generateClosingQuestion(): { question: string; shouldEnd: boolean } {
    const closingQuestions = [
      "Thank you for sharing so much with me today. Before we wrap up, is there anything else you'd like to tell me about yourself or any questions you have about the role?",
      "We've covered a lot of ground today. Is there anything important about your experience that we haven't discussed yet?",
      "That was a great conversation! Do you have any questions for me about the role or the company?"
    ];
    
    const randomClosing = closingQuestions[Math.floor(Math.random() * closingQuestions.length)];
    return { question: randomClosing, shouldEnd: true };
  }

  private buildDynamicUserPrompt(previousAnswer?: string): string {
    if (this.questionCount === 0) {
      // If this is the very first interaction after the greeting, analyze their introduction
      if (previousAnswer) {
        // User just introduced themselves, now ask a follow-up based on what they said
        return `The candidate just introduced themselves by saying: "${previousAnswer}"\n\nNow ask a natural follow-up question based on something specific they mentioned in their introduction. Focus on their experience, projects, or technologies they brought up.`;
      } else {
        // This shouldn't happen now since we wait for user response to greeting
        return `Ask them to briefly introduce themselves and their background.`;
      }
    }

    if (!previousAnswer) {
      return `Generate a natural follow-up question based on the conversation so far.`;
    }

    // Build detailed context from extracted topics with priority ranking
    let specificContext = '';
    let priorityEntities: string[] = [];
    
    if (this.lastTopicsMentioned.length > 0) {
      specificContext = '\n\n=== SPECIFIC ENTITIES TO ASK ABOUT ===\n';
      
      // Prioritize entities by importance for follow-up
      const entityRanking = {
        'EXPERIENCE_DURATION': 1, // Highest priority - years of experience
        'COMPANY': 2,            // Company names are very important
        'PROJECT': 3,            // Specific projects mentioned
        'ROLE': 4,               // Job roles/titles
        'CHALLENGE': 5,          // Problems they solved
        'TECH': 6                // Technologies (lowest priority as often generic)
      };
      
      // Sort topics by priority
      const sortedTopics = this.lastTopicsMentioned.sort((a, b) => {
        const aType = a.split(':')[0];
        const bType = b.split(':')[0];
        return (entityRanking[aType] || 99) - (entityRanking[bType] || 99);
      });
      
      sortedTopics.forEach((topic, index) => {
        if (topic.startsWith('EXPERIENCE_DURATION:')) {
          const duration = topic.replace('EXPERIENCE_DURATION: ', '');
          specificContext += `🔥 PRIORITY ${index + 1}: They mentioned ${duration} of experience - ask what kind of projects or work they did during that time\n`;
          priorityEntities.push(`years of experience (${duration})`);
        }
        if (topic.startsWith('COMPANY:')) {
          const company = topic.replace('COMPANY: ', '');
          specificContext += `🔥 PRIORITY ${index + 1}: They mentioned working at "${company}" - ask about their role, responsibilities, or projects there\n`;
          priorityEntities.push(`company (${company})`);
        }
        if (topic.startsWith('PROJECT:')) {
          const project = topic.replace('PROJECT: ', '');
          specificContext += `🔥 PRIORITY ${index + 1}: They mentioned a project: "${project}" - ask about implementation details, challenges, or technologies used\n`;
          priorityEntities.push(`project (${project})`);
        }
        if (topic.startsWith('TECH:')) {
          const tech = topic.replace('TECH: ', '');
          specificContext += `🔥 PRIORITY ${index + 1}: They mentioned "${tech}" - ask how they used it, what they built with it, or challenges they faced\n`;
          priorityEntities.push(`technology (${tech})`);
        }
        if (topic.startsWith('CHALLENGE:')) {
          const challenge = topic.replace('CHALLENGE: ', '');
          specificContext += `🔥 PRIORITY ${index + 1}: They mentioned a ${challenge} - ask what made it challenging and how they solved it\n`;
          priorityEntities.push(`challenge (${challenge})`);
        }
        if (topic.startsWith('ROLE:')) {
          const role = topic.replace('ROLE: ', '');
          specificContext += `🔥 PRIORITY ${index + 1}: They mentioned being a "${role}" - ask about their specific responsibilities or achievements\n`;
          priorityEntities.push(`role (${role})`);
        }
      });
      
      if (priorityEntities.length > 0) {
        specificContext += `\n🎯 PRIMARY TARGET: Focus on PRIORITY 1 - the ${priorityEntities[0]} they mentioned\n`;
      }
    }

    const prompt = `The candidate just said: "${previousAnswer}"${specificContext}

🚨 CRITICAL INSTRUCTION: You MUST ask about the PRIMARY TARGET (Priority 1) entity above. Do NOT ask generic questions.

MANDATORY REQUIREMENTS:
1. Ask ONLY about the PRIORITY 1 entity (the highest priority one)
2. Use the candidate's exact words from their answer
3. Ask for specific details, examples, or elaboration
4. Be genuinely curious and conversational

REQUIRED QUESTION PATTERNS:
For Experience Duration: "Tell me more about those [X years] - what kind of projects did you work on?"
For Companies: "What was your role at [Company Name]?" or "What kind of work did you do at [Company]?"
For Projects: "Can you walk me through how you built [Project Name]?" or "What challenges did you face with [Project]?"
For Technologies: "How did you use [Technology] in your work?" or "What did you build with [Technology]?"
For Challenges: "What made that [challenge] particularly difficult?" or "How did you overcome that [challenge]?"
For Roles: "What were your main responsibilities as [Role]?"

❌ FORBIDDEN - DO NOT ASK:
- Generic questions like "What's your greatest strength?"
- Questions unrelated to what they just said
- Multiple questions at once
- Vague questions that don't reference their specific words

✅ REQUIRED FORMAT:
Start with: "That's interesting that you mentioned [specific thing]..." or "Tell me more about [specific thing they said]..."

Example:
If they said: "I have 5 years of experience building React applications at TechCorp"
CORRECT: "Tell me more about those 5 years at TechCorp - what kind of React applications did you build there?"
WRONG: "What programming languages do you know?" (generic, ignores what they said)

Generate exactly ONE follow-up question that directly references something specific they mentioned.`;

    console.log('🎯 SENDING PROMPT TO AI:', prompt);
    return prompt;
  }

  private extractQuestion(response: string): string {
    // Clean up the response and extract just the question
    let question = response.trim();
    
    // Remove any metadata or formatting
    question = question.replace(/^(Question|Q\d+):\s*/i, '');
    question = question.replace(/^\d+\.\s*/, '');
    
    // Ensure it ends with a question mark
    if (!question.endsWith('?') && !question.endsWith('.')) {
      question += '?';
    }

    return question;
  }


  private getFallbackQuestion(): { question: string; shouldEnd: boolean } {
    const fallbackQuestions = [
      "Tell me about a challenging project you worked on recently.",
      "What technologies are you most excited about right now?",
      "How do you approach problem-solving in your development work?",
      "Describe a time when you had to learn a new technology quickly.",
      "What's the most interesting technical challenge you've solved?"
    ];

    const randomQuestion = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
    return { question: randomQuestion, shouldEnd: false };
  }

  getContext(): InterviewContext {
    return this.context;
  }

  getProgress(): { current: number; total: number; percentage: number } {
    // More dynamic progress based on conversation depth
    const estimatedTotal = Math.max(6, Math.min(this.maxQuestions, this.questionCount + 3));
    return {
      current: this.questionCount,
      total: estimatedTotal,
      percentage: Math.min(100, (this.questionCount / estimatedTotal) * 100)
    };
  }
}