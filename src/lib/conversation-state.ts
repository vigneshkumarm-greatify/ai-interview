export interface ConversationMemory {
  topic: string;
  details: string[];
  technologies: string[];
  projects: string[];
  companies: string[];
  challenges: string[];
  outcomes: string[];
  timestamp: Date;
}

export interface ConversationState {
  phase: 'initial' | 'follow_up' | 'transition' | 'completion';
  currentTopic: string;
  topicDepth: number; // How deep we've gone into current topic (0-3)
  followUpCount: number; // Track follow-ups for current answer
  conversationMemory: ConversationMemory[];
  lastResponse: string;
  questionsAsked: number;
  maxQuestionsPerTopic: number;
  totalTopicsCovered: string[];
}

export class ConversationManager {
  private state: ConversationState;
  private readonly maxFollowUps = 3;
  private readonly maxTopicDepth = 3;

  constructor() {
    this.state = {
      phase: 'initial',
      currentTopic: '',
      topicDepth: 0,
      followUpCount: 0,
      conversationMemory: [],
      lastResponse: '',
      questionsAsked: 0,
      maxQuestionsPerTopic: 3,
      totalTopicsCovered: []
    };
  }

  analyzeResponse(response: string): {
    acknowledgment: string;
    shouldFollowUp: boolean;
    followUpType: 'clarification' | 'example' | 'challenge' | 'outcome' | 'technical';
    extractedInfo: {
      technologies: string[];
      projects: string[];
      companies: string[];
      challenges: string[];
      outcomes: string[];
    };
  } {
    console.log('🧠 ANALYZING RESPONSE:', response);
    
    const lowerResponse = response.toLowerCase();
    
    // Extract information from response
    const extractedInfo = this.extractInformation(response);
    
    // Generate natural acknowledgment
    const acknowledgment = this.generateAcknowledment(response, extractedInfo);
    
    // Determine if we should follow up
    const shouldFollowUp = this.shouldGenerateFollowUp(response);
    
    // Determine follow-up type based on response content and current depth
    const followUpType = this.determineFollowUpType(response, this.state.topicDepth);
    
    // Update conversation memory
    this.updateConversationMemory(extractedInfo);
    
    console.log('💭 ANALYSIS RESULT:', {
      acknowledgment,
      shouldFollowUp,
      followUpType,
      extractedInfo
    });
    
    return {
      acknowledgment,
      shouldFollowUp,
      followUpType,
      extractedInfo
    };
  }

  private extractInformation(response: string): {
    technologies: string[];
    projects: string[];
    companies: string[];
    challenges: string[];
    outcomes: string[];
  } {
    const technologies: string[] = [];
    const projects: string[] = [];
    const companies: string[] = [];
    const challenges: string[] = [];
    const outcomes: string[] = [];

    // Technology extraction
    const techPatterns = [
      'react', 'vue', 'angular', 'javascript', 'typescript', 'python', 'java', 'node',
      'express', 'django', 'flask', 'spring', 'docker', 'kubernetes', 'aws', 'azure',
      'mongodb', 'postgresql', 'mysql', 'redis', 'graphql', 'rest api', 'microservices'
    ];
    
    techPatterns.forEach(tech => {
      if (response.toLowerCase().includes(tech)) {
        technologies.push(tech);
      }
    });

    // Project extraction
    const projectMatches = response.match(/(?:built|created|developed|worked on|project was)\s+(?:a\s+)?([a-zA-Z\s]+?)(?:\s|,|\.|\b(?:using|with|for|that))/gi);
    if (projectMatches) {
      projectMatches.forEach(match => {
        const project = match.replace(/(?:built|created|developed|worked on|project was)\s+(?:a\s+)?/gi, '').trim();
        if (project.length > 3) {
          projects.push(project);
        }
      });
    }

    // Company extraction
    const companyMatches = response.match(/(?:at|for|with)\s+([A-Z][a-zA-Z\s&]+?)(?:\s|,|\.|\b(?:we|where|I|the))/g);
    if (companyMatches) {
      companyMatches.forEach(match => {
        const company = match.replace(/(?:at|for|with)\s+/gi, '').trim();
        if (company.length > 2 && !company.match(/^(we|where|I|the)$/i)) {
          companies.push(company);
        }
      });
    }

    // Challenge extraction
    const challengeKeywords = ['challenge', 'problem', 'difficult', 'issue', 'bug', 'error', 'struggle', 'hard', 'complex'];
    challengeKeywords.forEach(keyword => {
      if (response.toLowerCase().includes(keyword)) {
        challenges.push(keyword);
      }
    });

    // Outcome extraction
    const outcomeKeywords = ['solved', 'fixed', 'improved', 'increased', 'reduced', 'successful', 'achieved', 'delivered'];
    outcomeKeywords.forEach(keyword => {
      if (response.toLowerCase().includes(keyword)) {
        outcomes.push(keyword);
      }
    });

    return { technologies, projects, companies, challenges, outcomes };
  }

