import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "npm:zod@3.22.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schemas
const createShareLinkSchema = z.object({
  letterId: z.string().uuid("Invalid letter ID"),
  recipientEmail: z.string().email("Invalid email address").max(255),
  recipientName: z.string().max(100).optional(),
  expiresInDays: z.number().min(1).max(365).optional(),
  maxViews: z.number().min(1).max(1000).optional(),
  requirePassword: z.boolean().optional(),
  password: z.string().min(8).max(100).optional(),
}).refine((data) => {
  if (data.requirePassword && !data.password) {
    return false;
  }
  return true;
}, {
  message: "Password is required when password protection is enabled",
  path: ["password"],
});

interface CreateShareLinkRequest {
  letterId: string;
  recipientEmail: string;
  recipientName?: string;
  expiresInDays?: number;
  maxViews?: number;
  requirePassword?: boolean;
  password?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestBody = await req.json();
    
    // Validate input
    const validationResult = createShareLinkSchema.safeParse(requestBody);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input', 
          details: validationResult.error.issues 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      letterId, 
      recipientEmail, 
      recipientName,
      expiresInDays,
      maxViews,
      requirePassword,
      password 
    } = validationResult.data;

    console.log('Creating share link for letter:', letterId);

    // Verify user owns the letter
    const { data: letter, error: letterError } = await supabase
      .from('legal_letters')
      .select('id, user_id, title')
      .eq('id', letterId)
      .eq('user_id', user.id)
      .single();

    if (letterError || !letter) {
      console.error('Letter verification error:', letterError);
      return new Response(
        JSON.stringify({ error: 'Letter not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate secure random token
    const token_bytes = new Uint8Array(32);
    crypto.getRandomValues(token_bytes);
    const shareToken = Array.from(token_bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Calculate expiration if provided
    let expiresAt = null;
    if (expiresInDays && expiresInDays > 0) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + expiresInDays);
      expiresAt = expDate.toISOString();
    }

    // Hash password if provided
    let passwordHash = null;
    if (requirePassword && password) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      passwordHash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }

    // Create share link
    const { data: shareLink, error: createError } = await supabase
      .from('letter_share_links')
      .insert({
        letter_id: letterId,
        created_by: user.id,
        token: shareToken,
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        expires_at: expiresAt,
        max_views: maxViews,
        is_password_protected: requirePassword || false,
        password_hash: passwordHash,
        metadata: {
          letter_title: letter.title,
          created_via: 'api'
        }
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating share link:', createError);
      return new Response(
        JSON.stringify({ error: 'Failed to create share link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Share link created successfully:', shareLink.id);

    // Use the correct published domain for share links
    const shareUrl = `https://brandwatch-booth-60.lovable.app/view-letter/${shareToken}`;

    console.log('Generated share URL:', shareUrl);

    return new Response(
      JSON.stringify({
        success: true,
        shareLink: {
          ...shareLink,
          url: shareUrl
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-share-link:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
