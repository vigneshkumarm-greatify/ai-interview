import { ParsedResume, InterviewQuestion, InterviewSession } from '@/types/interview';
import { generateCompletion } from './openai';

export class InterviewEngine {
  private session: InterviewSession | null = null;
  private questionIndex = 0;

  async startInterview(resume: ParsedResume): Promise<InterviewSession> {
    // Generate personalized questions based on resume
    const questions = await this.generateQuestions(resume);
    
    this.session = {
      id: Date.now().toString(),
      resume,
      questions,
      responses: [],
      startTime: new Date(),
      status: 'in-progress'
    };

    return this.session;
  }

  getCurrentQuestion(): InterviewQuestion | null {
    if (!this.session || this.questionIndex >= this.session.questions.length) {
      return null;
    }
    
    return this.session.questions[this.questionIndex];
  }

  async getNextQuestion(): Promise<InterviewQuestion | null> {
    this.questionIndex++;
    return this.getCurrentQuestion();
  }

  async generateQuestions(resume: ParsedResume): Promise<InterviewQuestion[]> {
    const systemPrompt = `You are an experienced interviewer conducting a job interview. Based on the candidate's resume, generate 5 diverse interview questions.

    Resume Summary:
    - Name: ${resume.personalInfo.name}
    - Experience: ${resume.experience.map(exp => `${exp.role} at ${exp.company}`).join(', ')}
    - Skills: ${resume.skills.join(', ')}
    - Education: ${resume.education.map(edu => `${edu.degree} from ${edu.institution}`).join(', ')}

    Generate exactly 5 questions in this JSON format:
    [
      {
        "id": "1",
        "question": "Tell me about yourself and your background.",
        "category": "behavioral",
        "expectedDuration": 60000
      },
      {
        "id": "2", 
        "question": "Describe a challenging project you worked on at [specific company from resume].",
        "category": "behavioral",
        "expectedDuration": 90000
      },
      {
        "id": "3",
        "question": "How would you approach [technical question related to their skills]?",
        "category": "technical", 
        "expectedDuration": 120000
      },
      {
        "id": "4",
        "question": "Where do you see yourself in 5 years?",
        "category": "behavioral",
        "expectedDuration": 60000
      },
      {
        "id": "5",
        "question": "Do you have any questions for me about the role or company?",
        "category": "behavioral",
        "expectedDuration": 60000
      }
    ]

    Make questions specific to their experience and skills. Use actual company names and technologies from their resume.`;

    try {
      const response = await generateCompletion(systemPrompt, 'Generate interview questions based on this resume.', 0.7);
      const questions = JSON.parse(response);
      
      // Validate and return questions
      return questions.map((q: any, index: number) => ({
        id: (index + 1).toString(),
        question: q.question,
        category: q.category || 'behavioral',
        expectedDuration: q.expectedDuration || 60000
      }));
    } catch (error) {
      console.error('Failed to generate questions:', error);
      
      // Fallback questions
      return [
        {
          id: '1',
          question: 'Tell me about yourself and your professional background.',
          category: 'behavioral',
          expectedDuration: 60000
        },
        {
          id: '2',
          question: 'Describe a challenging project you worked on recently and how you overcame the difficulties.',
          category: 'behavioral',
          expectedDuration: 90000
        },
        {
          id: '3',
          question: 'What interests you most about this type of role?',
          category: 'behavioral',
          expectedDuration: 60000
        },
        {
          id: '4',
          question: 'Where do you see yourself in the next 5 years?',
          category: 'behavioral',
          expectedDuration: 60000
        },
        {
          id: '5',
          question: 'Do you have any questions for me?',
          category: 'behavioral',
          expectedDuration: 60000
        }
      ];
    }
  }

  getInterviewProgress(): { current: number; total: number; percentage: number } {
    if (!this.session) return { current: 0, total: 0, percentage: 0 };
    
    return {
      current: this.questionIndex,
      total: this.session.questions.length,
      percentage: (this.questionIndex / this.session.questions.length) * 100
    };
  }

  isInterviewComplete(): boolean {
    if (!this.session) return false;
    return this.questionIndex >= this.session.questions.length;
  }

  completeInterview(): InterviewSession | null {
    if (!this.session) return null;
    
    this.session.endTime = new Date();
    this.session.status = 'completed';
    
    return this.session;
  }
}