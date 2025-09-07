export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      Activity: {
        Row: {
          activity_date: string | null
          activity_description: string | null
          activity_id: string
          activity_type: string | null
          audio_path: string | null
          combined_text: string | null
          created_by: string | null
          description: string | null
          effective_date: string | null
          embedding: string | null
          employee: string | null
          event_type: string | null
          lead_id: string | null
          media_type: string | null
          text: string | null
        }
        Insert: {
          activity_date?: string | null
          activity_description?: string | null
          activity_id: string
          activity_type?: string | null
          audio_path?: string | null
          combined_text?: string | null
          created_by?: string | null
          description?: string | null
          effective_date?: string | null
          embedding?: string | null
          employee?: string | null
          event_type?: string | null
          lead_id?: string | null
          media_type?: string | null
          text?: string | null
        }
        Update: {
          activity_date?: string | null
          activity_description?: string | null
          activity_id?: string
          activity_type?: string | null
          audio_path?: string | null
          combined_text?: string | null
          created_by?: string | null
          description?: string | null
          effective_date?: string | null
          embedding?: string | null
          employee?: string | null
          event_type?: string | null
          lead_id?: string | null
          media_type?: string | null
          text?: string | null
        }
        Relationships: []
      }
      app_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          password_hash: string
          updated_at: string
          user_type: string
          username: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          password_hash: string
          updated_at?: string
          user_type: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          password_hash?: string
          updated_at?: string
          user_type?: string
          username?: string
        }
        Relationships: []
      }
      chat_prompts: {
        Row: {
          answer: string[] | null
          created_at: string
          id: string
          prompt_text: string
          response_projects: Json | null
          sales_agent_id: string
        }
        Insert: {
          answer?: string[] | null
          created_at?: string
          id?: string
          prompt_text: string
          response_projects?: Json | null
          sales_agent_id: string
        }
        Update: {
          answer?: string[] | null
          created_at?: string
          id?: string
          prompt_text?: string
          response_projects?: Json | null
          sales_agent_id?: string
        }
        Relationships: []
      }
      Customer: {
        Row: {
          assigned_to: string | null
          budget_range: number | null
          combined_text: string | null
          comments: string | null
          contact_no: number | null
          customer_full_name: string | null
          customer_id: string
          customer_name: string | null
          email: string | null
          email_address: string | null
          embedding: string | null
          last_contacted_date: string | null
          observer: string | null
          phone: number | null
          source: string | null
          status: string | null
        }
        Insert: {
          assigned_to?: string | null
          budget_range?: number | null
          combined_text?: string | null
          comments?: string | null
          contact_no?: number | null
          customer_full_name?: string | null
          customer_id: string
          customer_name?: string | null
          email?: string | null
          email_address?: string | null
          embedding?: string | null
          last_contacted_date?: string | null
          observer?: string | null
          phone?: number | null
          source?: string | null
          status?: string | null
        }
        Update: {
          assigned_to?: string | null
          budget_range?: number | null
          combined_text?: string | null
          comments?: string | null
          contact_no?: number | null
          customer_full_name?: string | null
          customer_id?: string
          customer_name?: string | null
          email?: string | null
          email_address?: string | null
          embedding?: string | null
          last_contacted_date?: string | null
          observer?: string | null
          phone?: number | null
          source?: string | null
          status?: string | null
        }
        Relationships: []
      }
      developers: {
        Row: {
          contact_number: string
          contact_person_name: string
          created_at: string
          developer_id: string
          developer_name: string
          email_address: string
          id: string
          is_active: boolean
          office_address: string | null
          profile_image_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          contact_number: string
          contact_person_name: string
          created_at?: string
          developer_id: string
          developer_name: string
          email_address: string
          id?: string
          is_active?: boolean
          office_address?: string | null
          profile_image_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          contact_number?: string
          contact_person_name?: string
          created_at?: string
          developer_id?: string
          developer_name?: string
          email_address?: string
          id?: string
          is_active?: boolean
          office_address?: string | null
          profile_image_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "developers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      dropdown_settings: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean
          updated_at: string
          value: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          updated_at?: string
          value: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      Lead: {
        Row: {
          booking_amount: number | null
          budget: number | null
          building_name: string | null
          combined_text: string | null
          current_status: string | null
          customer_id: string | null
          developer: string | null
          effective_date_of_change: string | null
          embedding: string | null
          expected_date_of_booking: string | null
          how_many_bedroom: number | null
          lead_id: string
          lead_name: string | null
          number_of_bed_room: number | null
          previous_status: string | null
          project_name: string | null
          purpose_of_buying: string | null
          timeline: string | null
          type_of_lead: string | null
          unit_number: number | null
          unit_type: string | null
        }
        Insert: {
          booking_amount?: number | null
          budget?: number | null
          building_name?: string | null
          combined_text?: string | null
          current_status?: string | null
          customer_id?: string | null
          developer?: string | null
          effective_date_of_change?: string | null
          embedding?: string | null
          expected_date_of_booking?: string | null
          how_many_bedroom?: number | null
          lead_id: string
          lead_name?: string | null
          number_of_bed_room?: number | null
          previous_status?: string | null
          project_name?: string | null
          purpose_of_buying?: string | null
          timeline?: string | null
          type_of_lead?: string | null
          unit_number?: number | null
          unit_type?: string | null
        }
        Update: {
          booking_amount?: number | null
          budget?: number | null
          building_name?: string | null
          combined_text?: string | null
          current_status?: string | null
          customer_id?: string | null
          developer?: string | null
          effective_date_of_change?: string | null
          embedding?: string | null
          expected_date_of_booking?: string | null
          how_many_bedroom?: number | null
          lead_id?: string
          lead_name?: string | null
          number_of_bed_room?: number | null
          previous_status?: string | null
          project_name?: string | null
          purpose_of_buying?: string | null
          timeline?: string | null
          type_of_lead?: string | null
          unit_number?: number | null
          unit_type?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_size: number | null
          attachment_type: string | null
          attachment_url: string | null
          created_at: string
          id: string
          is_read: boolean
          message_text: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message_text: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message_text?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_verifications: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          is_used: boolean
          is_verified: boolean
          new_email: string | null
          otp_code: string
          otp_type: string
          updated_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          is_used?: boolean
          is_verified?: boolean
          new_email?: string | null
          otp_code: string
          otp_type: string
          updated_at?: string
          user_id: string
          user_type: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          is_used?: boolean
          is_verified?: boolean
          new_email?: string | null
          otp_code?: string
          otp_type?: string
          updated_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          address: string | null
          amenities: Json | null
          availability: string | null
          bathrooms_range: string | null
          bedrooms_range: string | null
          brochure_url: string | null
          city: string | null
          combined_text: string | null
          community: string | null
          contacts: Json | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          developer_id: string
          developer_name: string | null
          embedding: string | null
          emirate: string | null
          furnishing_status: string | null
          gallery_images: Json | null
          google_maps_link: string | null
          handover_date: string | null
          has_balcony: boolean | null
          has_elevators: boolean | null
          has_security: boolean | null
          id: string
          is_active: boolean
          latitude: number | null
          listing_type: string | null
          location_description: string | null
          longitude: number | null
          nearby_landmarks: string | null
          other_documents: Json | null
          ownership_type: string | null
          parking_spaces: number | null
          payment_plan: string | null
          pincode: string | null
          price_per_sqft: number | null
          project_id: string
          project_status: string | null
          project_title: string | null
          project_type: string | null
          region_area: string | null
          rera_approval_id: string | null
          sales_contact_name: string | null
          sales_email: string | null
          sales_phone: string | null
          security_details: string | null
          service_charges: number | null
          source: string | null
          starting_price_aed: number | null
          street_name: string | null
          sub_community: string | null
          total_units: number | null
          unit_sizes_range: string | null
          updated_at: string
          url: string | null
          user_id: string
          video_tour_url: string | null
        }
        Insert: {
          address?: string | null
          amenities?: Json | null
          availability?: string | null
          bathrooms_range?: string | null
          bedrooms_range?: string | null
          brochure_url?: string | null
          city?: string | null
          combined_text?: string | null
          community?: string | null
          contacts?: Json | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          developer_id: string
          developer_name?: string | null
          embedding?: string | null
          emirate?: string | null
          furnishing_status?: string | null
          gallery_images?: Json | null
          google_maps_link?: string | null
          handover_date?: string | null
          has_balcony?: boolean | null
          has_elevators?: boolean | null
          has_security?: boolean | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          listing_type?: string | null
          location_description?: string | null
          longitude?: number | null
          nearby_landmarks?: string | null
          other_documents?: Json | null
          ownership_type?: string | null
          parking_spaces?: number | null
          payment_plan?: string | null
          pincode?: string | null
          price_per_sqft?: number | null
          project_id?: string
          project_status?: string | null
          project_title?: string | null
          project_type?: string | null
          region_area?: string | null
          rera_approval_id?: string | null
          sales_contact_name?: string | null
          sales_email?: string | null
          sales_phone?: string | null
          security_details?: string | null
          service_charges?: number | null
          source?: string | null
          starting_price_aed?: number | null
          street_name?: string | null
          sub_community?: string | null
          total_units?: number | null
          unit_sizes_range?: string | null
          updated_at?: string
          url?: string | null
          user_id: string
          video_tour_url?: string | null
        }
        Update: {
          address?: string | null
          amenities?: Json | null
          availability?: string | null
          bathrooms_range?: string | null
          bedrooms_range?: string | null
          brochure_url?: string | null
          city?: string | null
          combined_text?: string | null
          community?: string | null
          contacts?: Json | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          developer_id?: string
          developer_name?: string | null
          embedding?: string | null
          emirate?: string | null
          furnishing_status?: string | null
          gallery_images?: Json | null
          google_maps_link?: string | null
          handover_date?: string | null
          has_balcony?: boolean | null
          has_elevators?: boolean | null
          has_security?: boolean | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          listing_type?: string | null
          location_description?: string | null
          longitude?: number | null
          nearby_landmarks?: string | null
          other_documents?: Json | null
          ownership_type?: string | null
          parking_spaces?: number | null
          payment_plan?: string | null
          pincode?: string | null
          price_per_sqft?: number | null
          project_id?: string
          project_status?: string | null
          project_title?: string | null
          project_type?: string | null
          region_area?: string | null
          rera_approval_id?: string | null
          sales_contact_name?: string | null
          sales_email?: string | null
          sales_phone?: string | null
          security_details?: string | null
          service_charges?: number | null
          source?: string | null
          starting_price_aed?: number | null
          street_name?: string | null
          sub_community?: string | null
          total_units?: number | null
          unit_sizes_range?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
          video_tour_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_agents: {
        Row: {
          contact_number: string
          created_at: string
          email_address: string
          id: string
          is_active: boolean
          profile_image_url: string | null
          sales_agent_id: string
          sales_agent_name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          contact_number: string
          created_at?: string
          email_address: string
          id?: string
          is_active?: boolean
          profile_image_url?: string | null
          sales_agent_id: string
          sales_agent_name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          contact_number?: string
          created_at?: string
          email_address?: string
          id?: string
          is_active?: boolean
          profile_image_url?: string | null
          sales_agent_id?: string
          sales_agent_name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_agents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_projects: {
        Row: {
          id: string
          project_id: string
          sales_agent_id: string
          saved_at: string
        }
        Insert: {
          id?: string
          project_id: string
          sales_agent_id: string
          saved_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          sales_agent_id?: string
          saved_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_saved_projects_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      site_visits: {
        Row: {
          buyer_name: string
          created_at: string
          developer_name: string | null
          id: string
          notes: string | null
          project_id: string
          project_title: string | null
          sales_agent_id: string
          status: string
          updated_at: string
          visit_date: string
          visit_time: string
        }
        Insert: {
          buyer_name: string
          created_at?: string
          developer_name?: string | null
          id?: string
          notes?: string | null
          project_id: string
          project_title?: string | null
          sales_agent_id: string
          status?: string
          updated_at?: string
          visit_date: string
          visit_time: string
        }
        Update: {
          buyer_name?: string
          created_at?: string
          developer_name?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          project_title?: string | null
          sales_agent_id?: string
          status?: string
          updated_at?: string
          visit_date?: string
          visit_time?: string
        }
        Relationships: []
      }
      unified_rag_data: {
        Row: {
          combined_text: string
          created_at: string | null
          embedding: string | null
          id: string
          source_id: string
          source_type: string
        }
        Insert: {
          combined_text: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          source_id: string
          source_type: string
        }
        Update: {
          combined_text?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          source_id?: string
          source_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authenticate_app_user: {
        Args: { input_email: string; input_password: string }
        Returns: {
          user_id: string
          username: string
          email: string
          user_type: string
          success: boolean
        }[]
      }
      cleanup_expired_otps: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_dropdown_code: {
        Args: { category_name: string }
        Returns: string
      }
      get_all_unified_rag_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          source_id: string
          source_type: string
          combined_text: string
          embedding: string
          created_at: string
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      vector_search: {
        Args: { input_vector: string }
        Returns: {
          source_id: string
          source_type: string
          combined_text: string
          similarity: number
        }[]
      }
      vector_search1: {
        Args: { embedding: string }
        Returns: {
          source_id: string
          source_type: string
          combined_text: string
          similarity: number
        }[]
      }
      vector_search2: {
        Args: { embedding_input: string }
        Returns: {
          source_id: string
          source_type: string
          combined_text: string
          similarity: number
        }[]
      }
    }
    Enums: {
      user_role: "user_manager" | "developer" | "sales_agent"
      user_status: "active" | "inactive"
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
      user_role: ["user_manager", "developer", "sales_agent"],
      user_status: ["active", "inactive"],
    },
  },
} as const
