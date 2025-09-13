import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { documentTitle, category, uploaderEmail } = await req.json()

    // Create Supabase client to get super admin emails
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // Get all super admin emails
    const { data: superAdmins, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_role', 'super_admin')

    if (error) {
      console.error('Error fetching super admins:', error)
      throw error
    }

    const adminEmails = superAdmins?.map(admin => admin.email).filter(Boolean) || []

    if (adminEmails.length === 0) {
      console.log('No super admin emails found, skipping notification')
      return new Response(JSON.stringify({ message: "No admins to notify" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Send email notification to all super admins
    const emailResponse = await resend.emails.send({
      from: "UAE Legal AI <noreply@lovable.app>",
      to: adminEmails,
      subject: `New Document Submitted for Review - ${documentTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">New Document Awaiting Approval</h2>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Document Details</h3>
            <p><strong>Title:</strong> ${documentTitle}</p>
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Uploaded by:</strong> ${uploaderEmail}</p>
            <p><strong>Status:</strong> Pending Review</p>
          </div>

          <div style="margin: 30px 0;">
            <a href="${Deno.env.get("SITE_URL") || "https://your-site.com"}/admin" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Review Document
            </a>
          </div>

          <div style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            <p>Please review and approve/reject this document to make it available for AI responses.</p>
            <p>This email was sent automatically by the UAE Legal AI system.</p>
          </div>
        </div>
      `,
    })

    console.log("Document upload notification sent:", emailResponse)

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      notifiedAdmins: adminEmails.length 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (error) {
    console.error("Error in notify-document-upload function:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})