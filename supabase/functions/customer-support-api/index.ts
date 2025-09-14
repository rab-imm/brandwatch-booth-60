import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CUSTOMER-SUPPORT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Customer support request started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'list_tickets';

    logStep("Processing action", { action });

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");

    switch (action) {
      case 'create_ticket':
        return await createTicket(supabaseClient, req, user.id);
      case 'list_tickets':
        return await listTickets(supabaseClient, req, user.id);
      case 'get_ticket':
        return await getTicket(supabaseClient, req, user.id);
      case 'update_ticket':
        return await updateTicket(supabaseClient, req, user.id);
      case 'assign_ticket':
        return await assignTicket(supabaseClient, req, user.id);
      case 'resolve_ticket':
        return await resolveTicket(supabaseClient, req, user.id);
      case 'get_support_stats':
        return await getSupportStats(supabaseClient, req, user.id);
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    logStep("ERROR in customer support", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function createTicket(supabaseClient: any, req: Request, userId: string) {
  const { subject, description, category = 'technical', priority = 'medium', company_id } = await req.json();
  
  logStep("Creating support ticket", { subject, category, priority });

  // Get billing context for the user
  const billingContext = await getBillingContext(supabaseClient, userId);

  // Create ticket
  const { data: ticket, error: ticketError } = await supabaseClient
    .from('customer_support_tickets')
    .insert({
      user_id: userId,
      company_id,
      subject,
      description,
      category,
      priority,
      billing_context: billingContext,
      status: 'open'
    })
    .select()
    .single();

  if (ticketError) {
    throw new Error(`Failed to create ticket: ${ticketError.message}`);
  }

  // Create notification for admins
  await createAdminNotification(supabaseClient, {
    title: `New Support Ticket: ${ticket.ticket_number}`,
    message: `${category} ticket created by user: ${subject}`,
    metadata: {
      ticket_id: ticket.id,
      ticket_number: ticket.ticket_number,
      category,
      priority
    }
  });

  return new Response(JSON.stringify({ 
    success: true, 
    ticket,
    message: 'Support ticket created successfully' 
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function listTickets(supabaseClient: any, req: Request, userId: string) {
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const category = url.searchParams.get('category');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  logStep("Listing tickets", { status, category, limit, offset });

  // Check if user is admin
  const isAdmin = await checkAdminAccess(supabaseClient, userId);

  let query = supabaseClient
    .from('customer_support_tickets')
    .select(`
      *,
      profiles!customer_support_tickets_user_id_fkey (
        full_name,
        email,
        subscription_tier
      )
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Filter by user if not admin
  if (!isAdmin) {
    query = query.eq('user_id', userId);
  }

  // Apply filters
  if (status) {
    query = query.eq('status', status);
  }
  if (category) {
    query = query.eq('category', category);
  }

  const { data: tickets, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch tickets: ${error.message}`);
  }

  // Get total count for pagination
  let countQuery = supabaseClient
    .from('customer_support_tickets')
    .select('id', { count: 'exact' });

  if (!isAdmin) {
    countQuery = countQuery.eq('user_id', userId);
  }
  if (status) {
    countQuery = countQuery.eq('status', status);
  }
  if (category) {
    countQuery = countQuery.eq('category', category);
  }

  const { count } = await countQuery;

  return new Response(JSON.stringify({ 
    tickets: tickets || [],
    total: count || 0,
    limit,
    offset
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function getTicket(supabaseClient: any, req: Request, userId: string) {
  const url = new URL(req.url);
  const ticketId = url.searchParams.get('ticket_id');

  if (!ticketId) {
    throw new Error("ticket_id parameter is required");
  }

  logStep("Getting ticket", { ticketId });

  const isAdmin = await checkAdminAccess(supabaseClient, userId);

  let query = supabaseClient
    .from('customer_support_tickets')
    .select(`
      *,
      profiles!customer_support_tickets_user_id_fkey (
        full_name,
        email,
        subscription_tier,
        subscription_status
      ),
      assigned_admin:profiles!customer_support_tickets_assigned_admin_id_fkey (
        full_name,
        email
      )
    `)
    .eq('id', ticketId);

  // Restrict access if not admin
  if (!isAdmin) {
    query = query.eq('user_id', userId);
  }

  const { data: ticket, error } = await query.single();

  if (error) {
    throw new Error(`Failed to fetch ticket: ${error.message}`);
  }

  return new Response(JSON.stringify({ ticket }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function updateTicket(supabaseClient: any, req: Request, userId: string) {
  const { ticket_id, updates } = await req.json();
  
  logStep("Updating ticket", { ticket_id, updates });

  const isAdmin = await checkAdminAccess(supabaseClient, userId);

  // Prepare update data
  const updateData: any = { ...updates };
  
  // Add admin context if updating as admin
  if (isAdmin && updates.status) {
    updateData.updated_at = new Date().toISOString();
    
    if (updates.status === 'resolved' && !updateData.resolved_at) {
      updateData.resolved_at = new Date().toISOString();
    }
  }

  let query = supabaseClient
    .from('customer_support_tickets')
    .update(updateData)
    .eq('id', ticket_id);

  // Restrict access if not admin
  if (!isAdmin) {
    query = query.eq('user_id', userId);
  }

  const { data: ticket, error } = await query.select().single();

  if (error) {
    throw new Error(`Failed to update ticket: ${error.message}`);
  }

  return new Response(JSON.stringify({ 
    success: true, 
    ticket,
    message: 'Ticket updated successfully' 
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function assignTicket(supabaseClient: any, req: Request, userId: string) {
  const { ticket_id, assigned_admin_id } = await req.json();
  
  logStep("Assigning ticket", { ticket_id, assigned_admin_id });

  // Check admin access
  const isAdmin = await checkAdminAccess(supabaseClient, userId);
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  const { data: ticket, error } = await supabaseClient
    .from('customer_support_tickets')
    .update({
      assigned_admin_id,
      status: 'in_progress',
      updated_at: new Date().toISOString()
    })
    .eq('id', ticket_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to assign ticket: ${error.message}`);
  }

  return new Response(JSON.stringify({ 
    success: true, 
    ticket,
    message: 'Ticket assigned successfully' 
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function resolveTicket(supabaseClient: any, req: Request, userId: string) {
  const { ticket_id, resolution_notes, customer_satisfaction_rating } = await req.json();
  
  logStep("Resolving ticket", { ticket_id, customer_satisfaction_rating });

  const isAdmin = await checkAdminAccess(supabaseClient, userId);
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  const { data: ticket, error } = await supabaseClient
    .from('customer_support_tickets')
    .update({
      status: 'resolved',
      resolution_notes,
      customer_satisfaction_rating,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', ticket_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to resolve ticket: ${error.message}`);
  }

  return new Response(JSON.stringify({ 
    success: true, 
    ticket,
    message: 'Ticket resolved successfully' 
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function getSupportStats(supabaseClient: any, req: Request, userId: string) {
  const isAdmin = await checkAdminAccess(supabaseClient, userId);
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  logStep("Getting support statistics");

  // Get ticket counts by status
  const { data: statusCounts } = await supabaseClient
    .from('customer_support_tickets')
    .select('status')
    .then(({ data }) => {
      const counts = data?.reduce((acc: any, ticket: any) => {
        acc[ticket.status] = (acc[ticket.status] || 0) + 1;
        return acc;
      }, {}) || {};
      return { data: counts };
    });

  // Get ticket counts by category
  const { data: categoryCounts } = await supabaseClient
    .from('customer_support_tickets')
    .select('category')
    .then(({ data }) => {
      const counts = data?.reduce((acc: any, ticket: any) => {
        acc[ticket.category] = (acc[ticket.category] || 0) + 1;
        return acc;
      }, {}) || {};
      return { data: counts };
    });

  // Get average resolution time for resolved tickets
  const { data: resolvedTickets } = await supabaseClient
    .from('customer_support_tickets')
    .select('created_at, resolved_at')
    .eq('status', 'resolved')
    .not('resolved_at', 'is', null);

  const avgResolutionTime = resolvedTickets?.reduce((acc, ticket) => {
    const created = new Date(ticket.created_at).getTime();
    const resolved = new Date(ticket.resolved_at).getTime();
    const hours = (resolved - created) / (1000 * 60 * 60);
    return acc + hours;
  }, 0) / (resolvedTickets?.length || 1);

  // Get customer satisfaction average
  const { data: satisfactionData } = await supabaseClient
    .from('customer_support_tickets')
    .select('customer_satisfaction_rating')
    .not('customer_satisfaction_rating', 'is', null);

  const avgSatisfaction = satisfactionData?.reduce((acc, ticket) => {
    return acc + ticket.customer_satisfaction_rating;
  }, 0) / (satisfactionData?.length || 1);

  return new Response(JSON.stringify({
    stats: {
      ticketsByStatus: statusCounts || {},
      ticketsByCategory: categoryCounts || {},
      averageResolutionHours: Number(avgResolutionTime?.toFixed(2)) || 0,
      averageCustomerSatisfaction: Number(avgSatisfaction?.toFixed(2)) || 0,
      totalTickets: resolvedTickets?.length || 0
    }
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

// Helper functions
async function checkAdminAccess(supabaseClient: any, userId: string): Promise<boolean> {
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('user_role')
    .eq('user_id', userId)
    .single();

  return profile?.user_role === 'super_admin';
}

async function getBillingContext(supabaseClient: any, userId: string) {
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select(`
      subscription_tier,
      subscription_status,
      queries_used,
      max_credits_per_period,
      payment_failure_count,
      customer_risk_score
    `)
    .eq('user_id', userId)
    .single();

  // Get recent billing transactions
  const { data: recentTransactions } = await supabaseClient
    .from('billing_transactions')
    .select('transaction_type, amount_aed, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    profile: profile || {},
    recent_transactions: recentTransactions || []
  };
}

async function createAdminNotification(supabaseClient: any, notification: any) {
  // Get all super admins
  const { data: admins } = await supabaseClient
    .from('profiles')
    .select('user_id')
    .eq('user_role', 'super_admin');

  // Create notifications for all admins
  if (admins && admins.length > 0) {
    const notifications = admins.map(admin => ({
      user_id: admin.user_id,
      title: notification.title,
      message: notification.message,
      type: 'support_ticket',
      metadata: notification.metadata
    }));

    await supabaseClient
      .from('notifications')
      .insert(notifications);
  }
}