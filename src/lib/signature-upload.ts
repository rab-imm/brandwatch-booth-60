import { supabase } from "@/integrations/supabase/client";

export async function uploadSignatureImage(
  base64Data: string,
  recipientId: string,
  fieldId: string
): Promise<string> {
  // Convert base64 to blob
  const base64Response = await fetch(base64Data);
  const blob = await base64Response.blob();
  
  // Generate unique filename
  const timestamp = Date.now();
  const filename = `${recipientId}/${fieldId}_${timestamp}.png`;
  
  // Upload to storage
  const { data, error } = await supabase.storage
    .from('signatures')
    .upload(filename, blob, {
      contentType: 'image/png',
      upsert: false
    });
  
  if (error) {
    throw new Error(`Failed to upload signature: ${error.message}`);
  }
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('signatures')
    .getPublicUrl(data.path);
  
  return urlData.publicUrl;
}
