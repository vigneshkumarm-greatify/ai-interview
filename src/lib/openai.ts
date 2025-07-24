import OpenAI from 'openai';
import { API_CONFIG, validateEnvironment } from './config';

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    try {
      validateEnvironment();
    } catch (error) {
      console.error('Environment validation failed:', error);
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in .env.local');
    }
    
    openaiClient = new OpenAI({
      apiKey: API_CONFIG.openai.apiKey,
      organization: API_CONFIG.openai.orgId,
    });
  }
  
  return openaiClient;
}

export async function transcribeAudio(audioFile: File): Promise<string> {
  const client = getOpenAIClient();
  
  try {
    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: API_CONFIG.openai.models.whisper,
      language: 'en',
    });
    
    return transcription.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error('Failed to transcribe audio');
  }
}

export async function generateSpeech(text: string): Promise<ArrayBuffer> {
  const client = getOpenAIClient();
  
  try {
    const mp3 = await client.audio.speech.create({
      model: API_CONFIG.openai.models.tts,
      voice: API_CONFIG.openai.ttsVoice,
      input: text,
    });
    
    return await mp3.arrayBuffer();
  } catch (error) {
    console.error('Error generating speech:', error);
    throw new Error('Failed to generate speech');
  }
}

export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7
): Promise<string> {
  console.log('generateCompletion called');
  
  try {
    console.log('Getting OpenAI client...');
    const client = getOpenAIClient();
    console.log('OpenAI client obtained');
    
    console.log('Calling OpenAI API with model:', API_CONFIG.openai.models.gpt4);
    const completion = await client.chat.completions.create({
      model: API_CONFIG.openai.models.gpt4,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: 2000,
    });
    
    console.log('OpenAI API call successful');
    const response = completion.choices[0]?.message?.content || '';
    console.log('Response length:', response.length);
    
    return response;
  } catch (error) {
    console.error('Error generating completion:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw new Error('Failed to generate completion: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

export async function parseResumeWithGPT(resumeText: string): Promise<any> {
  const systemPrompt = `You are a resume parser. Extract and structure the following information from the resume:
  - Personal information (name, email, phone)
  - Work experience (company, role, duration, responsibilities)
  - Skills
  - Education (institution, degree, year)
  
  Return the data as a valid JSON object matching this structure:
  {
    "personalInfo": { "name": "", "email": "", "phone": "" },
    "experience": [{ "company": "", "role": "", "duration": "", "responsibilities": [] }],
    "skills": [],
    "education": [{ "institution": "", "degree": "", "year": "" }]
  }`;
  
  const response = await generateCompletion(systemPrompt, resumeText, 0.3);
  
  try {
    return JSON.parse(response);
  } catch (error) {
    console.error('Error parsing resume response:', error);
    throw new Error('Failed to parse resume');
  }
}