#!/usr/bin/env node

/**
 * HeyGen Avatar Test Script
 * 
 * This script tests video generation with a specific avatar ID
 * to verify it works before using it in the application.
 * 
 * Usage:
 * node scripts/test-avatar.js [avatar_id]
 * 
 * Example:
 * node scripts/test-avatar.js Anna_public_3_20240108
 */

const https = require('https');
require('dotenv').config({ path: '.env.local' });

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const API_BASE_URL = 'api.heygen.com';

// Get avatar ID from command line argument
const avatarId = process.argv[2];

if (!HEYGEN_API_KEY) {
  console.error('❌ Error: HEYGEN_API_KEY not found in .env.local file');
  process.exit(1);
}

if (!avatarId) {
  console.error('❌ Error: Please provide an avatar ID to test');
  console.log('\nUsage: node scripts/test-avatar.js [avatar_id]');
  console.log('Example: node scripts/test-avatar.js Anna_public_3_20240108');
  console.log('\nRun "node scripts/fetch-avatars.js" first to see available avatar IDs');
  process.exit(1);
}

console.log(`🧪 Testing avatar: ${avatarId}\n`);

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_BASE_URL,
      path: path,
      method: method,
      headers: {
        'X-API-KEY': HEYGEN_API_KEY,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}\nResponse: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testAvatarGeneration() {
  try {
    console.log('🎬 Generating test video...');
    
    // Create a test video generation request
    const testPayload = {
      video_inputs: [{
        character: {
          type: 'avatar',
          avatar_id: avatarId,
          scale: 1.0
        },
        voice: {
          type: 'text',
          input_text: 'Hello! This is a test message to verify the avatar works correctly. I am your AI interviewer.',
          voice_id: 'en-US-AriaNeural',
          speed: 1.0
        }
      }],
      dimension: {
        width: 480,
        height: 640
      },
      aspect_ratio: '9:16',
      callback_id: `test_${Date.now()}`,
      test: true // Use test mode to avoid charges
    };

    console.log('📡 Sending video generation request...');
    
    const response = await makeRequest('/v2/video/generate', 'POST', testPayload);
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Video generation request successful!');
      console.log('📹 Video ID:', response.data.video_id);
      
      if (response.data.video_id) {
        console.log('\n⏳ Polling for video completion...');
        await pollVideoStatus(response.data.video_id);
      }
      
    } else {
      console.error('❌ Video generation failed');
      console.error('Status:', response.status);
      console.error('Response:', JSON.stringify(response.data, null, 2));
      
      // Check for common errors
      if (response.status === 400) {
        console.log('\n💡 This might be because:');
        console.log('- Avatar ID is incorrect or not available');
        console.log('- Voice settings are invalid');
        console.log('- Request format is incorrect');
      } else if (response.status === 401 || response.status === 403) {
        console.log('\n🔑 Authentication error - check your API key');
      } else if (response.status === 429) {
        console.log('\n⏱️  Rate limit exceeded - wait a moment and try again');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing avatar:', error.message);
  }
}

async function pollVideoStatus(videoId, maxAttempts = 10) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      console.log(`🔄 Checking video status... (${attempt + 1}/${maxAttempts})`);
      
      const response = await makeRequest(`/v2/video/${videoId}`);
      
      if (response.status === 200) {
        const status = response.data.status;
        
        console.log(`📊 Status: ${status}`);
        
        if (status === 'completed') {
          console.log('🎉 Video generation completed successfully!');
          console.log('🔗 Video URL:', response.data.video_url);
          console.log('\n✅ Avatar test PASSED - This avatar ID works correctly!');
          
          // Show cost information
          if (response.data.credit_cost) {
            console.log(`💰 Credits used: ${response.data.credit_cost}`);
          }
          
          return;
        } else if (status === 'failed') {
          console.log('❌ Video generation failed');
          if (response.data.error) {
            console.log('Error:', response.data.error);
          }
          return;
        } else if (status === 'processing') {
          console.log('⏳ Still processing...');
        }
        
        // Wait 3 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } else {
        console.error('Error checking status:', response.status);
        return;
      }
      
    } catch (error) {
      console.error('Error polling status:', error.message);
      return;
    }
  }
  
  console.log('⏰ Timeout waiting for video completion');
  console.log('The video might still be processing - check your HeyGen dashboard');
}

// Run the test
console.log('🚀 Starting avatar test...\n');
testAvatarGeneration();