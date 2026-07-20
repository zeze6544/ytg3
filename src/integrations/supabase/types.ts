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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      drug_class_map: {
        Row: {
          class_id: string
          drug_id: string
        }
        Insert: {
          class_id: string
          drug_id: string
        }
        Update: {
          class_id?: string
          drug_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drug_class_map_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "drug_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_class_map_drug_id_fkey"
            columns: ["drug_id"]
            isOneToOne: false
            referencedRelation: "drugs"
            referencedColumns: ["id"]
          },
        ]
      }
      drug_classes: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      drug_interactions: {
        Row: {
          drug_a_id: string
          drug_b_id: string
          id: string
          note: string | null
          severity: Database["public"]["Enums"]["interaction_severity"]
        }
        Insert: {
          drug_a_id: string
          drug_b_id: string
          id?: string
          note?: string | null
          severity?: Database["public"]["Enums"]["interaction_severity"]
        }
        Update: {
          drug_a_id?: string
          drug_b_id?: string
          id?: string
          note?: string | null
          severity?: Database["public"]["Enums"]["interaction_severity"]
        }
        Relationships: [
          {
            foreignKeyName: "drug_interactions_drug_a_id_fkey"
            columns: ["drug_a_id"]
            isOneToOne: false
            referencedRelation: "drugs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_interactions_drug_b_id_fkey"
            columns: ["drug_b_id"]
            isOneToOne: false
            referencedRelation: "drugs"
            referencedColumns: ["id"]
          },
        ]
      }
      drug_references: {
        Row: {
          drug_id: string
          id: string
          label: string
          url: string | null
        }
        Insert: {
          drug_id: string
          id?: string
          label: string
          url?: string | null
        }
        Update: {
          drug_id?: string
          id?: string
          label?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drug_references_drug_id_fkey"
            columns: ["drug_id"]
            isOneToOne: false
            referencedRelation: "drugs"
            referencedColumns: ["id"]
          },
        ]
      }
      drugs: {
        Row: {
          acute_risks: string | null
          adverse_effects: string[] | null
          aliases: string[] | null
          brand_names: string[] | null
          category: Database["public"]["Enums"]["drug_category"]
          chemistry: string | null
          chronic_risks: string | null
          contraindications: string | null
          created_at: string
          dependence: string | null
          discovered_year: number | null
          duration: string | null
          effects: string[] | null
          evidence_quality: Database["public"]["Enums"]["evidence_quality"]
          featured: boolean
          half_life: string | null
          harm_reduction: string | null
          history: string | null
          id: string
          legal_status: string | null
          mechanism: string | null
          medical_status: string | null
          medical_uses: string | null
          name: string
          onset: string | null
          overdose_signs: string | null
          slug: string
          street_names: string[] | null
          summary: string | null
          testing: string | null
          tolerance: string | null
          updated_at: string
          withdrawal: string | null
        }
        Insert: {
          acute_risks?: string | null
          adverse_effects?: string[] | null
          aliases?: string[] | null
          brand_names?: string[] | null
          category?: Database["public"]["Enums"]["drug_category"]
          chemistry?: string | null
          chronic_risks?: string | null
          contraindications?: string | null
          created_at?: string
          dependence?: string | null
          discovered_year?: number | null
          duration?: string | null
          effects?: string[] | null
          evidence_quality?: Database["public"]["Enums"]["evidence_quality"]
          featured?: boolean
          half_life?: string | null
          harm_reduction?: string | null
          history?: string | null
          id?: string
          legal_status?: string | null
          mechanism?: string | null
          medical_status?: string | null
          medical_uses?: string | null
          name: string
          onset?: string | null
          overdose_signs?: string | null
          slug: string
          street_names?: string[] | null
          summary?: string | null
          testing?: string | null
          tolerance?: string | null
          updated_at?: string
          withdrawal?: string | null
        }
        Update: {
          acute_risks?: string | null
          adverse_effects?: string[] | null
          aliases?: string[] | null
          brand_names?: string[] | null
          category?: Database["public"]["Enums"]["drug_category"]
          chemistry?: string | null
          chronic_risks?: string | null
          contraindications?: string | null
          created_at?: string
          dependence?: string | null
          discovered_year?: number | null
          duration?: string | null
          effects?: string[] | null
          evidence_quality?: Database["public"]["Enums"]["evidence_quality"]
          featured?: boolean
          half_life?: string | null
          harm_reduction?: string | null
          history?: string | null
          id?: string
          legal_status?: string | null
          mechanism?: string | null
          medical_status?: string | null
          medical_uses?: string | null
          name?: string
          onset?: string | null
          overdose_signs?: string | null
          slug?: string
          street_names?: string[] | null
          summary?: string | null
          testing?: string | null
          tolerance?: string | null
          updated_at?: string
          withdrawal?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          handle: string | null
          id: string
        }
        Insert: {
          created_at?: string
          handle?: string | null
          id: string
        }
        Update: {
          created_at?: string
          handle?: string | null
          id?: string
        }
        Relationships: []
      }
      saved_entries: {
        Row: {
          created_at: string
          drug_id: string | null
          id: string
          strain_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          drug_id?: string | null
          id?: string
          strain_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          drug_id?: string | null
          id?: string
          strain_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_entries_drug_id_fkey"
            columns: ["drug_id"]
            isOneToOne: false
            referencedRelation: "drugs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_entries_strain_id_fkey"
            columns: ["strain_id"]
            isOneToOne: false
            referencedRelation: "strains"
            referencedColumns: ["id"]
          },
        ]
      }
      strains: {
        Row: {
          adverse: string[] | null
          cbd_high: number | null
          cbd_low: number | null
          confidence: Database["public"]["Enums"]["evidence_quality"]
          created_at: string
          effects: string[] | null
          id: string
          lineage: string | null
          name: string
          slug: string
          summary: string | null
          terpenes: string[] | null
          thc_high: number | null
          thc_low: number | null
          type: Database["public"]["Enums"]["strain_type"]
        }
        Insert: {
          adverse?: string[] | null
          cbd_high?: number | null
          cbd_low?: number | null
          confidence?: Database["public"]["Enums"]["evidence_quality"]
          created_at?: string
          effects?: string[] | null
          id?: string
          lineage?: string | null
          name: string
          slug: string
          summary?: string | null
          terpenes?: string[] | null
          thc_high?: number | null
          thc_low?: number | null
          type?: Database["public"]["Enums"]["strain_type"]
        }
        Update: {
          adverse?: string[] | null
          cbd_high?: number | null
          cbd_low?: number | null
          confidence?: Database["public"]["Enums"]["evidence_quality"]
          created_at?: string
          effects?: string[] | null
          id?: string
          lineage?: string | null
          name?: string
          slug?: string
          summary?: string | null
          terpenes?: string[] | null
          thc_high?: number | null
          thc_low?: number | null
          type?: Database["public"]["Enums"]["strain_type"]
        }
        Relationships: []
      }
      timeline_events: {
        Row: {
          category: Database["public"]["Enums"]["drug_category"] | null
          description: string | null
          drug_id: string | null
          id: string
          title: string
          year: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["drug_category"] | null
          description?: string | null
          drug_id?: string | null
          id?: string
          title: string
          year: number
        }
        Update: {
          category?: Database["public"]["Enums"]["drug_category"] | null
          description?: string | null
          drug_id?: string | null
          id?: string
          title?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_drug_id_fkey"
            columns: ["drug_id"]
            isOneToOne: false
            referencedRelation: "drugs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      view_history: {
        Row: {
          drug_id: string | null
          id: string
          strain_id: string | null
          user_id: string
          viewed_at: string
        }
        Insert: {
          drug_id?: string | null
          id?: string
          strain_id?: string | null
          user_id: string
          viewed_at?: string
        }
        Update: {
          drug_id?: string | null
          id?: string
          strain_id?: string | null
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "view_history_drug_id_fkey"
            columns: ["drug_id"]
            isOneToOne: false
            referencedRelation: "drugs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "view_history_strain_id_fkey"
            columns: ["strain_id"]
            isOneToOne: false
            referencedRelation: "strains"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_drugs: {
        Args: { _category?: string; _term: string }
        Returns: {
          acute_risks: string | null
          adverse_effects: string[] | null
          aliases: string[] | null
          brand_names: string[] | null
          category: Database["public"]["Enums"]["drug_category"]
          chemistry: string | null
          chronic_risks: string | null
          contraindications: string | null
          created_at: string
          dependence: string | null
          discovered_year: number | null
          duration: string | null
          effects: string[] | null
          evidence_quality: Database["public"]["Enums"]["evidence_quality"]
          featured: boolean
          half_life: string | null
          harm_reduction: string | null
          history: string | null
          id: string
          legal_status: string | null
          mechanism: string | null
          medical_status: string | null
          medical_uses: string | null
          name: string
          onset: string | null
          overdose_signs: string | null
          slug: string
          street_names: string[] | null
          summary: string | null
          testing: string | null
          tolerance: string | null
          updated_at: string
          withdrawal: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "drugs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "admin" | "user"
      drug_category:
        | "opioid"
        | "stimulant"
        | "depressant"
        | "benzodiazepine"
        | "psychedelic"
        | "dissociative"
        | "cannabinoid"
        | "antidepressant"
        | "antipsychotic"
        | "anaesthetic"
        | "inhalant"
        | "plant_fungi"
        | "research_chemical"
        | "prescription"
        | "otc"
        | "withdrawn"
        | "historical"
        | "other"
      evidence_quality:
        | "established"
        | "limited"
        | "anecdotal"
        | "disputed"
        | "unknown"
      interaction_severity:
        | "low"
        | "moderate"
        | "dangerous"
        | "deadly"
        | "unknown"
      strain_type: "indica" | "sativa" | "hybrid" | "ruderalis"
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
      app_role: ["admin", "user"],
      drug_category: [
        "opioid",
        "stimulant",
        "depressant",
        "benzodiazepine",
        "psychedelic",
        "dissociative",
        "cannabinoid",
        "antidepressant",
        "antipsychotic",
        "anaesthetic",
        "inhalant",
        "plant_fungi",
        "research_chemical",
        "prescription",
        "otc",
        "withdrawn",
        "historical",
        "other",
      ],
      evidence_quality: [
        "established",
        "limited",
        "anecdotal",
        "disputed",
        "unknown",
      ],
      interaction_severity: [
        "low",
        "moderate",
        "dangerous",
        "deadly",
        "unknown",
      ],
      strain_type: ["indica", "sativa", "hybrid", "ruderalis"],
    },
  },
} as const
