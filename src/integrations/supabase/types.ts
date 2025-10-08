export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      billing_alerts: {
        Row: {
          alert_type: string
          auto_resolve_at: string | null
          company_id: string | null
          created_at: string
          id: string
          is_resolved: boolean | null
          message: string
          metadata: Json | null
          related_entity_id: string | null
          related_entity_type: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          alert_type: string
          auto_resolve_at?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          message: string
          metadata?: Json | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          auto_resolve_at?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          message?: string
          metadata?: Json | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_transactions: {
        Row: {
          amount_aed: number
          company_id: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          metadata: Json | null
          processed_at: string | null
          status: string
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          transaction_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_aed: number
          company_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          status: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          transaction_type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_aed?: number
          company_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          transaction_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      churn_risk_customers: {
        Row: {
          created_at: string
          id: string
          last_activity: string | null
          predicted_churn_date: string | null
          risk_factors: Json
          risk_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_activity?: string | null
          predicted_churn_date?: string | null
          risk_factors?: Json
          risk_score: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_activity?: string | null
          predicted_churn_date?: string | null
          risk_factors?: Json
          risk_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          credits_reset_date: string
          email: string
          id: string
          name: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          total_credits: number
          updated_at: string
          used_credits: number
        }
        Insert: {
          created_at?: string
          credits_reset_date?: string
          email: string
          id?: string
          name: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          total_credits?: number
          updated_at?: string
          used_credits?: number
        }
        Update: {
          created_at?: string
          credits_reset_date?: string
          email?: string
          id?: string
          name?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          total_credits?: number
          updated_at?: string
          used_credits?: number
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_support_tickets: {
        Row: {
          assigned_admin_id: string | null
          billing_context: Json | null
          category: string
          company_id: string | null
          created_at: string
          customer_satisfaction_rating: number | null
          description: string
          id: string
          priority: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_admin_id?: string | null
          billing_context?: Json | null
          category: string
          company_id?: string | null
          created_at?: string
          customer_satisfaction_rating?: number | null
          description: string
          id?: string
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_admin_id?: string | null
          billing_context?: Json | null
          category?: string
          company_id?: string | null
          created_at?: string
          customer_satisfaction_rating?: number | null
          description?: string
          id?: string
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_support_tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: Database["public"]["Enums"]["document_category"]
          content: string
          created_at: string
          embedding: string | null
          file_path: string | null
          id: string
          metadata: Json | null
          status: Database["public"]["Enums"]["document_status"]
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category: Database["public"]["Enums"]["document_category"]
          content: string
          created_at?: string
          embedding?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["document_status"]
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: Database["public"]["Enums"]["document_category"]
          content?: string
          created_at?: string
          embedding?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["document_status"]
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      invitation_tokens: {
        Row: {
          accepted_at: string | null
          company_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          max_credits_per_period: number
          metadata: Json | null
          role: Database["public"]["Enums"]["user_role"]
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          company_id: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          max_credits_per_period?: number
          metadata?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          max_credits_per_period?: number
          metadata?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_tokens_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyer_requests: {
        Row: {
          assigned_lawyer_email: string | null
          company_id: string | null
          conversation_id: string | null
          created_at: string
          description: string
          id: string
          priority: string
          specialization: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_lawyer_email?: string | null
          company_id?: string | null
          conversation_id?: string | null
          created_at?: string
          description: string
          id?: string
          priority?: string
          specialization?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_lawyer_email?: string | null
          company_id?: string | null
          conversation_id?: string | null
          created_at?: string
          description?: string
          id?: string
          priority?: string
          specialization?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lawyer_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lawyer_requests_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_letters: {
        Row: {
          company_id: string | null
          content: string
          created_at: string
          credits_used: number
          finalized_at: string | null
          id: string
          letter_type: Database["public"]["Enums"]["letter_type"]
          metadata: Json | null
          sent_at: string | null
          signed_at: string | null
          status: Database["public"]["Enums"]["letter_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          content: string
          created_at?: string
          credits_used?: number
          finalized_at?: string | null
          id?: string
          letter_type: Database["public"]["Enums"]["letter_type"]
          metadata?: Json | null
          sent_at?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["letter_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          content?: string
          created_at?: string
          credits_used?: number
          finalized_at?: string | null
          id?: string
          letter_type?: Database["public"]["Enums"]["letter_type"]
          metadata?: Json | null
          sent_at?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["letter_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_letters_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      letter_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          letter_type: Database["public"]["Enums"]["letter_type"]
          required_fields: Json | null
          template_content: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          letter_type: Database["public"]["Enums"]["letter_type"]
          required_fields?: Json | null
          template_content: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          letter_type?: Database["public"]["Enums"]["letter_type"]
          required_fields?: Json | null
          template_content?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_messages_conversation"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          expires_at: string | null
          id: string
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      password_reset_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          current_company_id: string | null
          customer_risk_score: number | null
          email: string | null
          full_name: string | null
          id: string
          last_payment_failure: string | null
          max_credits_per_period: number | null
          payment_failure_count: number | null
          queries_reset_date: string
          queries_used: number
          subscription_status: string
          subscription_tier: string
          trial_credits_used: number | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
          user_id: string
          user_role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          current_company_id?: string | null
          customer_risk_score?: number | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_payment_failure?: string | null
          max_credits_per_period?: number | null
          payment_failure_count?: number | null
          queries_reset_date?: string
          queries_used?: number
          subscription_status?: string
          subscription_tier?: string
          trial_credits_used?: number | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id: string
          user_role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          current_company_id?: string | null
          customer_risk_score?: number | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_payment_failure?: string | null
          max_credits_per_period?: number | null
          payment_failure_count?: number | null
          queries_reset_date?: string
          queries_used?: number
          subscription_status?: string
          subscription_tier?: string
          trial_credits_used?: number | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id?: string
          user_role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_company_id_fkey"
            columns: ["current_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      retention_campaign_metrics: {
        Row: {
          campaign_id: string
          clicked_count: number
          converted_count: number
          created_at: string
          date: string
          id: string
          opened_count: number
          sent_count: number
          updated_at: string
        }
        Insert: {
          campaign_id: string
          clicked_count?: number
          converted_count?: number
          created_at?: string
          date?: string
          id?: string
          opened_count?: number
          sent_count?: number
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          clicked_count?: number
          converted_count?: number
          created_at?: string
          date?: string
          id?: string
          opened_count?: number
          sent_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "retention_campaign_metrics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "retention_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      retention_campaigns: {
        Row: {
          campaign_type: string
          created_at: string
          created_by: string | null
          id: string
          message_template: string | null
          name: string
          status: string
          target_segment: string
          trigger_conditions: Json
          updated_at: string
        }
        Insert: {
          campaign_type: string
          created_at?: string
          created_by?: string | null
          id?: string
          message_template?: string | null
          name: string
          status?: string
          target_segment: string
          trigger_conditions?: Json
          updated_at?: string
        }
        Update: {
          campaign_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          message_template?: string | null
          name?: string
          status?: string
          target_segment?: string
          trigger_conditions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      revenue_shares: {
        Row: {
          created_at: string
          creator_share_aed: number
          creator_user_id: string
          download_id: string
          id: string
          platform_share_aed: number
          sale_amount_aed: number
          status: string
          template_id: string
        }
        Insert: {
          created_at?: string
          creator_share_aed: number
          creator_user_id: string
          download_id: string
          id?: string
          platform_share_aed: number
          sale_amount_aed: number
          status?: string
          template_id: string
        }
        Update: {
          created_at?: string
          creator_share_aed?: number
          creator_user_id?: string
          download_id?: string
          id?: string
          platform_share_aed?: number
          sale_amount_aed?: number
          status?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_shares_download_id_fkey"
            columns: ["download_id"]
            isOneToOne: false
            referencedRelation: "template_downloads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_shares_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          admin_user_id: string | null
          company_id: string | null
          created_at: string
          effective_date: string
          event_type: string
          id: string
          metadata: Json | null
          new_status: string | null
          new_tier: string | null
          notes: string | null
          old_status: string | null
          old_tier: string | null
          proration_amount: number | null
          stripe_subscription_id: string | null
          triggered_by: string | null
          user_id: string | null
        }
        Insert: {
          admin_user_id?: string | null
          company_id?: string | null
          created_at?: string
          effective_date?: string
          event_type: string
          id?: string
          metadata?: Json | null
          new_status?: string | null
          new_tier?: string | null
          notes?: string | null
          old_status?: string | null
          old_tier?: string | null
          proration_amount?: number | null
          stripe_subscription_id?: string | null
          triggered_by?: string | null
          user_id?: string | null
        }
        Update: {
          admin_user_id?: string | null
          company_id?: string | null
          created_at?: string
          effective_date?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          new_status?: string | null
          new_tier?: string | null
          notes?: string | null
          old_status?: string | null
          old_tier?: string | null
          proration_amount?: number | null
          stripe_subscription_id?: string | null
          triggered_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      template_analytics: {
        Row: {
          action_type: string
          created_at: string
          id: string
          metadata: Json | null
          template_id: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          template_id: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_analytics_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_downloads: {
        Row: {
          company_id: string | null
          downloaded_at: string
          id: string
          price_paid_aed: number
          stripe_payment_intent_id: string | null
          template_id: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          downloaded_at?: string
          id?: string
          price_paid_aed: number
          stripe_payment_intent_id?: string | null
          template_id: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          downloaded_at?: string
          id?: string
          price_paid_aed?: number
          stripe_payment_intent_id?: string | null
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_downloads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_downloads_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          category: Database["public"]["Enums"]["template_category"]
          content: string
          created_at: string
          created_by: string | null
          description: string | null
          download_count: number
          id: string
          is_active: boolean
          metadata: Json | null
          price_aed: number
          revenue_share_percentage: number | null
          title: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["template_category"]
          content: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          download_count?: number
          id?: string
          is_active?: boolean
          metadata?: Json | null
          price_aed?: number
          revenue_share_percentage?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["template_category"]
          content?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          download_count?: number
          id?: string
          is_active?: boolean
          metadata?: Json | null
          price_aed?: number
          revenue_share_percentage?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      trial_management: {
        Row: {
          conversion_completed: boolean | null
          conversion_date: string | null
          conversion_target_tier: string | null
          created_at: string
          extension_count: number | null
          extension_reason: string | null
          id: string
          metadata: Json | null
          trial_credits_allocated: number
          trial_credits_used: number
          trial_end_date: string
          trial_start_date: string
          trial_status: string
          trial_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conversion_completed?: boolean | null
          conversion_date?: string | null
          conversion_target_tier?: string | null
          created_at?: string
          extension_count?: number | null
          extension_reason?: string | null
          id?: string
          metadata?: Json | null
          trial_credits_allocated?: number
          trial_credits_used?: number
          trial_end_date: string
          trial_start_date?: string
          trial_status?: string
          trial_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conversion_completed?: boolean | null
          conversion_date?: string | null
          conversion_target_tier?: string | null
          created_at?: string
          extension_count?: number | null
          extension_reason?: string | null
          id?: string
          metadata?: Json | null
          trial_credits_allocated?: number
          trial_credits_used?: number
          trial_end_date?: string
          trial_start_date?: string
          trial_status?: string
          trial_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_company_roles: {
        Row: {
          company_id: string | null
          created_at: string
          credits_reset_date: string
          id: string
          max_credits_per_period: number | null
          permissions: Json | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          used_credits: number
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          credits_reset_date?: string
          id?: string
          max_credits_per_period?: number | null
          permissions?: Json | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          used_credits?: number
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          credits_reset_date?: string
          id?: string
          max_credits_per_period?: number | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          used_credits?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_company_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_configurations: {
        Row: {
          created_at: string
          enabled: boolean
          endpoint_url: string
          event_type: string
          id: string
          secret: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          endpoint_url: string
          event_type: string
          id?: string
          secret: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          endpoint_url?: string
          event_type?: string
          id?: string
          secret?: string
          updated_at?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          last_attempt: string | null
          payload: Json
          retry_count: number
          status: string
          updated_at: string
          webhook_config_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          last_attempt?: string | null
          payload?: Json
          retry_count?: number
          status?: string
          updated_at?: string
          webhook_config_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          last_attempt?: string | null
          payload?: Json
          retry_count?: number
          status?: string
          updated_at?: string
          webhook_config_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_webhook_config_id_fkey"
            columns: ["webhook_config_id"]
            isOneToOne: false
            referencedRelation: "webhook_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_revenue_share: {
        Args: {
          p_download_id: string
          p_sale_amount: number
          p_template_id: string
        }
        Returns: string
      }
      cleanup_expired_notifications: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_reset_codes: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_orphaned_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          action: string
          cleaned_user_id: string
          email: string
        }[]
      }
      create_notification: {
        Args: {
          p_action_url?: string
          p_expires_hours?: number
          p_message: string
          p_title: string
          p_type?: string
          p_user_id: string
        }
        Returns: string
      }
      create_template: {
        Args: {
          p_category: Database["public"]["Enums"]["template_category"]
          p_content: string
          p_created_by: string
          p_description: string
          p_price_aed: number
          p_title: string
        }
        Returns: string
      }
      generate_ticket_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_primary_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_permission: {
        Args: { _company_id: string; _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_activity: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_resource_id?: string
          p_resource_type: string
          p_user_id: string
        }
        Returns: string
      }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: undefined
      }
      reset_monthly_queries: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      reset_user_queries: {
        Args: { target_user_id?: string }
        Returns: undefined
      }
      search_documents: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          category: string
          content: string
          id: string
          similarity: number
          title: string
        }[]
      }
      track_template_analytics: {
        Args: {
          p_action_type: string
          p_metadata?: Json
          p_template_id: string
        }
        Returns: string
      }
    }
    Enums: {
      document_category:
        | "employment"
        | "commercial"
        | "real_estate"
        | "family"
        | "criminal"
        | "corporate"
        | "intellectual_property"
      document_status: "pending" | "approved" | "rejected"
      letter_status: "draft" | "finalized" | "sent" | "signed"
      letter_type:
        | "employment_termination"
        | "employment_contract"
        | "lease_agreement"
        | "lease_termination"
        | "demand_letter"
        | "nda"
        | "settlement_agreement"
        | "power_of_attorney"
        | "general_legal"
      subscription_tier: "free" | "essential" | "premium" | "sme" | "enterprise"
      template_category:
        | "employment"
        | "commercial"
        | "real_estate"
        | "family"
        | "criminal"
        | "corporate"
        | "intellectual_property"
      user_role:
        | "super_admin"
        | "company_admin"
        | "company_manager"
        | "company_staff"
        | "individual"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      document_category: [
        "employment",
        "commercial",
        "real_estate",
        "family",
        "criminal",
        "corporate",
        "intellectual_property",
      ],
      document_status: ["pending", "approved", "rejected"],
      letter_status: ["draft", "finalized", "sent", "signed"],
      letter_type: [
        "employment_termination",
        "employment_contract",
        "lease_agreement",
        "lease_termination",
        "demand_letter",
        "nda",
        "settlement_agreement",
        "power_of_attorney",
        "general_legal",
      ],
      subscription_tier: ["free", "essential", "premium", "sme", "enterprise"],
      template_category: [
        "employment",
        "commercial",
        "real_estate",
        "family",
        "criminal",
        "corporate",
        "intellectual_property",
      ],
      user_role: [
        "super_admin",
        "company_admin",
        "company_manager",
        "company_staff",
        "individual",
      ],
    },
  },
} as const
