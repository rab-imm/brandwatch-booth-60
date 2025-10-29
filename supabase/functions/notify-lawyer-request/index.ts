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
    const { subject, specialization, priority, userEmail, requestId } = await req.json()

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

    // Determine urgency styling
    const priorityColors = {
      low: '#10b981',
      normal: '#3b82f6',
      high: '#f59e0b',
      urgent: '#ef4444'
    }

    const priorityBg = {
      low: '#d1fae5',
      normal: '#dbeafe',
      high: '#fef3c7',
      urgent: '#fee2e2'
    }

    // Send email notification to all super admins
    const emailResponse = await resend.emails.send({
      from: "Graysen Legal Assistant <admin@graysen.ai>",
      to: adminEmails,
      subject: `${priority.toUpperCase()} - Lawyer Consultation Request: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">New Lawyer Consultation Request</h2>
          
          <div style="background-color: ${priorityBg[priority as keyof typeof priorityBg]}; border-left: 4px solid ${priorityColors[priority as keyof typeof priorityColors]}; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <h3 style="color: #374151; margin-top: 0; display: flex; align-items: center;">
              <span style="background-color: ${priorityColors[priority as keyof typeof priorityColors]}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-right: 12px;">
                ${priority}
              </span>
              Request Details
            </h3>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Specialization:</strong> ${specialization.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            <p><strong>Client Email:</strong> ${userEmail}</p>
            <p><strong>Request ID:</strong> #${requestId}</p>
          </div>

          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #475569; margin-top: 0;">Next Steps</h4>
            <ol style="color: #64748b;">
              <li>Review the full request details in the admin dashboard</li>
              <li>Assign an appropriate lawyer based on specialization</li>
              <li>Contact the client within 24 hours (or 2 hours for urgent requests)</li>
              <li>Update the request status once assigned</li>
            </ol>
          </div>

          <div style="margin: 30px 0; text-align: center;">
            <a href="${Deno.env.get("SITE_URL") || "https://your-site.com"}/admin?tab=requests" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
              Assign Lawyer
            </a>
            <a href="mailto:${userEmail}" 
               style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Contact Client
            </a>
          </div>

          <div style="font-size: 14px; color: #6b7280; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            <p><strong>Response Time Guidelines:</strong></p>
            <ul style="margin: 10px 0;">
              <li>Urgent: 2 hours</li>
              <li>High: 4 hours</li>
              <li>Normal: 24 hours</li>
              <li>Low: 48 hours</li>
            </ul>
            <p style="margin-top: 20px;">This email was sent automatically by the Graysen Legal Assistant system.</p>
          </div>
        </div>
      `,
    })

    console.log("Lawyer request notification sent:", emailResponse)

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      notifiedAdmins: adminEmails.length 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (error) {
    console.error("Error in notify-lawyer-request function:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})