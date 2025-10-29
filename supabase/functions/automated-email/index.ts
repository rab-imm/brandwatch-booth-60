import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { Resend } from "npm:resend@4.0.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2"

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
    const { type, userId, templateData, userEmail, userName } = await req.json()

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    let emailContent = ""
    let subject = ""

    switch (type) {
      case "template_purchase_confirmation":
        subject = "Template Purchase Confirmation - Graysen Legal Assistant"
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Purchase Confirmation</h1>
            <p>Dear ${userName},</p>
            <p>Thank you for your purchase! Your legal template is now available for download.</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Template Details:</h3>
              <p><strong>Title:</strong> ${templateData.title}</p>
              <p><strong>Category:</strong> ${templateData.category}</p>
              <p><strong>Price:</strong> AED ${templateData.price_aed}</p>
              <p><strong>Purchase Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <p>You can access your purchased template from your dashboard at any time.</p>
            
            <div style="background: #fef3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Important:</strong> This template is for informational purposes only and does not constitute legal advice. Please consult with a qualified UAE lawyer for specific legal matters.</p>
            </div>
            
            <p>Best regards,<br>Graysen Legal Assistant Team</p>
          </div>
        `
        break

      case "document_approval_notification":
        subject = "Document Approved - Graysen Legal Assistant"
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #16a34a;">Document Approved</h1>
            <p>Dear ${userName},</p>
            <p>Great news! Your uploaded document has been approved and is now part of our AI knowledge base.</p>
            
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Document Details:</h3>
              <p><strong>Title:</strong> ${templateData.title}</p>
              <p><strong>Category:</strong> ${templateData.category}</p>
              <p><strong>Approval Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <p>Your contribution helps improve our AI legal assistant for all users. Thank you for sharing your expertise!</p>
            
            <p>Best regards,<br>Graysen Legal Assistant Team</p>
          </div>
        `
        break

      case "lawyer_request_assignment":
        subject = "Lawyer Request Update - Graysen Legal Assistant"
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #dc2626;">Lawyer Request Update</h1>
            <p>Dear ${userName},</p>
            <p>Your lawyer consultation request has been updated.</p>
            
            <div style="background: #fff7ed; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Request Details:</h3>
              <p><strong>Subject:</strong> ${templateData.subject}</p>
              <p><strong>Specialization:</strong> ${templateData.specialization}</p>
              <p><strong>Priority:</strong> ${templateData.priority}</p>
              <p><strong>Status:</strong> ${templateData.status}</p>
              <p><strong>Update Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <p>A qualified lawyer will contact you within 24-48 hours for high-priority requests, or within 3-5 business days for normal priority requests.</p>
            
            <p>Best regards,<br>Graysen Legal Assistant Team</p>
          </div>
        `
        break

      case "subscription_reminder":
        subject = "Subscription Reminder - Graysen Legal Assistant"
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #7c3aed;">Subscription Reminder</h1>
            <p>Dear ${userName},</p>
            <p>This is a friendly reminder about your UAE Legal Assistant subscription.</p>
            
            <div style="background: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Subscription Details:</h3>
              <p><strong>Plan:</strong> ${templateData.plan}</p>
              <p><strong>Status:</strong> ${templateData.status}</p>
              <p><strong>Next Billing:</strong> ${templateData.nextBilling}</p>
            </div>
            
            <p>To manage your subscription, please visit your account dashboard.</p>
            
            <p>Best regards,<br>Graysen Legal Assistant Team</p>
          </div>
        `
        break

      default:
        throw new Error("Unknown email type")
    }

    // Send email
    const { data, error } = await resend.emails.send({
      from: "Graysen Legal Assistant <noreply@graysen.ai>",
      to: [userEmail],
      subject: subject,
      html: emailContent,
    })

    if (error) {
      console.error("Resend error:", error)
      throw error
    }

    // Create notification for user
    await supabaseClient.rpc('create_notification', {
      p_user_id: userId,
      p_title: subject,
      p_message: `Email sent successfully: ${subject}`,
      p_type: 'info'
    })

    // Log activity
    await supabaseClient.rpc('log_activity', {
      p_user_id: userId,
      p_action: 'email_sent',
      p_resource_type: 'email',
      p_metadata: {
        email_type: type,
        recipient: userEmail,
        subject: subject
      }
    })

    console.log("Email sent successfully:", data)

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: data?.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    console.error("Error in automated-email function:", error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})