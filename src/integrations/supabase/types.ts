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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      adjustments: {
        Row: {
          adj_date: string
          amount: number
          created_at: string
          id: string
          kind: string
          order_id: string
          remarks: string | null
        }
        Insert: {
          adj_date?: string
          amount: number
          created_at?: string
          id?: string
          kind: string
          order_id: string
          remarks?: string | null
        }
        Update: {
          adj_date?: string
          amount?: number
          created_at?: string
          id?: string
          kind?: string
          order_id?: string
          remarks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "adjustments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adjustments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      attachments: {
        Row: {
          category: string
          created_at: string
          file_name: string
          file_path: string
          id: string
          order_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          order_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          order_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: number
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: never
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: never
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      buyers: {
        Row: {
          billing_address: string | null
          city: string | null
          contact_person: string | null
          created_at: string
          delivery_address: string | null
          department: string | null
          district: string | null
          email: string | null
          id: string
          is_sample: boolean
          mobile: string | null
          name: string
          org_type: string | null
          other_contacts: string | null
          pin_code: string | null
          remarks: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          billing_address?: string | null
          city?: string | null
          contact_person?: string | null
          created_at?: string
          delivery_address?: string | null
          department?: string | null
          district?: string | null
          email?: string | null
          id?: string
          is_sample?: boolean
          mobile?: string | null
          name: string
          org_type?: string | null
          other_contacts?: string | null
          pin_code?: string | null
          remarks?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          billing_address?: string | null
          city?: string | null
          contact_person?: string | null
          created_at?: string
          delivery_address?: string | null
          department?: string | null
          district?: string | null
          email?: string | null
          id?: string
          is_sample?: boolean
          mobile?: string | null
          name?: string
          org_type?: string | null
          other_contacts?: string | null
          pin_code?: string | null
          remarks?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crac_records: {
        Row: {
          crac_amount: number | null
          crac_date: string | null
          crac_number: string | null
          created_at: string
          dispatch_id: string | null
          follow_up_date: string | null
          id: string
          invoice_number: string | null
          order_id: string
          remarks: string | null
          status: string
          updated_at: string
        }
        Insert: {
          crac_amount?: number | null
          crac_date?: string | null
          crac_number?: string | null
          created_at?: string
          dispatch_id?: string | null
          follow_up_date?: string | null
          id?: string
          invoice_number?: string | null
          order_id: string
          remarks?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          crac_amount?: number | null
          crac_date?: string | null
          crac_number?: string | null
          created_at?: string
          dispatch_id?: string | null
          follow_up_date?: string | null
          id?: string
          invoice_number?: string | null
          order_id?: string
          remarks?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crac_records_dispatch_id_fkey"
            columns: ["dispatch_id"]
            isOneToOne: false
            referencedRelation: "dispatches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crac_records_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crac_records_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_items: {
        Row: {
          dispatch_id: string
          id: string
          order_item_id: string
          quantity: number
        }
        Insert: {
          dispatch_id: string
          id?: string
          order_item_id: string
          quantity: number
        }
        Update: {
          dispatch_id?: string
          id?: string
          order_item_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_items_dispatch_id_fkey"
            columns: ["dispatch_id"]
            isOneToOne: false
            referencedRelation: "dispatches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_items_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatches: {
        Row: {
          actual_delivery: string | null
          buyer_received_date: string | null
          created_at: string
          delivery_status: string
          dispatch_date: string
          docket_number: string | null
          eway_bill: string | null
          expected_delivery: string | null
          id: string
          invoice_amount: number | null
          invoice_date: string | null
          invoice_number: string | null
          lr_number: string | null
          order_id: string
          remarks: string | null
          transport_mode: string | null
          transporter: string | null
          updated_at: string
          vehicle_number: string | null
        }
        Insert: {
          actual_delivery?: string | null
          buyer_received_date?: string | null
          created_at?: string
          delivery_status?: string
          dispatch_date: string
          docket_number?: string | null
          eway_bill?: string | null
          expected_delivery?: string | null
          id?: string
          invoice_amount?: number | null
          invoice_date?: string | null
          invoice_number?: string | null
          lr_number?: string | null
          order_id: string
          remarks?: string | null
          transport_mode?: string | null
          transporter?: string | null
          updated_at?: string
          vehicle_number?: string | null
        }
        Update: {
          actual_delivery?: string | null
          buyer_received_date?: string | null
          created_at?: string
          delivery_status?: string
          dispatch_date?: string
          docket_number?: string | null
          eway_bill?: string | null
          expected_delivery?: string | null
          id?: string
          invoice_amount?: number | null
          invoice_date?: string | null
          invoice_number?: string | null
          lr_number?: string | null
          order_id?: string
          remarks?: string | null
          transport_mode?: string | null
          transporter?: string | null
          updated_at?: string
          vehicle_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatches_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatches_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          amount: number | null
          created_at: string
          description: string | null
          id: string
          order_id: string
          product_name: string
          quantity: number
          sku: string | null
          tax_pct: number
          unit_price: number
          uom: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          description?: string | null
          id?: string
          order_id: string
          product_name: string
          quantity?: number
          sku?: string | null
          tax_pct?: number
          unit_price?: number
          uom?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string
          product_name?: string
          quantity?: number
          sku?: string | null
          tax_pct?: number
          unit_price?: number
          uom?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          additional_charges: number
          assigned_to: string | null
          buyer_id: string | null
          cancelled: boolean
          contract_ref: string | null
          created_at: string
          created_by: string | null
          crm_id: string
          dispatch_deadline: string
          gem_order_number: string
          id: string
          is_sample: boolean
          official_value: number
          order_date: string
          remarks: string | null
          updated_at: string
        }
        Insert: {
          additional_charges?: number
          assigned_to?: string | null
          buyer_id?: string | null
          cancelled?: boolean
          contract_ref?: string | null
          created_at?: string
          created_by?: string | null
          crm_id?: string
          dispatch_deadline: string
          gem_order_number: string
          id?: string
          is_sample?: boolean
          official_value?: number
          order_date: string
          remarks?: string | null
          updated_at?: string
        }
        Update: {
          additional_charges?: number
          assigned_to?: string | null
          buyer_id?: string | null
          cancelled?: boolean
          contract_ref?: string | null
          created_at?: string
          created_by?: string | null
          crm_id?: string
          dispatch_deadline?: string
          gem_order_number?: string
          id?: string
          is_sample?: boolean
          official_value?: number
          order_date?: string
          remarks?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          bank_ref: string | null
          crac_ref: string | null
          created_at: string
          created_by: string | null
          id: string
          invoice_ref: string | null
          method: string
          order_id: string
          payment_date: string
          remarks: string | null
          reversed: boolean
          reversed_reason: string | null
          transaction_ref: string
        }
        Insert: {
          amount: number
          bank_ref?: string | null
          crac_ref?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_ref?: string | null
          method?: string
          order_id: string
          payment_date: string
          remarks?: string | null
          reversed?: boolean
          reversed_reason?: string | null
          transaction_ref: string
        }
        Update: {
          amount?: number
          bank_ref?: string | null
          crac_ref?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_ref?: string | null
          method?: string
          order_id?: string
          payment_date?: string
          remarks?: string | null
          reversed?: boolean
          reversed_reason?: string | null
          transaction_ref?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      sms_notifications: {
        Row: {
          created_at: string
          error: string | null
          id: string
          kind: string
          message: string | null
          order_id: string | null
          provider_response: string | null
          recipient: string | null
          scheduled_date: string
          sent_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          kind: string
          message?: string | null
          order_id?: string | null
          provider_response?: string | null
          recipient?: string | null
          scheduled_date: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          kind?: string
          message?: string | null
          order_id?: string | null
          provider_response?: string | null
          recipient?: string | null
          scheduled_date?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_logs: {
        Row: {
          attempts: number
          created_at: string
          entity: string
          error: string | null
          id: string
          record_id: string | null
          status: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          entity: string
          error?: string | null
          id?: string
          record_id?: string | null
          status: string
        }
        Update: {
          attempts?: number
          created_at?: string
          entity?: string
          error?: string | null
          id?: string
          record_id?: string | null
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      order_summary: {
        Row: {
          additional_charges: number | null
          adjustments_total: number | null
          amount_received: number | null
          assigned_to: string | null
          buyer_id: string | null
          buyer_mobile: string | null
          buyer_name: string | null
          buyer_state: string | null
          cancelled: boolean | null
          contract_ref: string | null
          crac_generated_count: number | null
          created_at: string | null
          created_by: string | null
          crm_id: string | null
          delivered_count: number | null
          dispatch_count: number | null
          dispatch_deadline: string | null
          dispatched_qty: number | null
          dispatched_value: number | null
          gem_order_number: string | null
          id: string | null
          is_sample: boolean | null
          items_value: number | null
          last_dispatch_date: string | null
          official_value: number | null
          order_date: string | null
          products: string | null
          remarks: string | null
          reminder_date: string | null
          total_qty: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_orders: { Args: { _u: string }; Returns: boolean }
      can_payments: { Args: { _u: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_member: { Args: { _u: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "order_manager" | "accounts_manager" | "viewer"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "order_manager", "accounts_manager", "viewer"],
    },
  },
} as const
