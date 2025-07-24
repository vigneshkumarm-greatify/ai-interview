#!/usr/bin/env node

/**
 * HeyGen Avatar Fetcher Script
 * 
 * This script fetches all available avatars from HeyGen API
 * and displays them in a formatted table for easy selection.
 * 
 * Usage:
 * 1. Add your HeyGen API key to .env.local
 * 2. Run: node scripts/fetch-avatars.js
 */

const https = require('https');
require('dotenv').config({ path: '.env.local' });

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const API_BASE_URL = 'api.heygen.com';

if (!HEYGEN_API_KEY) {
  console.error('❌ Error: HEYGEN_API_KEY not found in .env.local file');
  console.log('\nPlease add your HeyGen API key to .env.local:');
  console.log('HEYGEN_API_KEY=hg_your_api_key_here\n');
  process.exit(1);
}

console.log('🔍 Fetching available HeyGen avatars...\n');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_BASE_URL,
      path: path,
      method: 'GET',
      headers: {
        'X-API-KEY': HEYGEN_API_KEY,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function fetchAvatars() {
  try {
    console.log('📡 Making API request to HeyGen...');
    
    const response = await makeRequest('/v2/avatars');
    
    if (response.status !== 200) {
      console.error('❌ API Error:', response.status);
      console.error('Response:', JSON.stringify(response.data, null, 2));
      return;
    }

    const avatarsData = response.data;
    
    if (!avatarsData.data || !Array.isArray(avatarsData.data)) {
      console.error('❌ Unexpected API response format');
      console.log('Response:', JSON.stringify(avatarsData, null, 2));
      return;
    }

    const avatars = avatarsData.data;
    
    console.log(`✅ Found ${avatars.length} available avatars\n`);
    
    // Display avatars in a formatted table
    console.log('┌─────────────────────────────────────┬──────────┬──────────────┬─────────────┐');
    console.log('│ Avatar ID                           │ Gender   │ Style        │ Status      │');
    console.log('├─────────────────────────────────────┼──────────┼──────────────┼─────────────┤');
    
    // Filter for professional/business-appropriate avatars
    const professionalAvatars = [];
    
    avatars.forEach((avatar) => {
      const id = avatar.avatar_id || 'N/A';
      const gender = avatar.gender || 'Unknown';
      const style = avatar.avatar_name || 'Default';
      const status = avatar.status || 'Unknown';
      
      // Format for table display
      const idDisplay = id.length > 35 ? id.substring(0, 32) + '...' : id;
      const genderDisplay = gender.length > 8 ? gender.substring(0, 8) : gender;
      const styleDisplay = style.length > 12 ? style.substring(0, 9) + '...' : style;
      const statusDisplay = status.length > 11 ? status.substring(0, 8) + '...' : status;
      
      console.log(`│ ${idDisplay.padEnd(35)} │ ${genderDisplay.padEnd(8)} │ ${styleDisplay.padEnd(12)} │ ${statusDisplay.padEnd(11)} │`);
      
      // Collect professional avatars
      if (status === 'active' || status === 'public') {
        professionalAvatars.push({
          id: id,
          gender: gender,
          name: style,
          status: status
        });
      }
    });
    
    console.log('└─────────────────────────────────────┴──────────┴──────────────┴─────────────┘\n');
    
    // Show recommended avatars for our use case
    console.log('🎯 Recommended Professional Avatars for Interview:');
    console.log('=================================================\n');
    
    const recommended = professionalAvatars
      .filter(avatar => avatar.status === 'active' || avatar.status === 'public')
      .slice(0, 5); // Top 5 recommendations
    
    if (recommended.length === 0) {
      console.log('⚠️  No active avatars found. Please check your API key permissions.\n');
      return;
    }
    
    recommended.forEach((avatar, index) => {
      console.log(`${index + 1}. Avatar ID: ${avatar.id}`);
      console.log(`   Name: ${avatar.name}`);
      console.log(`   Gender: ${avatar.gender}`);
      console.log(`   Status: ${avatar.status}`);
      console.log('');
    });
    
    // Generate code snippet
    console.log('💻 Code to update in src/lib/avatar-service.ts:');
    console.log('===============================================\n');
    
    console.log('// Replace the heygenAvatarId values with these:');
    recommended.slice(0, 3).forEach((avatar, index) => {
      const configNames = ['professional-male-1', 'professional-female-1', 'friendly-male-1'];
      console.log(`// ${configNames[index] || `avatar-${index + 1}`}: '${avatar.id}'`);
    });
    
    console.log('\n✅ Avatar fetching complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Choose 2-3 professional avatars from the list above');
    console.log('2. Update the heygenAvatarId values in src/lib/avatar-service.ts');
    console.log('3. Test video generation with your selected avatars');
    
  } catch (error) {
    console.error('❌ Error fetching avatars:', error.message);
    
    if (error.message.includes('getaddrinfo ENOTFOUND')) {
      console.log('\n🌐 Network Error: Please check your internet connection');
    } else if (error.message.includes('401') || error.message.includes('403')) {
      console.log('\n🔑 Authentication Error: Please check your HeyGen API key');
      console.log('Make sure HEYGEN_API_KEY is correct in your .env.local file');
    } else {
      console.log('\n🔧 Try these troubleshooting steps:');
      console.log('1. Verify your HeyGen API key is valid');
      console.log('2. Check your internet connection');
      console.log('3. Ensure you have API access enabled in your HeyGen account');
    }
  }
}

// Run the script
fetchAvatars();