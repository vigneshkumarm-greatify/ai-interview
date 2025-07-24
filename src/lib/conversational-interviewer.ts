import { ParsedResume } from '@/types/interview';
import { generateCompletion } from './openai';

interface ConversationEntry {
  question: string;
  answer: string;
  timestamp: Date;
  followUpCount: number;
}

export class ConversationalInterviewer {
  private resume: ParsedResume;
  private role: string;
  private roleDescription: string;
  private conversation: ConversationEntry[] = [];
  private currentTopicFollowUps = 0;
  private maxFollowUpsPerTopic = 3;
  private questionsAsked = 0;
  private maxQuestions = 8;

  constructor(resume: ParsedResume, role: string, roleDescription: string) {
    this.resume = resume;
    this.role = role;
    this.roleDescription = roleDescription;
  }

  async generateNextQuestion(previousAnswer?: string): Promise<{ question: string; shouldEnd: boolean }> {
    console.log('🎯 CONVERSATIONAL INTERVIEWER - GENERATING NEXT QUESTION');
    console.log('📝 Previous Answer:', previousAnswer);
    console.log('📊 Questions Asked:', this.questionsAsked);

    // First question - always introduction
    if (this.questionsAsked === 0) {
      const firstQuestion = `To start, could you tell me a bit about yourself and your background in ${this.role}?`;
      
      this.conversation.push({
        question: firstQuestion,
        answer: '',
        timestamp: new Date(),
        followUpCount: 0
      });
      
      this.questionsAsked++;
      return { question: firstQuestion, shouldEnd: false };
    }

    // MUST have previous answer to continue conversation
    if (!previousAnswer || previousAnswer.trim().length === 0) {
      console.error('❌ No previous answer - cannot continue conversation');
      return { 
        question: "I'm having trouble processing your response. Could you please repeat that?", 
        shouldEnd: false 
      };
    }

    // Update the last conversation entry with the user's answer
    if (this.conversation.length > 0) {
      this.conversation[this.conversation.length - 1].answer = previousAnswer;
    }

    // MAKE API CALL TO CONVERSATION MANAGER
    const conversationalResponse = await this.callConversationManagerAPI(previousAnswer);
    
    // Handle API response
    if (!conversationalResponse.success) {
      return { 
        question: conversationalResponse.error || "I'm having trouble processing your response. Could you please repeat that?", 
        shouldEnd: false 
      };
    }

    // Combine acknowledgment and question
    const fullResponse = `${conversationalResponse.acknowledgment} ${conversationalResponse.nextQuestion}`;
    
    // Add new question to conversation
    this.conversation.push({
      question: fullResponse,
      answer: '',
      timestamp: new Date(),
      followUpCount: this.currentTopicFollowUps
    });

    this.questionsAsked++;
    
    // Check if interview should end
    const shouldEnd = conversationalResponse.responseType === 'complete' || this.questionsAsked >= this.maxQuestions;
    
    return { 
      question: fullResponse, 
      shouldEnd: shouldEnd 
    };
  }

  private async generateConversationalResponse(userAnswer: string): Promise<string> {
    console.log('🧠 ANALYZING USER RESPONSE FOR CONVERSATIONAL FOLLOW-UP');
    
    // Extract what they specifically mentioned
    const mentions = this.extractMentions(userAnswer);
    console.log('🔍 EXTRACTED MENTIONS:', mentions);

    // Decide: Follow-up or Transition based on conversation depth
    const shouldFollowUp = this.shouldGenerateFollowUp(userAnswer, mentions);
    
    if (shouldFollowUp) {
      console.log('➡️ GENERATING FOLLOW-UP QUESTION');
      this.currentTopicFollowUps++;
      return await this.generateFollowUpQuestion(userAnswer, mentions);
    } else {
      console.log('🔄 GENERATING TOPIC TRANSITION');
      this.currentTopicFollowUps = 0; // Reset for new topic
      return await this.generateTopicTransition(userAnswer, mentions);
    }
  }

