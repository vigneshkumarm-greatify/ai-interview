import { NextResponse } from 'next/server';
import { API_CONFIG, validateEnvironment } from '@/lib/config';

export async function GET() {
  try {
    console.log('Testing OpenAI configuration...');
    
    // Test environment validation
    try {
      validateEnvironment();
      console.log('Environment validation passed');
    } catch (envError) {
      console.error('Environment validation failed:', envError);
      return NextResponse.json({
        success: false,
        error: 'Environment validation failed',
        details: envError instanceof Error ? envError.message : 'Unknown error'
      });
    }
    
    // Test API key presence
    const apiKey = API_CONFIG.openai.apiKey;
    console.log('API key length:', apiKey?.length || 0);
    console.log('API key starts with:', apiKey?.substring(0, 7) || 'NO_KEY');
    
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      return NextResponse.json({
        success: false,
        error: 'Invalid API key',
        details: 'API key not properly configured'
      });
    }
    
    // Test OpenAI client creation
    try {
      const { getOpenAIClient } = await import('@/lib/openai');
      const client = getOpenAIClient();
      console.log('OpenAI client created successfully');
      
      // Test simple API call
      const completion = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say "test successful"' }],
        max_tokens: 10,
      });
      
      const response = completion.choices[0]?.message?.content || '';
      console.log('OpenAI API test successful:', response);
      
      return NextResponse.json({
        success: true,
        message: 'OpenAI configuration working',
        testResponse: response
      });
      
    } catch (apiError) {
      console.error('OpenAI API test failed:', apiError);
      return NextResponse.json({
        success: false,
        error: 'OpenAI API call failed',
        details: apiError instanceof Error ? apiError.message : 'Unknown error'
      });
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}