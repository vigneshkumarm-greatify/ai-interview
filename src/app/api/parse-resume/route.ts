import { NextRequest, NextResponse } from 'next/server';
import { parseResumeContent, extractTextFromFile, validateResumeFile } from '@/lib/resume-parser';
import { ParsedResume } from '@/types/interview';

export async function POST(request: NextRequest) {
  console.log('=== RESUME PARSING API STARTED ===');
  
  try {
    console.log('Step 1: Getting form data...');
    const formData = await request.formData();
    const file = formData.get('resume') as File;
    
    console.log('Step 2: File validation...');
    if (!file) {
      console.log('ERROR: No file provided');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    // Validate file
    console.log('Step 3: File validation...');
    const validation = validateResumeFile(file);
    if (!validation.valid) {
      console.log('ERROR: File validation failed:', validation.error);
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    console.log('File validation passed');
    
    // Extract text from file
    console.log('Step 4: Extracting text from file...');
    let resumeText: string;
    try {
      resumeText = await extractTextFromFile(file);
      console.log('Text extraction successful, length:', resumeText.length);
      console.log('First 200 chars:', resumeText.substring(0, 200));
    } catch (extractError) {
      console.error('ERROR: Text extraction failed:', extractError);
      return NextResponse.json(
        { 
          error: 'Text extraction failed', 
          details: extractError instanceof Error ? extractError.message : 'Unknown error'
        },
        { status: 400 }
      );
    }
    
    if (!resumeText || resumeText.trim().length === 0) {
      console.log('ERROR: No text extracted from file');
      return NextResponse.json(
        { error: 'Could not extract text from file' },
        { status: 400 }
      );
    }
    
    // Parse resume with GPT-4
    console.log('Step 5: Parsing resume with AI...');
    let parsedResume: ParsedResume;
    try {
      parsedResume = await parseResumeContent(resumeText);
      console.log('AI parsing successful');
    } catch (parseError) {
      console.error('ERROR: AI parsing failed:', parseError);
      return NextResponse.json(
        { 
          error: 'AI parsing failed',
          details: parseError instanceof Error ? parseError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
    
    console.log('=== RESUME PARSING COMPLETED SUCCESSFULLY ===');
    return NextResponse.json({
      success: true,
      data: parsedResume,
      message: 'Resume parsed successfully'
    });
    
  } catch (error) {
    console.error('=== CRITICAL ERROR IN RESUME PARSING ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'Critical server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error?.constructor?.name || 'Unknown'
      },
      { status: 500 }
    );
  }
}