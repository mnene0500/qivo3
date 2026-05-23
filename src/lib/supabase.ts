
import { createClient } from '@supabase/supabase-js';

/**
 * @fileOverview Hardened Supabase Client for Production.
 * 
 * To prevent the "supabaseUrl is required" crash, we prioritize server-side 
 * variables and use placeholders for the browser if keys are missing.
 * 
 * IMPORTANT: For Auth and Real-time chat, NEXT_PUBLIC_SUPABASE_URL and 
 * NEXT_PUBLIC_SUPABASE_ANON_KEY are REQUIRED in the Vercel Dashboard.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

// Create the client with a safety check
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

/**
 * Utility to convert base64 data into a Blob/File that Supabase Storage can process.
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

export async function uploadProfilePhoto(file: File | Blob, userId: string) {
  const timestamp = Date.now();
  const filePath = `${userId}/${timestamp}.jpg`;
  const { error } = await supabase.storage.from('photos').upload(filePath, file, { cacheControl: '0', upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('photos').getPublicUrl(filePath);
  return data.publicUrl;
}

export async function uploadPostPhoto(file: File | Blob, userId: string, bucket = 'photos') {
  const timestamp = Date.now();
  const uuid = crypto.randomUUID();
  const filePath = `${userId}/gallery-${timestamp}-${uuid}.jpg`;
  const { error } = await supabase.storage.from(bucket).upload(filePath, file, { cacheControl: '0', upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}
