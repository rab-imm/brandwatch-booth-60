import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { Resend } from "npm:resend@4.0.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2"
import React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { LetterShareEmail } from './_templates/letter-share.tsx'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY") || "")

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { 
      recipientEmail,
      recipientName,
      senderName,
      letterTitle,
      shareLink,
      expiresAt,
      isPasswordProtected,
      maxViews,
      message,
    } = await req.json()

    console.log("Sending letter share notification to:", recipientEmail)

    // Validate required fields
    if (!recipientEmail || !senderName || !letterTitle || !shareLink) {
      throw new Error("Missing required fields")
    }

    // Render the React email template
    const html = await renderAsync(
      React.createElement(LetterShareEmail, {
        recipientName: recipientName || recipientEmail.split('@')[0],
        senderName,
        letterTitle,
        shareLink,
        expiresAt,
        isPasswordProtected: isPasswordProtected || false,
        maxViews,
        message,
      })
    )

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: "UAE Legal Assistant <documents@uaelegalassistant.com>",
      to: [recipientEmail],
      subject: `${senderName} shared a legal document with you`,
      html,
      replyTo: "noreply@uaelegalassistant.com",
    })

    if (error) {
      console.error("Resend error:", error)
      throw error
    }

    console.log("Email sent successfully:", data)

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // Log the email activity (optional - requires auth context)
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabaseClient.auth.getUser(token)
      
      if (user) {
        await supabaseClient.rpc('log_activity', {
          p_user_id: user.id,
          p_action: 'email_sent',
          p_resource_type: 'letter_share',
          p_metadata: {
            recipient_email: recipientEmail,
            letter_title: letterTitle,
            share_link: shareLink,
          }
        })
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: data?.id,
      recipient: recipientEmail,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    console.error("Error in send-letter-share-notification function:", error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})
