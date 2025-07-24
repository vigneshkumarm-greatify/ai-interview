import { NextRequest, NextResponse } from 'next/server';
import { generateSpeech } from '@/lib/openai';

export async function POST(request: NextRequest) {
  console.log('=== TEXT-TO-SPEECH API STARTED ===');
  
  try {
    const { text, emotion = 'neutral' } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }
    
    console.log('TTS request:', { 
      text: text.substring(0, 50) + '...', 
      emotion,
      length: text.length 
    });
    
    // Add emotion-based prefix to guide the AI voice tone
    let emotionalText = text;
    switch (emotion) {
      case 'greeting':
        // Warm, friendly tone
        emotionalText = `[Speaking warmly and welcomingly] ${text}`;
        break;
      case 'question':
        // Professional, encouraging tone
        emotionalText = `[Speaking professionally and encouragingly] ${text}`;
        break;
      case 'encouragement':
        // Supportive, positive tone
        emotionalText = `[Speaking supportively] ${text}`;
        break;
      case 'conclusion':
        // Appreciative, concluding tone
        emotionalText = `[Speaking appreciatively] ${text}`;
        break;
      default:
        // Neutral professional tone
        emotionalText = text;
    }
    
    try {
      console.log('Calling OpenAI TTS...');
      const audioBuffer = await generateSpeech(text); // Use original text, not with emotion prefix
      console.log('TTS successful, audio size:', audioBuffer.byteLength);
      
      // Convert ArrayBuffer to base64 for easier transmission
      const base64Audio = Buffer.from(audioBuffer).toString('base64');
      
      return NextResponse.json({
        success: true,
        audio: base64Audio,
        format: 'mp3'
      });
      
    } catch (ttsError) {
      console.error('TTS generation failed:', ttsError);
      
      // Return success with no audio as fallback
      return NextResponse.json({
        success: false,
        audio: null,
        format: null,
        error: 'TTS generation failed, text will be displayed only'
      });
    }
    
  } catch (error) {
    console.error('=== CRITICAL ERROR IN TEXT-TO-SPEECH ===');
    console.error(error);
    
    return NextResponse.json({
      error: 'Failed to process text-to-speech',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}