  private generateAcknowledment(response: string, extractedInfo: any): string {
    const acknowledgments = [
      "That's interesting!",
      "I see.",
      "Great example!",
      "That sounds like valuable experience.",
      "Excellent!",
      "That's a good approach.",
      "Nice work!",
      "That makes sense."
    ];

    // Contextual acknowledgments based on content
    if (extractedInfo.challenges.length > 0) {
      const challengeAcks = [
        "That sounds challenging!",
        "Those kinds of problems can be tricky to solve.",
        "Complex issues like that really test your skills."
      ];
      return challengeAcks[Math.floor(Math.random() * challengeAcks.length)];
    }

    if (extractedInfo.technologies.length > 0) {
      const techAcks = [
        "Great technology choices!",
        "That's a solid tech stack.",
        "Those are excellent tools for that kind of project."
      ];
      return techAcks[Math.floor(Math.random() * techAcks.length)];
    }

    if (extractedInfo.projects.length > 0) {
      const projectAcks = [
        "That project sounds really interesting!",
        "What a great project to work on!",
        "That must have been an engaging project."
      ];
      return projectAcks[Math.floor(Math.random() * projectAcks.length)];
    }

    // Default acknowledgment
    return acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
  }

  private shouldGenerateFollowUp(response: string): boolean {
    // Don't follow up if we've reached max follow-ups for this topic
    if (this.state.followUpCount >= this.maxFollowUps) {
      return false;
    }

    // Don't follow up if response is too short (likely incomplete)
    if (response.trim().split(' ').length < 5) {
      return true; // Actually, we DO want to follow up on short responses for clarification
    }

    // Follow up if response mentions interesting details that can be explored
    const interestingKeywords = [
      'project', 'challenge', 'problem', 'built', 'created', 'developed', 
      'team', 'solution', 'implementation', 'architecture'
    ];

    const hasInterestingContent = interestingKeywords.some(keyword => 
      response.toLowerCase().includes(keyword)
    );

    return hasInterestingContent || this.state.topicDepth < this.maxTopicDepth;
  }

  private determineFollowUpType(response: string, currentDepth: number): 'clarification' | 'example' | 'challenge' | 'outcome' | 'technical' {
    const lowerResponse = response.toLowerCase();

    // Based on depth, ask different types of questions
    switch (currentDepth) {
      case 0: // First follow-up - get more details
        if (lowerResponse.includes('project') || lowerResponse.includes('built')) {
          return 'technical';
        }
        return 'clarification';

      case 1: // Second follow-up - explore challenges or examples
        if (lowerResponse.includes('challenge') || lowerResponse.includes('problem')) {
          return 'challenge';
        }
        return 'example';

      case 2: // Third follow-up - outcomes and results
        return 'outcome';

      default:
        return 'clarification';
    }
  }

  private updateConversationMemory(extractedInfo: any): void {
    // Add new information to conversation memory
    const memoryEntry: ConversationMemory = {
      topic: this.state.currentTopic,
      details: [this.state.lastResponse],
      technologies: extractedInfo.technologies,
      projects: extractedInfo.projects,
      companies: extractedInfo.companies,
      challenges: extractedInfo.challenges,
      outcomes: extractedInfo.outcomes,
      timestamp: new Date()
    };

    this.state.conversationMemory.push(memoryEntry);
  }

  updateState(updates: Partial<ConversationState>): void {
    this.state = { ...this.state, ...updates };
  }

  getState(): ConversationState {
    return { ...this.state };
  }

  shouldTransitionTopic(): boolean {
    return this.state.followUpCount >= this.maxFollowUps || 
           this.state.topicDepth >= this.maxTopicDepth;
  }

  getConversationContext(): string {
    // Generate context string from conversation memory for use in prompts
    const recentMemory = this.state.conversationMemory.slice(-3); // Last 3 entries
    
    let context = "=== CONVERSATION CONTEXT ===\n";
    
    if (recentMemory.length > 0) {
      context += "Previously discussed:\n";
      recentMemory.forEach((memory, index) => {
        context += `${index + 1}. Topic: ${memory.topic}\n`;
        if (memory.technologies.length > 0) {
          context += `   Technologies: ${memory.technologies.join(', ')}\n`;
        }
        if (memory.projects.length > 0) {
          context += `   Projects: ${memory.projects.join(', ')}\n`;
        }
        if (memory.companies.length > 0) {
          context += `   Companies: ${memory.companies.join(', ')}\n`;
        }
      });
      context += "\n";
    }

    return context;
  }

  resetTopic(newTopic: string): void {
    this.state.currentTopic = newTopic;
    this.state.topicDepth = 0;
    this.state.followUpCount = 0;
    this.state.phase = this.state.questionsAsked === 0 ? 'initial' : 'transition';
    this.state.totalTopicsCovered.push(newTopic);
  }
}