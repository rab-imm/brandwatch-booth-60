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
      profiles: {
        Row: {
          created_at: string
          current_company_id: string | null
          email: string | null
          full_name: string | null
          id: string
          max_credits_per_period: number | null
          queries_reset_date: string
          queries_used: number
          subscription_status: string
          subscription_tier: string
          updated_at: string
          user_id: string
          user_role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          current_company_id?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          max_credits_per_period?: number | null
          queries_reset_date?: string
          queries_used?: number
          subscription_status?: string
          subscription_tier?: string
          updated_at?: string
          user_id: string
          user_role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          current_company_id?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          max_credits_per_period?: number | null
          queries_reset_date?: string
          queries_used?: number
          subscription_status?: string
          subscription_tier?: string
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
      user_company_roles: {
        Row: {
          company_id: string | null
          created_at: string
          credits_reset_date: string
          id: string
          max_credits_per_period: number | null
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
