import { ParsedResume, ResumeFeedback } from '@/types/interview';
import { generateCompletion } from './openai';

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  console.log('extractTextFromPDF called with buffer size:', buffer.length);
  try {
    console.log('Attempting to import pdf-parse...');
    const pdf = await import('pdf-parse');
    console.log('pdf-parse imported successfully');
    
    console.log('Calling pdf-parse with buffer...');
    const data = await pdf.default(buffer);
    console.log('PDF parsed successfully, text length:', data.text.length);
    
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack'
    });
    throw new Error('Failed to extract text from PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

export async function extractTextFromFile(file: File): Promise<string> {
  console.log('extractTextFromFile called with:', {
    type: file.type,
    name: file.name,
    size: file.size
  });
  
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    console.log('Processing as PDF file');
    try {
      const arrayBuffer = await file.arrayBuffer();
      console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);
      const buffer = Buffer.from(arrayBuffer);
      console.log('Buffer created, calling extractTextFromPDF');
      return await extractTextFromPDF(buffer);
    } catch (error) {
      console.error('Error in PDF processing:', error);
      throw error;
    }
  } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
    console.log('Processing as TXT file');
    try {
      const text = await file.text();
      console.log('Text extracted from TXT file, length:', text.length);
      return text;
    } catch (error) {
      console.error('Error in TXT processing:', error);
      throw error;
    }
  } else {
    console.log('Unsupported file type:', fileType, fileName);
    throw new Error('Unsupported file type. Please upload a PDF or TXT file.');
  }
}

export async function parseResumeContent(resumeText: string): Promise<ParsedResume> {
  console.log('parseResumeContent called with text length:', resumeText.length);
  
  const systemPrompt = `You are an expert resume parser. Extract and structure the following information from the resume:
  - Personal information (name, email, phone)
  - Work experience (company, role, duration, responsibilities)
  - Skills (technical and soft skills)
  - Education (institution, degree, year)
  
  IMPORTANT: Also analyze the resume quality and provide feedback.
  
  Return the data as a valid JSON object matching this exact structure:
  {
    "personalInfo": { "name": "", "email": "", "phone": "" },
    "experience": [{ "company": "", "role": "", "duration": "", "responsibilities": [] }],
    "skills": [],
    "education": [{ "institution": "", "degree": "", "year": "" }],
    "rawText": "[original resume text]",
    "feedback": {
      "score": 0,
      "strengths": [],
      "improvements": [],
      "formatting": "",
      "contentQuality": ""
    }
  }
  
  For the feedback:
  - score: Rate the resume quality 0-100
  - strengths: List 2-3 strong points
  - improvements: List 2-3 areas to improve
  - formatting: Comment on structure and readability
  - contentQuality: Assess the depth and relevance of content`;
  
  console.log('Calling OpenAI generateCompletion...');
  try {
    const response = await generateCompletion(systemPrompt, resumeText, 0.3);
    console.log('OpenAI response received, length:', response.length);
    console.log('First 300 chars of response:', response.substring(0, 300));
    
    console.log('Attempting to parse JSON response...');
    const parsed = JSON.parse(response);
    console.log('JSON parsed successfully');
    
    // Ensure rawText is included
    parsed.rawText = resumeText;
    console.log('parseResumeContent completed successfully');
    return parsed as ParsedResume;
  } catch (error) {
    console.error('Error in parseResumeContent:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw new Error('Failed to parse resume: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

export async function generateResumeFeedback(resumeText: string): Promise<ResumeFeedback> {
  const systemPrompt = `You are a professional resume reviewer. Analyze this resume and provide constructive feedback.
  
  Return a JSON object with this structure:
  {
    "score": 85,
    "strengths": ["Clear work history", "Strong technical skills section"],
    "improvements": ["Add quantifiable achievements", "Include more action verbs"],
    "formatting": "Well-structured with clear sections",
    "contentQuality": "Good technical depth but lacks specific project outcomes"
  }`;
  
  const response = await generateCompletion(systemPrompt, resumeText, 0.5);
  
  try {
    return JSON.parse(response) as ResumeFeedback;
  } catch (error) {
    console.error('Error generating resume feedback:', error);
    return {
      score: 70,
      strengths: ['Resume uploaded successfully'],
      improvements: ['Unable to analyze at this time'],
      formatting: 'Standard format detected',
      contentQuality: 'Content received'
    };
  }
}

export function validateResumeFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['application/pdf', 'text/plain'];
  const allowedExtensions = ['.pdf', '.txt'];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }
  
  const hasValidType = allowedTypes.includes(file.type);
  const hasValidExtension = allowedExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );
  
  if (!hasValidType && !hasValidExtension) {
    return { valid: false, error: 'Please upload a PDF or TXT file' };
  }
  
  return { valid: true };
}