
import { createClient } from '@supabase/supabase-js';

/**
 * @fileOverview Central Supabase Client for the browser and server.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Robust base64 to binary conversion for storage.
 */
export async function uploadBase64Image(base64: string, bucket: string, path: string): Promise<string> {
  try {
    if (base64.startsWith('http')) return base64;

    const regex = /^data:(image\/[a-zA-Z]*);base64,(.*)$/;
    const matches = base64.match(regex);
    
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid image string format.");
    }

    const contentType = matches[1];
    const byteCharacters = atob(matches[2]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType });

    const { error } = await supabase.storage.from(bucket).upload(path, blob, {
      contentType,
      upsert: true,
      cacheControl: '3600'
    });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
  } catch (err: any) {
    console.error("[Storage Upload Error]", err.message);
    throw err;
  }
}
