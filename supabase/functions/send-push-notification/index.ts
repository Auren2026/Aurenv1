// @ts-nocheck
// Edge Function para enviar Push Notifications via Firebase Cloud Messaging (HTTP v1)

interface PushNotificationRequest {
  title: string;
  body: string;
  data?: Record<string, string>;
  userId?: string;  // Enviar para um usuário específico
  broadcast?: boolean;  // Enviar para todos os usuários
}

const FIREBASE_PROJECT_ID = 'auren-4a626';

// Cabeçalhos CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Get OAuth2 Access Token usando Service Account
async function getAccessToken() {
  const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '{}');
  
  if (!serviceAccount.private_key || !serviceAccount.client_email) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT secret não configurado');
  }

  const jwtHeader = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  
  const now = Math.floor(Date.now() / 1000);
  const jwtClaimSet = btoa(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }));

  const unsignedToken = `${jwtHeader}.${jwtClaimSet}`;
  
  // Import private key
  const pemKey = serviceAccount.private_key.replace(/\\n/g, '\n');
  const keyData = pemKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signedToken = `${unsignedToken}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signedToken,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Failed to get access token: ${await tokenResponse.text()}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Send push notification via FCM HTTP v1
async function sendPushNotification(token: string, title: string, body: string, data?: Record<string, string>) {
  const accessToken = await getAccessToken();
  
  const message = {
    message: {
      token: token,
      notification: {
        title: title,
        body: body,
      },
      data: data || {},
      webpush: {
        notification: {
          icon: '/icon.png',
          badge: '/icon.png',
        },
      },
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#0f766e',
        },
      },
    },
  };

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(message),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('FCM Error:', error);
    throw new Error(`FCM failed: ${response.status} - ${error}`);
  }

  return await response.json();
}

Deno.serve(async (req) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: PushNotificationRequest = await req.json();
    
    if (!payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: title, body' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    let tokens: string[] = [];

    if (payload.broadcast) {
      // Broadcast: buscar todos os tokens
      const { data, error } = await supabase
        .from('push_tokens')
        .select('token');
      
      if (error) throw error;
      tokens = data?.map((t: any) => t.token) || [];
    } else if (payload.userId) {
      // Enviar para usuário específico
      const { data, error } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', payload.userId);
      
      if (error) throw error;
      tokens = data?.map((t: any) => t.token) || [];
    } else {
      return new Response(
        JSON.stringify({ error: 'Especifique userId ou broadcast: true' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhum token encontrado', sent: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Enviar notificações
    const results = await Promise.allSettled(
      tokens.map(token => sendPushNotification(token, payload.title, payload.body, payload.data))
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failCount = results.filter(r => r.status === 'rejected').length;

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failCount,
        total: tokens.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error sending push notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