  private extractMentions(answer: string): {
    projects: string[];
    technologies: string[];
    companies: string[];
    challenges: string[];
    timeframes: string[];
    keyDetails: string[];
  } {
    const lowerAnswer = answer.toLowerCase();
    const mentions = {
      projects: [] as string[],
      technologies: [] as string[],
      companies: [] as string[],
      challenges: [] as string[],
      timeframes: [] as string[],
      keyDetails: [] as string[]
    };

    // Extract projects - things they built/worked on
    const projectMatches = answer.match(/(?:worked on|built|created|developed|made)\s+(?:a\s+)?([^,.!?]+?)(?:[,.!?]|$)/gi);
    if (projectMatches) {
      projectMatches.forEach(match => {
        const project = match.replace(/(?:worked on|built|created|developed|made)\s+(?:a\s+)?/gi, '').trim();
        if (project.length > 3) mentions.projects.push(project);
      });
    }

    // Extract technologies
    const techKeywords = [
      'react', 'vue', 'angular', 'javascript', 'typescript', 'python', 'java', 'node',
      'chatbot', 'ai', 'machine learning', 'api', 'database', 'web', 'mobile', 'software',
      'platform', 'system', 'application', 'frontend', 'backend', 'microservices'
    ];
    
    techKeywords.forEach(tech => {
      if (lowerAnswer.includes(tech)) {
        mentions.technologies.push(tech);
      }
    });

    // Extract companies/organizations
    const companyMatches = answer.match(/(?:at|for|with)\s+([A-Z][a-zA-Z\s&.-]+?)(?:\s+[a-z]|\s*[,.!?]|$)/g);
    if (companyMatches) {
      companyMatches.forEach(match => {
        const company = match.replace(/(?:at|for|with)\s+/gi, '').trim();
        if (company.length > 2) mentions.companies.push(company);
      });
    }

    // Extract timeframes
    const timeMatches = answer.match(/\d+\s+(?:years?|months?|weeks?)/gi);
    if (timeMatches) {
      mentions.timeframes.push(...timeMatches);
    }

    // Extract challenges/problems
    const challengeWords = ['challenge', 'problem', 'difficult', 'hard', 'complex', 'issue', 'struggle', 'obstacle'];
    challengeWords.forEach(word => {
      if (lowerAnswer.includes(word)) {
        mentions.challenges.push(word);
      }
    });

    // Extract key phrases (important sentences)
    const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 15);
    mentions.keyDetails = sentences.map(s => s.trim()).slice(0, 3); // Top 3 most important details

