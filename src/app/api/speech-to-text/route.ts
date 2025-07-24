import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/openai';

export async function POST(request: NextRequest) {
  console.log('=== SPEECH-TO-TEXT API STARTED ===');
  
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      console.log('ERROR: No audio file provided');
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }
    
    console.log('Audio file details:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size
    });
    
    // Validate audio file
    if (audioFile.size === 0) {
      return NextResponse.json(
        { error: 'Empty audio file' },
        { status: 400 }
      );
    }
    
    if (audioFile.size > 25 * 1024 * 1024) { // 25MB limit for Whisper
      return NextResponse.json(
        { error: 'Audio file too large (max 25MB)' },
        { status: 400 }
      );
    }
    
    // Try transcription with fallback
    try {
      console.log('Calling OpenAI Whisper API...');
      const transcription = await transcribeAudio(audioFile);
      console.log('Transcription successful, length:', transcription.length);
      
      return NextResponse.json({
        success: true,
        text: transcription,
        confidence: 0.95, // Whisper doesn't provide confidence scores
        language: 'en'
      });
      
    } catch (transcriptionError) {
      console.error('OpenAI transcription failed:', transcriptionError);
      
      // Fallback: Return a message indicating transcription failed but audio was received
      return NextResponse.json({
        success: false,
        text: '[Audio received but transcription failed - AI service unavailable]',
        confidence: 0,
        language: 'en',
        error: 'Transcription service unavailable'
      });
    }
    
  } catch (error) {
    console.error('=== CRITICAL ERROR IN SPEECH-TO-TEXT ===');
    console.error(error);
    
    return NextResponse.json({
      error: 'Failed to process audio',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}