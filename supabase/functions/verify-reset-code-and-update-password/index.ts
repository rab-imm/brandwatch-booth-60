import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyCodeRequest {
  email: string;
  code: string;
}

interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "verify";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "verify") {
      // Verify code only
      const { email, code }: VerifyCodeRequest = await req.json();

      if (!email || !code) {
        return new Response(
          JSON.stringify({ error: "Email and code are required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Check if code exists and is valid
      const { data: resetCode, error: fetchError } = await supabase
        .from("password_reset_codes")
        .select("*")
        .eq("email", email)
        .eq("code", code)
        .eq("used", false)
        .single();

      if (fetchError || !resetCode) {
        console.error("Code verification failed:", fetchError);
        return new Response(
          JSON.stringify({ error: "Invalid or expired code" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Check if code has expired
      const expiresAt = new Date(resetCode.expires_at);
      if (expiresAt < new Date()) {
        return new Response(
          JSON.stringify({ error: "Code has expired" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Code verified successfully" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    } else if (action === "reset") {
      // Verify code and reset password
      const { email, code, newPassword }: ResetPasswordRequest = await req.json();

      if (!email || !code || !newPassword) {
        return new Response(
          JSON.stringify({ error: "Email, code, and new password are required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      if (newPassword.length < 6) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 6 characters" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Verify code again
      const { data: resetCode, error: fetchError } = await supabase
        .from("password_reset_codes")
        .select("*")
        .eq("email", email)
        .eq("code", code)
        .eq("used", false)
        .single();

      if (fetchError || !resetCode) {
        console.error("Code verification failed:", fetchError);
        return new Response(
          JSON.stringify({ error: "Invalid or expired code" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Check if code has expired
      const expiresAt = new Date(resetCode.expires_at);
      if (expiresAt < new Date()) {
        return new Response(
          JSON.stringify({ error: "Code has expired" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Get user by email
      const { data: users, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) {
        console.error("Error fetching users:", userError);
        return new Response(
          JSON.stringify({ error: "Failed to reset password" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      const user = users.users.find(u => u.email === email);

      if (!user) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Update password
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
      );

      if (updateError) {
        console.error("Error updating password:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update password" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Mark code as used
      await supabase
        .from("password_reset_codes")
        .update({ used: true })
        .eq("id", resetCode.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Password reset successfully" 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  } catch (error: any) {
    console.error("Error in verify-reset-code-and-update-password function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
