import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { SignatureRequestEmail } from "./_templates/signature-request.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[SEND-SIGNATURE-EMAIL] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const {
      recipientEmail,
      recipientName,
      senderName,
      documentTitle,
      message,
      accessToken,
      expiresAt,
    } = await req.json();

    if (!recipientEmail || !recipientName || !senderName || !documentTitle || !accessToken) {
      throw new Error("Missing required email parameters");
    }

    // Use the correct published domain for signing URLs
    const signingUrl = `https://brandwatch-booth-60.lovable.app/sign/${accessToken}`;

    logStep("Rendering email template");

    // Render email HTML
    const html = await renderAsync(
      React.createElement(SignatureRequestEmail, {
        recipientName,
        senderName,
        documentTitle,
        message,
        signingUrl,
        expiresAt,
      })
    );

    logStep("Sending email", { to: recipientEmail });

    // Send email
    const { error: sendError } = await resend.emails.send({
      from: "Graysen Legal Assistant <noreply@graysen.ai>",
      to: [recipientEmail],
      subject: `Signature Request: ${documentTitle}`,
      html,
    });

    if (sendError) {
      throw sendError;
    }

    logStep("Email sent successfully");

    return new Response(JSON.stringify({ 
      success: true,
      message: "Signature request email sent"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
