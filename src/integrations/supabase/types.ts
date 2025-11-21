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
      appointments: {
        Row: {
          created_at: string | null
          date: string
          doctor_name: string
          id: string
          location: string | null
          notes: string | null
          phone: string | null
          reminder_sent: boolean | null
          specialty: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          doctor_name: string
          id?: string
          location?: string | null
          notes?: string | null
          phone?: string | null
          reminder_sent?: boolean | null
          specialty: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          doctor_name?: string
          id?: string
          location?: string | null
          notes?: string | null
          phone?: string | null
          reminder_sent?: boolean | null
          specialty?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      emergency_activations: {
        Row: {
          activated_at: string | null
          contacts_notified: Json | null
          id: string
          location: Json | null
          notes: string | null
          resolved_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          contacts_notified?: Json | null
          id?: string
          location?: Json | null
          notes?: string | null
          resolved_at?: string | null
          status: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          contacts_notified?: Json | null
          id?: string
          location?: Json | null
          notes?: string | null
          resolved_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_emergency: boolean | null
          is_favorite: boolean | null
          name: string
          phone: string
          photo_url: string | null
          relationship: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_emergency?: boolean | null
          is_favorite?: boolean | null
          name: string
          phone: string
          photo_url?: string | null
          relationship?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_emergency?: boolean | null
          is_favorite?: boolean | null
          name?: string
          phone?: string
          photo_url?: string | null
          relationship?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      guardian_invitations: {
        Row: {
          access_level: string
          created_at: string | null
          expires_at: string | null
          guardian_id: string | null
          id: string
          invitation_token: string
          invited_email: string
          message: string | null
          patient_id: string
          relationship_type: string | null
          responded_at: string | null
          status: string
        }
        Insert: {
          access_level?: string
          created_at?: string | null
          expires_at?: string | null
          guardian_id?: string | null
          id?: string
          invitation_token?: string
          invited_email: string
          message?: string | null
          patient_id: string
          relationship_type?: string | null
          responded_at?: string | null
          status?: string
        }
        Update: {
          access_level?: string
          created_at?: string | null
          expires_at?: string | null
          guardian_id?: string | null
          id?: string
          invitation_token?: string
          invited_email?: string
          message?: string | null
          patient_id?: string
          relationship_type?: string | null
          responded_at?: string | null
          status?: string
        }
        Relationships: []
      }
      guardian_notification_preferences: {
        Row: {
          created_at: string | null
          enabled: boolean
          guardian_id: string
          id: string
          notify_appointment_cancelled: boolean
          notify_appointment_completed: boolean
          notify_appointment_created: boolean
          notify_appointment_upcoming: boolean
          notify_medication_missed: boolean
          notify_medication_taken: boolean
          notify_medication_upcoming: boolean
          patient_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean
          guardian_id: string
          id?: string
          notify_appointment_cancelled?: boolean
          notify_appointment_completed?: boolean
          notify_appointment_created?: boolean
          notify_appointment_upcoming?: boolean
          notify_medication_missed?: boolean
          notify_medication_taken?: boolean
          notify_medication_upcoming?: boolean
          patient_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean
          guardian_id?: string
          id?: string
          notify_appointment_cancelled?: boolean
          notify_appointment_completed?: boolean
          notify_appointment_created?: boolean
          notify_appointment_upcoming?: boolean
          notify_medication_missed?: boolean
          notify_medication_taken?: boolean
          notify_medication_upcoming?: boolean
          patient_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guardian_notification_preferences_guardian_id_patient_id_fkey"
            columns: ["guardian_id", "patient_id"]
            isOneToOne: true
            referencedRelation: "guardian_relationships"
            referencedColumns: ["guardian_id", "patient_id"]
          },
        ]
      }
      guardian_relationships: {
        Row: {
          access_level: string
          created_at: string | null
          guardian_id: string
          id: string
          notes: string | null
          patient_id: string
          relationship_type: string | null
          revoked_at: string | null
          revoked_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          access_level?: string
          created_at?: string | null
          guardian_id: string
          id?: string
          notes?: string | null
          patient_id: string
          relationship_type?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          access_level?: string
          created_at?: string | null
          guardian_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          relationship_type?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      live_locations: {
        Row: {
          accuracy: number | null
          battery_level: number | null
          heading: number | null
          is_moving: boolean | null
          last_movement_at: string | null
          latitude: number
          longitude: number
          speed: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          battery_level?: number | null
          heading?: number | null
          is_moving?: boolean | null
          last_movement_at?: string | null
          latitude: number
          longitude: number
          speed?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accuracy?: number | null
          battery_level?: number | null
          heading?: number | null
          is_moving?: boolean | null
          last_movement_at?: string | null
          latitude?: number
          longitude?: number
          speed?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      location_history: {
        Row: {
          accuracy: number | null
          heading: number | null
          id: number
          latitude: number
          longitude: number
          recorded_at: string | null
          speed: number | null
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          heading?: number | null
          id?: number
          latitude: number
          longitude: number
          recorded_at?: string | null
          speed?: number | null
          user_id: string
        }
        Update: {
          accuracy?: number | null
          heading?: number | null
          id?: number
          latitude?: number
          longitude?: number
          recorded_at?: string | null
          speed?: number | null
          user_id?: string
        }
        Relationships: []
      }
      location_sharing_settings: {
        Row: {
          accuracy_threshold_meters: number | null
          consent_given_at: string | null
          consent_text: string | null
          created_at: string | null
          is_sharing: boolean
          update_interval_seconds: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accuracy_threshold_meters?: number | null
          consent_given_at?: string | null
          consent_text?: string | null
          created_at?: string | null
          is_sharing?: boolean
          update_interval_seconds?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accuracy_threshold_meters?: number | null
          consent_given_at?: string | null
          consent_text?: string | null
          created_at?: string | null
          is_sharing?: boolean
          update_interval_seconds?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      medication_logs: {
        Row: {
          created_at: string | null
          id: string
          medication_id: string
          notes: string | null
          scheduled_time: string
          status: string
          taken_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          medication_id: string
          notes?: string | null
          scheduled_time: string
          status: string
          taken_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          medication_id?: string
          notes?: string | null
          scheduled_time?: string
          status?: string
          taken_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_logs_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          active: boolean | null
          created_at: string | null
          dosage: string | null
          end_date: string | null
          frequency: string
          id: string
          name: string
          notes: string | null
          start_date: string
          times: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          dosage?: string | null
          end_date?: string | null
          frequency: string
          id?: string
          name: string
          notes?: string | null
          start_date: string
          times: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          dosage?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          name?: string
          notes?: string | null
          start_date?: string
          times?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_schedules: {
        Row: {
          appointment_id: string | null
          body: string
          click_action: string | null
          created_at: string | null
          icon: string | null
          id: string
          medication_id: string | null
          scheduled_for: string
          sent: boolean | null
          sent_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          body: string
          click_action?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          medication_id?: string | null
          scheduled_for: string
          sent?: boolean | null
          sent_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          body?: string
          click_action?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          medication_id?: string | null
          scheduled_for?: string
          sent?: boolean | null
          sent_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_schedules_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_schedules_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          notifications_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          notifications_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          notifications_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      suggestions: {
        Row: {
          angel_id: string
          created_at: string | null
          id: string
          patient_id: string
          patient_response: string | null
          responded_at: string | null
          status: Database["public"]["Enums"]["suggestion_status"] | null
          suggestion_data: Json
          target_appointment_id: string | null
          target_medication_id: string | null
          type: Database["public"]["Enums"]["suggestion_type"]
          updated_at: string | null
        }
        Insert: {
          angel_id: string
          created_at?: string | null
          id?: string
          patient_id: string
          patient_response?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["suggestion_status"] | null
          suggestion_data: Json
          target_appointment_id?: string | null
          target_medication_id?: string | null
          type: Database["public"]["Enums"]["suggestion_type"]
          updated_at?: string | null
        }
        Update: {
          angel_id?: string
          created_at?: string | null
          id?: string
          patient_id?: string
          patient_response?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["suggestion_status"] | null
          suggestion_data?: Json
          target_appointment_id?: string | null
          target_medication_id?: string | null
          type?: Database["public"]["Enums"]["suggestion_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_target_appointment_id_fkey"
            columns: ["target_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_target_medication_id_fkey"
            columns: ["target_medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_guardians_to_notify: {
        Args: { _notification_type: string; _patient_id: string }
        Returns: {
          guardian_email: string
          guardian_id: string
          guardian_name: string
        }[]
      }
      get_patients_for_guardian: {
        Args: { _guardian_id: string }
        Returns: {
          access_level: string
          created_at: string
          patient_email: string
          patient_id: string
          patient_name: string
          relationship_type: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_guardian_of: {
        Args: { _guardian_id: string; _patient_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "angel"
      suggestion_status: "pending" | "approved" | "rejected"
      suggestion_type:
        | "medication_create"
        | "medication_update"
        | "medication_delete"
        | "appointment_create"
        | "appointment_update"
        | "appointment_delete"
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
      app_role: ["admin", "user", "angel"],
      suggestion_status: ["pending", "approved", "rejected"],
      suggestion_type: [
        "medication_create",
        "medication_update",
        "medication_delete",
        "appointment_create",
        "appointment_update",
        "appointment_delete",
      ],
    },
  },
} as const
