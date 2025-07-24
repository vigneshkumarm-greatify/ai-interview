import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface HeyGenAvatar {
  avatar_id: string;
  avatar_name: string;
  gender: string;
  preview_image_url?: string;
  preview_video_url?: string;
  premium?: boolean;
  type?: string;
  tags?: string;
  default_voice_id?: string;
}

interface HeyGenResponse {
  data: HeyGenAvatar[];
  message: string;
}

export async function GET() {
  console.log('🔍 FETCH AVATARS API - Getting HeyGen avatars');
  
  try {
    const apiKey = process.env.HEYGEN_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'HeyGen API key not configured. Please add HEYGEN_API_KEY to your environment variables.'
      }, { status: 500 });
    }

    console.log('📡 Making request to HeyGen API...');

    const response = await fetch('https://api.heygen.com/v2/avatars', {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HeyGen API Error:', response.status, errorText);
      
      return NextResponse.json({
        success: false,
        error: `HeyGen API error: ${response.status} - ${errorText}`,
        statusCode: response.status
      }, { status: response.status });
    }

    const data = await response.json();
    
    console.log('📄 HeyGen API Response:', JSON.stringify(data, null, 2));
    
    // Handle different possible response formats
    let avatars: HeyGenAvatar[] = [];
    
    if (data.data && data.data.avatars && Array.isArray(data.data.avatars)) {
      // HeyGen format: { data: { avatars: [...] } }
      avatars = data.data.avatars;
    } else if (data.data && Array.isArray(data.data)) {
      // Standard format: { data: [...] }
      avatars = data.data;
    } else if (Array.isArray(data)) {
      // Direct array format: [...]
      avatars = data;
    } else if (data.avatars && Array.isArray(data.avatars)) {
      // Alternative format: { avatars: [...] }
      avatars = data.avatars;
    } else {
      console.error('❌ Unexpected API response structure:', data);
      return NextResponse.json({
        success: false,
        error: 'Invalid response format from HeyGen API',
        debug: {
          responseKeys: Object.keys(data),
          responseType: typeof data,
          isArray: Array.isArray(data),
          sampleData: JSON.stringify(data).substring(0, 500)
        }
      }, { status: 500 });
    }
    
    if (!Array.isArray(avatars) || avatars.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No avatars found in HeyGen API response',
        debug: {
          dataType: typeof avatars,
          avatarsFound: avatars.length,
          responseStructure: Object.keys(data)
        }
      }, { status: 500 });
    }

    console.log(`✅ Found ${avatars.length} avatars`);

    // Filter for suitable avatars for professional use
    const professionalAvatars = avatars
      .filter(avatar => {
        // Include non-premium avatars (free tier accessible)
        // and avatars that have preview images (indicating they're ready to use)
        return avatar.preview_image_url && (avatar.premium === false || avatar.premium === undefined);
      })
      .map(avatar => ({
        id: avatar.avatar_id,
        name: avatar.avatar_name || 'Professional Avatar',
        gender: avatar.gender || 'Unknown',
        status: avatar.premium ? 'premium' : 'free',
        previewImage: avatar.preview_image_url,
        // Determine if it looks professional based on name/ID
        isProfessional: isProfessionalAvatar(avatar.avatar_name, avatar.avatar_id)
      }))
      .sort((a, b) => {
        // Sort professional avatars first
        if (a.isProfessional && !b.isProfessional) return -1;
        if (!a.isProfessional && b.isProfessional) return 1;
        return a.name.localeCompare(b.name);
      });

    // Get top recommendations
    const maleAvatars = professionalAvatars.filter(a => a.gender.toLowerCase().includes('male') && !a.gender.toLowerCase().includes('female'));
    const femaleAvatars = professionalAvatars.filter(a => a.gender.toLowerCase().includes('female'));
    
    const recommendations = [
      ...femaleAvatars.slice(0, 2),
      ...maleAvatars.slice(0, 2),
    ].slice(0, 3);

    return NextResponse.json({
      success: true,
      avatars: professionalAvatars,
      total: avatars.length,
      filtered: professionalAvatars.length,
      recommendations,
      codeSnippet: generateCodeSnippet(recommendations)
    });

  } catch (error) {
    console.error('❌ Fetch avatars error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: 'Check server logs for more information'
    }, { status: 500 });
  }
}

function isProfessionalAvatar(name: string, id: string): boolean {
  const professionalKeywords = [
    'professional', 'business', 'corporate', 'formal', 'office',
    'suit', 'executive', 'manager', 'consultant', 'advisor'
  ];
  
  const casualKeywords = [
    'casual', 'fun', 'playful', 'cartoon', 'anime', 'gaming',
    'beach', 'vacation', 'party', 'sports'
  ];
  
  const text = `${name} ${id}`.toLowerCase();
  
  // Check for casual keywords (less professional)
  if (casualKeywords.some(keyword => text.includes(keyword))) {
    return false;
  }
  
  // Check for professional keywords
  if (professionalKeywords.some(keyword => text.includes(keyword))) {
    return true;
  }
  
  // If it contains "public" it's likely a professional demo avatar
  if (text.includes('public')) {
    return true;
  }
  
  // Default to potentially professional
  return true;
}

function generateCodeSnippet(recommendations: any[]): string {
  const avatarConfigs = [
    'professional-female-1',
    'professional-male-1', 
    'friendly-female-1'
  ];

  let snippet = '// Update these avatar IDs in src/lib/avatar-service.ts:\n\n';
  
  recommendations.forEach((avatar, index) => {
    const configName = avatarConfigs[index] || `avatar-${index + 1}`;
    snippet += `// ${configName}: '${avatar.id}'\n`;
  });
  
  snippet += '\n// Full replacement for AVAILABLE_AVATARS array:\n';
  snippet += 'export const AVAILABLE_AVATARS: AvatarConfig[] = [\n';
  
  recommendations.forEach((avatar, index) => {
    const configName = avatarConfigs[index] || `avatar-${index + 1}`;
    const displayName = avatar.name.replace(/[^a-zA-Z\s]/g, '').trim() || `Avatar ${index + 1}`;
    const gender = avatar.gender.toLowerCase().includes('female') ? 'female' : 'male';
    
    snippet += `  {\n`;
    snippet += `    id: '${configName}',\n`;
    snippet += `    name: '${displayName}',\n`;
    snippet += `    gender: '${gender}',\n`;
    snippet += `    style: 'professional',\n`;
    snippet += `    thumbnail: '/avatars/${configName}.jpg',\n`;
    snippet += `    heygenAvatarId: '${avatar.id}'\n`;
    snippet += `  }${index < recommendations.length - 1 ? ',' : ''}\n`;
  });
  
  snippet += '];';
  
  return snippet;
}