    return mentions;
  }

  private shouldGenerateFollowUp(answer: string, mentions: any): boolean {
    // Don't follow up if we've reached max follow-ups for this topic
    if (this.currentTopicFollowUps >= this.maxFollowUpsPerTopic) {
      return false;
    }

    // Always follow up if they mentioned specific projects, technologies, or gave detailed responses
    if (mentions.projects.length > 0 || mentions.technologies.length > 0 || answer.length > 100) {
      return true;
    }

    // Follow up if answer seems incomplete (too short)
    if (answer.trim().split(' ').length < 20) {
      return true;
    }

    return false;
  }

  private async generateFollowUpQuestion(userAnswer: string, mentions: any): Promise<string> {
    const systemPrompt = `You are an experienced interviewer conducting a natural conversation. You just heard the candidate's response and you're genuinely curious to learn more.

CRITICAL REQUIREMENTS FROM question-generation.md:
1. Start with an acknowledgment: "That's interesting!", "Great!", "I see!", "That sounds fascinating!"
2. Ask ONE follow-up question about something SPECIFIC they mentioned
3. Show active listening by referencing their exact words
4. Be naturally curious about details, challenges, or outcomes

CONVERSATION STYLE:
- Natural, human-like curiosity
- Build on what they just shared
- Dig deeper into interesting details
- Ask about implementation, challenges, or results

RESPOND WITH: Acknowledgment + One specific follow-up question`;

    const userPrompt = `The candidate just said: "${userAnswer}"

SPECIFIC THINGS THEY MENTIONED:
- Projects: ${mentions.projects.join(', ') || 'none'}
- Technologies: ${mentions.technologies.join(', ') || 'none'}
- Companies: ${mentions.companies.join(', ') || 'none'}
- Timeframes: ${mentions.timeframes.join(', ') || 'none'}
- Key Details: ${mentions.keyDetails.join(' | ') || 'none'}

TASK:
Generate an acknowledgment + specific follow-up question about something they mentioned.

EXAMPLE PATTERNS:
- "That's interesting! [Specific thing] sounds complex. How did you [specific question]?"
- "Great! I'd love to hear more about [specific mention]. What [specific aspect]?"
- "That sounds challenging! When you worked on [specific project], what [specific detail]?"

Generate ONE acknowledged follow-up that shows you listened to their specific response.`;

    console.log('🎯 FOLLOW-UP SYSTEM PROMPT:', systemPrompt);
    console.log('🎯 FOLLOW-UP USER PROMPT:', userPrompt);

    try {
      const response = await generateCompletion(systemPrompt, userPrompt, 0.8);
      console.log('✨ FOLLOW-UP AI RESPONSE:', response);
      return response.trim();
    } catch (error) {
      console.error('❌ Failed to generate follow-up:', error);
      
      // Emergency fallback based on mentions
      if (mentions.projects.length > 0) {
        return `That's interesting! Tell me more about that ${mentions.projects[0]} - what specific challenges did you face?`;
      } else if (mentions.technologies.length > 0) {
        return `Great! How did you work with ${mentions.technologies[0]} in that project?`;
      } else {
        return `That sounds fascinating! Can you elaborate on the most challenging part of what you just described?`;
      }
    }
  }

  private async generateTopicTransition(userAnswer: string, mentions: any): Promise<string> {
    const conversationContext = this.buildConversationContext();
    
    const systemPrompt = `You are an experienced interviewer transitioning to a new topic while maintaining natural conversation flow.

CRITICAL REQUIREMENTS FROM question-generation.md:
1. Acknowledge what they shared: "That's great experience with [topic]"
2. Create smooth bridge: "Given your [previous topic], I'm curious about..."
3. Ask engaging question about new area
4. Reference previous conversation naturally

TRANSITION STYLE:
- Natural conversational bridges
- Acknowledge previous topic before moving
- Connect topics logically
- Maintain interview rapport

RESPOND WITH: Acknowledgment + Natural transition + New question`;

    const userPrompt = `${conversationContext}

CANDIDATE'S LAST RESPONSE: "${userAnswer}"

WHAT THEY MENTIONED:
- Projects: ${mentions.projects.join(', ') || 'none'}
- Technologies: ${mentions.technologies.join(', ') || 'none'}
- Companies: ${mentions.companies.join(', ') || 'none'}

TASK:
Create a natural transition that:
1. Acknowledges their previous response
2. Creates smooth bridge to new topic area
3. Asks engaging question about different aspect of their experience

EXAMPLE PATTERNS:
- "That's excellent experience with [previous topic]. Given your background, I'm curious about [new topic area]..."
- "Great work on [specific project]. That shows strong [skill]. Now I'd like to explore [new area]..."

Generate natural transition with acknowledgment + bridge + new question.`;

    console.log('🔄 TRANSITION SYSTEM PROMPT:', systemPrompt);
    console.log('🔄 TRANSITION USER PROMPT:', userPrompt);

    try {
      const response = await generateCompletion(systemPrompt, userPrompt, 0.8);
      console.log('✨ TRANSITION AI RESPONSE:', response);
      return response.trim();
    } catch (error) {
      console.error('❌ Failed to generate transition:', error);
      return `That's great experience! Now I'd like to learn about a different aspect of your background. Can you tell me about a challenging problem you had to solve?`;
    }
  }

  private buildConversationContext(): string {
    let context = "=== CONVERSATION HISTORY ===\n";
    
    this.conversation.slice(-3).forEach((entry, index) => {
      context += `${index + 1}. AI asked: "${entry.question}"\n`;
      if (entry.answer) {
        context += `   User said: "${entry.answer.substring(0, 100)}..."\n`;
      }
    });
    
    return context;
  }

  private generateClosingQuestion(): { question: string; shouldEnd: boolean } {
    const closingQuestions = [
      "Thank you for sharing so much about your experience! Before we wrap up, is there anything else important about your background that we haven't discussed?",
      "This has been a great conversation! Do you have any questions for me about the role or the company?",
      "We've covered a lot of ground today. Is there anything else you'd like to highlight about your experience or any questions about the position?"
    ];
    
    const randomClosing = closingQuestions[Math.floor(Math.random() * closingQuestions.length)];
    return { question: randomClosing, shouldEnd: true };
  }

  getProgress(): { current: number; total: number; percentage: number } {
    return {
      current: this.questionsAsked,
      total: this.maxQuestions,
      percentage: Math.min(100, (this.questionsAsked / this.maxQuestions) * 100)
    };
  }

  getContext() {
    return {
      resume: this.resume,
      role: this.role,
      roleDescription: this.roleDescription,
      conversationHistory: this.conversation,
      questionsAsked: this.questionsAsked,
      currentTopicFollowUps: this.currentTopicFollowUps
    };
  }

  private async callConversationManagerAPI(latestUserResponse: string): Promise<any> {
    console.log('📡 CALLING CONVERSATION MANAGER API');
    
    try {
      // Build conversation history for API
      const conversationForAPI = this.conversation.flatMap(entry => {
        const messages = [];
        messages.push({
          speaker: 'AI' as const,
          message: entry.question,
          timestamp: entry.timestamp
        });
        if (entry.answer) {
          messages.push({
            speaker: 'USER' as const,
            message: entry.answer,
            timestamp: new Date(entry.timestamp.getTime() + 1000) // Add 1 second for user response
          });
        }
        return messages;
      });

      // Add the latest user response if not already in conversation
      if (latestUserResponse && this.conversation.length > 0) {
        conversationForAPI.push({
          speaker: 'USER' as const,
          message: latestUserResponse,
          timestamp: new Date()
        });
      }

      // Prepare resume context
      const resumeContext = {
        name: this.resume.personalInfo.name,
        experience: this.resume.experience.map(exp => `${exp.role} at ${exp.company}`).join(', '),
        skills: this.resume.skills
      };

      console.log('📋 Conversation Length:', conversationForAPI.length);
      console.log('📝 Latest Response:', latestUserResponse);

      // Make API call
      const response = await fetch('/api/conversation-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation: conversationForAPI,
          latestUserResponse,
          role: this.role,
          resumeContext
        })
      });

      const data = await response.json();
      console.log('✅ API Response:', data);

      // Update topic tracking based on response
      if (data.success && data.responseType === 'transition') {
        this.currentTopicFollowUps = 0;
      } else if (data.success) {
        this.currentTopicFollowUps++;
      }

      return data;
    } catch (error) {
      console.error('❌ API Call Failed:', error);
      return {
        success: false,
        error: "I'm having trouble processing your response. Could you please repeat that?"
      };
    }
  }
}