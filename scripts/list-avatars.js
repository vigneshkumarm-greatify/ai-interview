// Script to list all available HeyGen avatars
// Run with: node scripts/list-avatars.js

require('dotenv').config({ path: '.env.local' });

async function listHeyGenAvatars() {
  const apiKey = process.env.HEYGEN_API_KEY;
  
  if (!apiKey) {
    console.error('❌ HEYGEN_API_KEY not found in .env.local');
    console.log('Please add your HeyGen API key to .env.local:');
    console.log('HEYGEN_API_KEY=your_api_key_here');
    return;
  }

  try {
    console.log('🔍 Fetching available HeyGen avatars...');
    
    const response = await fetch('https://api.heygen.com/v2/avatars', {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('\n✅ Available Avatars:');
    console.log('==================');
    
    if (data.data && data.data.length > 0) {
      data.data.forEach((avatar, index) => {
        console.log(`\n${index + 1}. ${avatar.name || 'Unnamed Avatar'}`);
        console.log(`   ID: ${avatar.avatar_id}`);
        console.log(`   Gender: ${avatar.gender || 'Not specified'}`);
        console.log(`   Preview: ${avatar.preview_image_url || 'No preview'}`);
        
        if (avatar.avatar_id.includes('public')) {
          console.log(`   ✅ Public avatar (good for professional use)`);
        }
      });
      
      console.log('\n📝 Copy the avatar_id values to use in your avatar-service.ts file');
      console.log('\nRecommended professional avatars:');
      
      // Filter for likely professional avatars
      const professionalAvatars = data.data.filter(avatar => 
        avatar.avatar_id.includes('public') && 
        (avatar.name || '').toLowerCase().includes('professional') ||
        (avatar.avatar_id || '').includes('Anna') ||
        (avatar.avatar_id || '').includes('Tyler') ||
        (avatar.avatar_id || '').includes('Kristin')
      );
      
      professionalAvatars.slice(0, 3).forEach((avatar, index) => {
        console.log(`${index + 1}. ${avatar.name}: ${avatar.avatar_id}`);
      });
      
    } else {
      console.log('No avatars found. This might indicate:');
      console.log('- API key is invalid');
      console.log('- Account needs verification');
      console.log('- No avatars available in your plan');
    }
    
  } catch (error) {
    console.error('❌ Error fetching avatars:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Verify your API key is correct');
    console.log('2. Check your HeyGen account is active');
    console.log('3. Ensure you have API access enabled');
  }
}

// Run the function
listHeyGenAvatars();