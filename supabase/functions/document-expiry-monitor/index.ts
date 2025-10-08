import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get documents expiring in the next 30 days
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const { data: expiringDocs } = await supabaseAdmin
      .from('document_expiry_tracking')
      .select('*, legal_letters(id, user_id, title)')
      .lte('expires_at', thirtyDaysFromNow.toISOString())
      .eq('reminder_sent', false)

    let notificationsSent = 0

    for (const doc of expiringDocs || []) {
      const daysUntilExpiry = Math.floor((new Date(doc.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

      // Create notification
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: doc.legal_letters.user_id,
          title: 'Document Expiring Soon',
          message: `Your document "${doc.legal_letters.title}" will expire in ${daysUntilExpiry} days`,
          type: 'warning',
          metadata: {
            letter_id: doc.letter_id,
            expires_at: doc.expires_at,
            days_until_expiry: daysUntilExpiry
          }
        })

      // Mark reminder as sent
      await supabaseAdmin
        .from('document_expiry_tracking')
        .update({ reminder_sent: true, reminder_sent_at: new Date().toISOString() })
        .eq('id', doc.id)

      notificationsSent++
    }

    // Auto-archive expired documents
    const now = new Date().toISOString()
    const { data: expiredDocs } = await supabaseAdmin
      .from('document_expiry_tracking')
      .select('letter_id')
      .lte('expires_at', now)
      .eq('auto_archive', true)

    if (expiredDocs && expiredDocs.length > 0) {
      await supabaseAdmin
        .from('legal_letters')
        .update({ status: 'archived' })
        .in('id', expiredDocs.map(d => d.letter_id))
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifications_sent: notificationsSent,
        documents_archived: expiredDocs?.length || 0
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})