export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json
          id: string
          ip_address: unknown | null
          request_id: string | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          id?: string
          ip_address?: unknown | null
          request_id?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          id?: string
          ip_address?: unknown | null
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
          referencedColumns: ["id"]
        },
      ]
      }
      auth_sessions: {
        Row: {
          session_id: string
          user_id: string
          issued_at: string
          expires_at: string
          last_activity: string
          user_agent: string | null
          ip_address: string | null
          metadata: Json | null
          revoked: boolean
          revoked_reason: string | null
          revoked_at: string | null
          created_at: string
        }
        Insert: {
          session_id: string
          user_id: string
          issued_at: string
          expires_at: string
          last_activity: string
          user_agent?: string | null
          ip_address?: string | null
          metadata?: Json | null
          revoked?: boolean
          revoked_reason?: string | null
          revoked_at?: string | null
          created_at?: string
        }
        Update: {
          session_id?: string
          user_id?: string
          issued_at?: string
          expires_at?: string
          last_activity?: string
          user_agent?: string | null
          ip_address?: string | null
          metadata?: Json | null
          revoked?: boolean
          revoked_reason?: string | null
          revoked_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      auth_bruteforce_attempts: {
        Row: {
          ip_address: string
          failure_count: number
          first_failure_at: string
          last_failure_at: string
          blocked_until: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          ip_address: string
          failure_count?: number
          first_failure_at?: string
          last_failure_at?: string
          blocked_until?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          ip_address?: string
          failure_count?: number
          first_failure_at?: string
          last_failure_at?: string
          blocked_until?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      auth_rate_limit_counters: {
        Row: {
          key: string
          window_start: string
          requests: number
          limit_value: number | null
          endpoint: string | null
          metadata: Json | null
          updated_at: string
          created_at: string
        }
        Insert: {
          key: string
          window_start: string
          requests?: number
          limit_value?: number | null
          endpoint?: string | null
          metadata?: Json | null
          updated_at?: string
          created_at?: string
        }
        Update: {
          key?: string
          window_start?: string
          requests?: number
          limit_value?: number | null
          endpoint?: string | null
          metadata?: Json | null
          updated_at?: string
          created_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          features: Json
          id: string
          internal_metadata: Json
          name: string
          price_amount: number
          price_currency: string
          status: string
          stripe_metadata: Json
          stripe_price_id: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          features?: Json
          id: string
          internal_metadata?: Json
          name: string
          price_amount: number
          price_currency?: string
          status?: string
          stripe_metadata?: Json
          stripe_price_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          internal_metadata?: Json
          name?: string
          price_amount?: number
          price_currency?: string
          status?: string
          stripe_metadata?: Json
          stripe_price_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount_paid: number
          commission_amount: number | null
          commission_rate: number | null
          completed_at: string | null
          created_at: string
          currency: string
          id: string
          product_id: string
          referrer_id: string | null
          refund_amount: number | null
          refunded_at: string | null
          status: string
          stripe_customer_id: string
          stripe_metadata: Json
          stripe_payment_intent_id: string | null
          stripe_session_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid: number
          commission_amount?: number | null
          commission_rate?: number | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          product_id: string
          referrer_id?: string | null
          refund_amount?: number | null
          refunded_at?: string | null
          status?: string
          stripe_customer_id: string
          stripe_metadata?: Json
          stripe_payment_intent_id?: string | null
          stripe_session_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          commission_amount?: number | null
          commission_rate?: number | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          product_id?: string
          referrer_id?: string | null
          refund_amount?: number | null
          refunded_at?: string | null
          status?: string
          stripe_customer_id?: string
          stripe_metadata?: Json
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_conversions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          commission_amount: number
          commission_rate: number
          commission_status: string
          conversion_type: string
          created_at: string
          id: string
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          purchase_amount: number
          purchase_id: string
          referred_user_id: string
          referrer_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          commission_amount: number
          commission_rate: number
          commission_status?: string
          conversion_type?: string
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          purchase_amount: number
          purchase_id: string
          referred_user_id: string
          referrer_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          commission_amount?: number
          commission_rate?: number
          commission_status?: string
          conversion_type?: string
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          purchase_amount?: number
          purchase_id?: string
          referred_user_id?: string
          referrer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_conversions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_conversions_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_conversions_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_conversions_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          is_public: boolean
          is_sensitive: boolean
          key: string
          updated_at: string
          value: Json
          value_type: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          is_public?: boolean
          is_sensitive?: boolean
          key: string
          updated_at?: string
          value: Json
          value_type: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          is_public?: boolean
          is_sensitive?: boolean
          key?: string
          updated_at?: string
          value?: Json
          value_type?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          consents: Json
          created_at: string
          full_name: string
          id: string
          onboarding_completed: boolean
          onboarding_completed_at: string | null
          referral_code: string | null
          referrer_id: string | null
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          consents?: Json
          created_at?: string
          full_name: string
          id: string
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          referral_code?: string | null
          referrer_id?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          consents?: Json
          created_at?: string
          full_name?: string
          id?: string
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          referral_code?: string | null
          referrer_id?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_pending_commissions: {
        Args: { referrer_uuid: string }
        Returns: {
          commission_amount: number
          conversion_id: string
          created_at: string
          purchase_amount: number
          referred_user_name: string
        }[]
      }
      get_product_stats: {
        Args: { product_stripe_id: string }
        Returns: {
          active_referrals: number
          avg_commission_rate: number
          total_purchases: number
          total_revenue: number
        }[]
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
