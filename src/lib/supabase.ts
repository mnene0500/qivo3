
import { createClient } from '@supabase/supabase-js';

/**
 * @fileOverview Central Supabase Client for the browser and server.
 * Optimized for production with dedicated bucket helpers.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Utility to convert base64 data (from cropping/selfies) into a Blob/File 
 * that Supabase Storage can process.
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
 * Uploads a profile photo with 'upsert: true' to replace the existing one.
 */
export async function uploadProfilePhoto(file: File | Blob, userId: string) {
  const fileExt = (file as File).name?.split('.').pop() || 'jpg';
  // Use a predictable path with upsert to keep storage clean
  const filePath = `${userId}/avatar.${fileExt}`;

  const { error } = await supabase.storage
    .from('profile-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: (file as Blob).type || 'image/jpeg'
    });

  if (error) {
    console.error("[Profile Upload Error]", error);
    throw error;
  }

  const { data } = supabase.storage
    .from('profile-photos')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Uploads gallery/post photos with unique filenames.
 */
export async function uploadPostPhoto(file: File | Blob, userId: string) {
  const fileExt = (file as File).name?.split('.').pop() || 'jpg';
  const filePath = `${userId}/${crypto.randomUUID()}.${fileExt}`;

  const { error } = await supabase.storage
    .from('post-photos')
    .upload(filePath, file, {
      contentType: (file as Blob).type || 'image/jpeg'
    });

  if (error) {
    console.error("[Post Upload Error]", error);
    throw error;
  }

  const { data } = supabase.storage
    .from('post-photos')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
