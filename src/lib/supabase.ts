import { createClient } from '@supabase/supabase-js';

/**
 * @fileOverview Standard Supabase Client.
 * Uses NEXT_PUBLIC variables for the browser and SERVICE_ROLE for server-side admin tasks.
 * Hardened to prevent crashes when environment variables are missing.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Defensive check: If variables are missing, use a placeholder to prevent "supabaseUrl is required" crash.
// This allows the app to boot and render, though actual DB calls will return errors until keys are set.
const isConfigured = !!supabaseUrl && !!supabaseAnonKey;

if (!isConfigured && typeof window !== 'undefined') {
  console.error("❌ [Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Please set these in Vercel.");
}

// Main Client for Browser & Server Actions
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co', 
  supabaseAnonKey || 'placeholder-anon-key', 
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  }
);

// Admin Client (Server Only) - used for balance increments and role management
export const getSupabaseAdmin = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
  const adminUrl = process.env.SUPABASE_URL || supabaseUrl;
  
  if (typeof window !== 'undefined') {
    throw new Error("Admin client can only be used on the server.");
  }

  if (!serviceKey || !adminUrl) {
    console.warn("⚠️ [Supabase Admin] Missing Service Role Key or URL. Falling back to anon client.");
  }

  return createClient(
    adminUrl || 'https://placeholder-project.supabase.co', 
    serviceKey || 'placeholder-service-key', 
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};

/**
 * Helper to convert Base64 string to a Blob for Supabase Storage uploads.
 */
export function base64ToBlob(base64: string): { blob: Blob, contentType: string } {
  const matches = base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid image string format.");
  }

  const contentType = matches[1];
  const b64Data = matches[2];
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return { 
    blob: new Blob(byteArrays, { type: contentType }),
    contentType 
  };
}

/**
 * Profile Photo Upload (Admin context to bypass strict RLS during onboarding)
 */
export async function uploadProfilePhoto(file: File | Blob, userId: string) {
  const admin = getSupabaseAdmin();
  const timestamp = Date.now();
  const filePath = `${userId}/${timestamp}.jpg`;
  
  const { error } = await admin.storage.from('photos').upload(filePath, file, { 
    cacheControl: '0', 
    upsert: true,
    contentType: 'image/jpeg'
  });
  
  if (error) throw error;
  
  const { data } = admin.storage.from('photos').getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Gallery/Post Photo Upload
 */
export async function uploadPostPhoto(file: File | Blob, userId: string, bucket = 'photos') {
  const admin = getSupabaseAdmin();
  const timestamp = Date.now();
  const uuid = crypto.randomUUID();
  const filePath = `${userId}/gallery-${timestamp}-${uuid}.jpg`;
  
  const { error } = await admin.storage.from(bucket).upload(filePath, file, { 
    cacheControl: '0', 
    upsert: true,
    contentType: 'image/jpeg'
  });
  
  if (error) throw error;
  
  const { data } = admin.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}
