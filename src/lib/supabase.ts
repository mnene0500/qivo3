
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper to upload a base64 image to Supabase Storage.
 * @param base64 The base64 string of the image.
 * @param bucket The name of the Supabase bucket.
 * @param path The destination path in the bucket.
 * @returns The public URL of the uploaded image.
 */
export async function uploadBase64Image(base64: string, bucket: string, path: string): Promise<string> {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase configuration missing.");
    return base64; // Return original if config missing
  }

  // Convert base64 to Blob
  const base64Data = base64.split(',')[1] || base64;
  const mimeType = base64.split(',')[0].split(':')[1].split(';')[0] || 'image/jpeg';
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    console.error("Supabase Upload Error:", error);
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return publicUrl;
}
