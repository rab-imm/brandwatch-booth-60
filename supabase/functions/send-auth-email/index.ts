import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { PasswordResetEmail } from "./_templates/password-reset.tsx";
import { EmailConfirmationEmail } from "./_templates/email-confirmation.tsx";
import { MagicLinkEmail } from "./_templates/magic-link.tsx";
import { corsHeaders } from "../_shared/cors.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface AuthEmailData {
  token: string;
  token_hash: string;
  redirect_to: string;
  email_action_type: string;
  site_url: string;
}

interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
}

interface AuthWebhookPayload {
  user: AuthUser;
  email_data: AuthEmailData;
}

const logStep = (step: string, data?: any) => {
  console.log(`[send-auth-email] ${step}`, data ? JSON.stringify(data, null, 2) : "");
};

// Background task to process and send email
async function processAndSendEmail(payload: AuthWebhookPayload) {
  try {
    const { user, email_data } = payload;
    const { email_action_type, token_hash, redirect_to } = email_data;
    const userName = user.user_metadata?.full_name;

    logStep("Processing auth email in background", { 
      email: user.email, 
      action_type: email_action_type 
    });

    let html: string;
    let subject: string;
    let actionLink: string;

    // Construct the verification/action link
    const baseUrl = Deno.env.get("SUPABASE_URL") || "";
    actionLink = `${baseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to)}`;

    // Route to appropriate email template based on action type
    switch (email_action_type) {
      case "recovery":
        // Password reset
        subject = "Reset Your Graysen Password";
        html = await renderAsync(
          React.createElement(PasswordResetEmail, {
            userEmail: user.email,
            userName,
            resetLink: actionLink,
            expiryHours: 1,
          })
        );
        logStep("Rendered password reset email");
        break;

      case "signup":
      case "invite":
        // Email confirmation
        subject = "Welcome to Graysen Legal Assistant - Confirm Your Email";
        html = await renderAsync(
          React.createElement(EmailConfirmationEmail, {
            userEmail: user.email,
            userName,
            confirmationLink: actionLink,
          })
        );
        logStep("Rendered email confirmation email");
        break;

      case "magiclink":
        // Magic link sign-in
        subject = "Your Graysen Sign-In Link";
        html = await renderAsync(
          React.createElement(MagicLinkEmail, {
            userEmail: user.email,
            userName,
            magicLink: actionLink,
            expiryMinutes: 60,
          })
        );
        logStep("Rendered magic link email");
        break;

      case "email_change":
        // Email change confirmation
        subject = "Confirm Your New Email Address";
        html = await renderAsync(
          React.createElement(EmailConfirmationEmail, {
            userEmail: user.email,
            userName,
            confirmationLink: actionLink,
          })
        );
        logStep("Rendered email change confirmation");
        break;

      default:
        logStep("Unknown email action type", { email_action_type });
        return;
    }

    // Send email via Resend
    logStep("Sending email via Resend", { to: user.email, subject });
    
    const { data, error } = await resend.emails.send({
      from: "Graysen Legal Assistant <noreply@graysen.ai>",
      to: [user.email],
      subject,
      html,
    });

    if (error) {
      logStep("Resend error", error);
      throw error;
    }

    logStep("Email sent successfully", { messageId: data?.id });

  } catch (error) {
    logStep("Error in background email processing", { 
      error: error.message,
      stack: error.stack,
    });
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { 
        status: 405, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }

  try {
    logStep("Received auth webhook request");

    // Parse webhook payload directly (Auth Hooks are internal Supabase services)
    const payload = await req.json() as AuthWebhookPayload;
    logStep("Parsed webhook payload");

    const { user, email_data } = payload;
    const { email_action_type } = email_data;

    // Start background task to process and send email
    // @ts-ignore - EdgeRuntime is available in Deno Deploy
    EdgeRuntime.waitUntil(processAndSendEmail(payload));

    logStep("Background task started, returning immediate response");

    // Return immediate 202 (Accepted) response to prevent timeout
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email processing started",
        recipient: user.email,
        action_type: email_action_type,
      }),
      { 
        status: 202, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    logStep("Error parsing webhook request", { 
      error: error.message,
      stack: error.stack,
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Failed to process authentication email request",
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
