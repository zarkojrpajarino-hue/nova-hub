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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_validaciones: {
        Row: {
          approved: boolean | null
          comentario: string | null
          created_at: string | null
          id: string
          kpi_id: string
          validator_id: string
        }
        Insert: {
          approved?: boolean | null
          comentario?: string | null
          created_at?: string | null
          id?: string
          kpi_id: string
          validator_id: string
        }
        Update: {
          approved?: boolean | null
          comentario?: string | null
          created_at?: string | null
          id?: string
          kpi_id?: string
          validator_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpi_validaciones_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_validaciones_validator_id_fkey"
            columns: ["validator_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_validaciones_validator_id_fkey"
            columns: ["validator_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "kpi_validaciones_validator_id_fkey"
            columns: ["validator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kpis: {
        Row: {
          cp_points: number | null
          created_at: string | null
          descripcion: string | null
          evidence_url: string | null
          id: string
          owner_id: string
          status: Database["public"]["Enums"]["kpi_status"] | null
          titulo: string
          type: string
          validated_at: string | null
        }
        Insert: {
          cp_points?: number | null
          created_at?: string | null
          descripcion?: string | null
          evidence_url?: string | null
          id?: string
          owner_id: string
          status?: Database["public"]["Enums"]["kpi_status"] | null
          titulo: string
          type: string
          validated_at?: string | null
        }
        Update: {
          cp_points?: number | null
          created_at?: string | null
          descripcion?: string | null
          evidence_url?: string | null
          id?: string
          owner_id?: string
          status?: Database["public"]["Enums"]["kpi_status"] | null
          titulo?: string
          type?: string
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kpis_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpis_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "kpis_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          lead_id: string
          new_status: Database["public"]["Enums"]["lead_status"] | null
          notas: string | null
          old_status: Database["public"]["Enums"]["lead_status"] | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          lead_id: string
          new_status?: Database["public"]["Enums"]["lead_status"] | null
          notas?: string | null
          old_status?: Database["public"]["Enums"]["lead_status"] | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string
          new_status?: Database["public"]["Enums"]["lead_status"] | null
          notas?: string | null
          old_status?: Database["public"]["Enums"]["lead_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "lead_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "pipeline_global"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string | null
          email: string | null
          empresa: string | null
          id: string
          nombre: string
          notas: string | null
          project_id: string
          proxima_accion: string | null
          proxima_accion_fecha: string | null
          responsable_id: string | null
          status: Database["public"]["Enums"]["lead_status"] | null
          telefono: string | null
          updated_at: string | null
          valor_potencial: number | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          empresa?: string | null
          id?: string
          nombre: string
          notas?: string | null
          project_id: string
          proxima_accion?: string | null
          proxima_accion_fecha?: string | null
          responsable_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          telefono?: string | null
          updated_at?: string | null
          valor_potencial?: number | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          empresa?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          project_id?: string
          proxima_accion?: string | null
          proxima_accion_fecha?: string | null
          responsable_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          telefono?: string | null
          updated_at?: string | null
          valor_potencial?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "leads_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      master_applications: {
        Row: {
          achievements: Json | null
          created_at: string | null
          id: string
          motivation: string
          project_id: string | null
          reviewed_at: string | null
          role_name: string
          status: string
          updated_at: string | null
          user_id: string
          votes_against: number | null
          votes_for: number | null
          votes_required: number | null
          voting_deadline: string | null
        }
        Insert: {
          achievements?: Json | null
          created_at?: string | null
          id?: string
          motivation: string
          project_id?: string | null
          reviewed_at?: string | null
          role_name: string
          status?: string
          updated_at?: string | null
          user_id: string
          votes_against?: number | null
          votes_for?: number | null
          votes_required?: number | null
          voting_deadline?: string | null
        }
        Update: {
          achievements?: Json | null
          created_at?: string | null
          id?: string
          motivation?: string
          project_id?: string | null
          reviewed_at?: string | null
          role_name?: string
          status?: string
          updated_at?: string | null
          user_id?: string
          votes_against?: number | null
          votes_for?: number | null
          votes_required?: number | null
          voting_deadline?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "master_applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "master_applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "master_applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "master_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "master_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "master_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      master_challenges: {
        Row: {
          challenge_type: string
          challenger_id: string
          completed_at: string | null
          created_at: string | null
          criteria: Json | null
          deadline: string | null
          description: string | null
          id: string
          master_id: string
          result: string | null
          result_notes: string | null
          role_name: string
          status: string
        }
        Insert: {
          challenge_type: string
          challenger_id: string
          completed_at?: string | null
          created_at?: string | null
          criteria?: Json | null
          deadline?: string | null
          description?: string | null
          id?: string
          master_id: string
          result?: string | null
          result_notes?: string | null
          role_name: string
          status?: string
        }
        Update: {
          challenge_type?: string
          challenger_id?: string
          completed_at?: string | null
          created_at?: string | null
          criteria?: Json | null
          deadline?: string | null
          description?: string | null
          id?: string
          master_id?: string
          result?: string | null
          result_notes?: string | null
          role_name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_challenges_challenger_id_fkey"
            columns: ["challenger_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "master_challenges_challenger_id_fkey"
            columns: ["challenger_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "master_challenges_challenger_id_fkey"
            columns: ["challenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "master_challenges_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "team_masters"
            referencedColumns: ["id"]
          },
        ]
      }
      master_mentoring: {
        Row: {
          completed_at: string | null
          feedback: string | null
          goals: Json | null
          id: string
          master_id: string
          mentee_id: string
          role_name: string
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          feedback?: string | null
          goals?: Json | null
          id?: string
          master_id: string
          mentee_id: string
          role_name: string
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          feedback?: string | null
          goals?: Json | null
          id?: string
          master_id?: string
          mentee_id?: string
          role_name?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_mentoring_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "team_masters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "master_mentoring_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "master_mentoring_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "master_mentoring_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      master_votes: {
        Row: {
          application_id: string
          comentario: string | null
          created_at: string | null
          id: string
          vote: boolean
          voter_id: string
        }
        Insert: {
          application_id: string
          comentario?: string | null
          created_at?: string | null
          id?: string
          vote: boolean
          voter_id: string
        }
        Update: {
          application_id?: string
          comentario?: string | null
          created_at?: string | null
          id?: string
          vote?: boolean
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_votes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "master_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "master_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "master_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "master_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_kpi_base: {
        Row: {
          bps: number | null
          cps: number | null
          facturacion: number | null
          id: string
          lps: number | null
          margen: number | null
          member_id: string | null
          obvs: number | null
          obvs_exploracion: number | null
          obvs_validacion: number | null
          obvs_venta: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          bps?: number | null
          cps?: number | null
          facturacion?: number | null
          id?: string
          lps?: number | null
          margen?: number | null
          member_id?: string | null
          obvs?: number | null
          obvs_exploracion?: number | null
          obvs_validacion?: number | null
          obvs_venta?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          bps?: number | null
          cps?: number | null
          facturacion?: number | null
          id?: string
          lps?: number | null
          margen?: number | null
          member_id?: string | null
          obvs?: number | null
          obvs_exploracion?: number | null
          obvs_validacion?: number | null
          obvs_venta?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_kpi_base_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_kpi_base_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "member_kpi_base_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_kpi_base_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_kpi_base_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "member_kpi_base_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          leida: boolean | null
          link: string | null
          mensaje: string | null
          tipo: string | null
          titulo: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          leida?: boolean | null
          link?: string | null
          mensaje?: string | null
          tipo?: string | null
          titulo?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          leida?: boolean | null
          link?: string | null
          mensaje?: string | null
          tipo?: string | null
          titulo?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      objectives: {
        Row: {
          created_at: string | null
          id: string
          name: string
          period: string | null
          target_value: number
          unit: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          period?: string | null
          target_value: number
          unit?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          period?: string | null
          target_value?: number
          unit?: string | null
        }
        Relationships: []
      }
      obv_participantes: {
        Row: {
          id: string
          member_id: string
          obv_id: string
          porcentaje: number | null
        }
        Insert: {
          id?: string
          member_id: string
          obv_id: string
          porcentaje?: number | null
        }
        Update: {
          id?: string
          member_id?: string
          obv_id?: string
          porcentaje?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "obv_participantes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_participantes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "obv_participantes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_participantes_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "obvs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_participantes_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      obv_validaciones: {
        Row: {
          approved: boolean | null
          comentario: string | null
          created_at: string | null
          id: string
          obv_id: string
          validator_id: string
        }
        Insert: {
          approved?: boolean | null
          comentario?: string | null
          created_at?: string | null
          id?: string
          obv_id: string
          validator_id: string
        }
        Update: {
          approved?: boolean | null
          comentario?: string | null
          created_at?: string | null
          id?: string
          obv_id?: string
          validator_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obv_validaciones_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "obvs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_validaciones_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_validaciones_validator_id_fkey"
            columns: ["validator_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_validaciones_validator_id_fkey"
            columns: ["validator_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "obv_validaciones_validator_id_fkey"
            columns: ["validator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      obvs: {
        Row: {
          cantidad: number | null
          cobrado: boolean | null
          cobrado_parcial: number | null
          costes: number | null
          created_at: string | null
          descripcion: string | null
          es_venta: boolean | null
          estado_cobro: string | null
          evidence_url: string | null
          facturacion: number | null
          fecha: string | null
          fecha_cobro_esperada: string | null
          forma_pago: string | null
          id: string
          importe_cobrado: number | null
          iva_importe: number | null
          iva_porcentaje: number | null
          lead_id: string | null
          margen: number | null
          numero_factura: string | null
          numero_presupuesto: string | null
          owner_id: string
          precio_unitario: number | null
          producto: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["kpi_status"] | null
          tipo: Database["public"]["Enums"]["obv_type"]
          titulo: string
          total_factura: number | null
          updated_at: string | null
          validated_at: string | null
        }
        Insert: {
          cantidad?: number | null
          cobrado?: boolean | null
          cobrado_parcial?: number | null
          costes?: number | null
          created_at?: string | null
          descripcion?: string | null
          es_venta?: boolean | null
          estado_cobro?: string | null
          evidence_url?: string | null
          facturacion?: number | null
          fecha?: string | null
          fecha_cobro_esperada?: string | null
          forma_pago?: string | null
          id?: string
          importe_cobrado?: number | null
          iva_importe?: number | null
          iva_porcentaje?: number | null
          lead_id?: string | null
          margen?: number | null
          numero_factura?: string | null
          numero_presupuesto?: string | null
          owner_id: string
          precio_unitario?: number | null
          producto?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["kpi_status"] | null
          tipo: Database["public"]["Enums"]["obv_type"]
          titulo: string
          total_factura?: number | null
          updated_at?: string | null
          validated_at?: string | null
        }
        Update: {
          cantidad?: number | null
          cobrado?: boolean | null
          cobrado_parcial?: number | null
          costes?: number | null
          created_at?: string | null
          descripcion?: string | null
          es_venta?: boolean | null
          estado_cobro?: string | null
          evidence_url?: string | null
          facturacion?: number | null
          fecha?: string | null
          fecha_cobro_esperada?: string | null
          forma_pago?: string | null
          id?: string
          importe_cobrado?: number | null
          iva_importe?: number | null
          iva_porcentaje?: number | null
          lead_id?: string | null
          margen?: number | null
          numero_factura?: string | null
          numero_presupuesto?: string | null
          owner_id?: string
          precio_unitario?: number | null
          producto?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["kpi_status"] | null
          tipo?: Database["public"]["Enums"]["obv_type"]
          titulo?: string
          total_factura?: number | null
          updated_at?: string | null
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obvs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "pipeline_global"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "obvs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "obvs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_id: string
          avatar: string | null
          color: string | null
          created_at: string | null
          email: string
          especialization:
            | Database["public"]["Enums"]["specialization_role"]
            | null
          id: string
          nombre: string
          updated_at: string | null
        }
        Insert: {
          auth_id: string
          avatar?: string | null
          color?: string | null
          created_at?: string | null
          email: string
          especialization?:
            | Database["public"]["Enums"]["specialization_role"]
            | null
          id?: string
          nombre: string
          updated_at?: string | null
        }
        Update: {
          auth_id?: string
          avatar?: string | null
          color?: string | null
          created_at?: string | null
          email?: string
          especialization?:
            | Database["public"]["Enums"]["specialization_role"]
            | null
          id?: string
          nombre?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      project_members: {
        Row: {
          id: string
          is_lead: boolean | null
          joined_at: string | null
          last_performance_update: string | null
          member_id: string
          performance_score: number | null
          project_id: string
          role: Database["public"]["Enums"]["specialization_role"] | null
          role_accepted: boolean | null
          role_accepted_at: string | null
          role_responsibilities: Json | null
        }
        Insert: {
          id?: string
          is_lead?: boolean | null
          joined_at?: string | null
          last_performance_update?: string | null
          member_id: string
          performance_score?: number | null
          project_id: string
          role?: Database["public"]["Enums"]["specialization_role"] | null
          role_accepted?: boolean | null
          role_accepted_at?: string | null
          role_responsibilities?: Json | null
        }
        Update: {
          id?: string
          is_lead?: boolean | null
          joined_at?: string | null
          last_performance_update?: string | null
          member_id?: string
          performance_score?: number | null
          project_id?: string
          role?: Database["public"]["Enums"]["specialization_role"] | null
          role_accepted?: boolean | null
          role_accepted_at?: string | null
          role_responsibilities?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "project_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "project_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          descripcion: string | null
          fase: Database["public"]["Enums"]["project_phase"] | null
          icon: string | null
          id: string
          nombre: string
          onboarding_completed: boolean | null
          onboarding_data: Json | null
          tipo: Database["public"]["Enums"]["project_type"] | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          fase?: Database["public"]["Enums"]["project_phase"] | null
          icon?: string | null
          id?: string
          nombre: string
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          tipo?: Database["public"]["Enums"]["project_type"] | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          fase?: Database["public"]["Enums"]["project_phase"] | null
          icon?: string | null
          id?: string
          nombre?: string
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          tipo?: Database["public"]["Enums"]["project_type"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_history: {
        Row: {
          change_type: string
          created_at: string | null
          id: string
          new_role: string
          notes: string | null
          old_role: string | null
          previous_performance_score: number | null
          project_id: string
          rotation_request_id: string | null
          user_id: string
        }
        Insert: {
          change_type: string
          created_at?: string | null
          id?: string
          new_role: string
          notes?: string | null
          old_role?: string | null
          previous_performance_score?: number | null
          project_id: string
          rotation_request_id?: string | null
          user_id: string
        }
        Update: {
          change_type?: string
          created_at?: string | null
          id?: string
          new_role?: string
          notes?: string | null
          old_role?: string | null
          previous_performance_score?: number | null
          project_id?: string
          rotation_request_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "role_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_history_rotation_request_id_fkey"
            columns: ["rotation_request_id"]
            isOneToOne: false
            referencedRelation: "role_rotation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "role_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_rankings: {
        Row: {
          calculated_at: string | null
          id: string
          metrics: Json | null
          period_end: string
          period_start: string
          previous_position: number | null
          project_id: string | null
          ranking_position: number
          role_name: string
          score: number
          user_id: string
        }
        Insert: {
          calculated_at?: string | null
          id?: string
          metrics?: Json | null
          period_end: string
          period_start: string
          previous_position?: number | null
          project_id?: string | null
          ranking_position: number
          role_name: string
          score?: number
          user_id: string
        }
        Update: {
          calculated_at?: string | null
          id?: string
          metrics?: Json | null
          period_end?: string
          period_start?: string
          previous_position?: number | null
          project_id?: string | null
          ranking_position?: number
          role_name?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_rankings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "role_rankings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_rankings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_rankings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_rankings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "role_rankings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_rotation_requests: {
        Row: {
          admin_approved: boolean | null
          approved_by: string | null
          compatibility_analysis: Json | null
          compatibility_score: number | null
          completed_at: string | null
          created_at: string | null
          id: string
          reason: string | null
          request_type: string
          requester_accepted: boolean | null
          requester_current_role: string
          requester_id: string
          requester_project_id: string
          status: string
          target_accepted: boolean | null
          target_project_id: string | null
          target_role: string | null
          target_user_id: string | null
          updated_at: string | null
        }
        Insert: {
          admin_approved?: boolean | null
          approved_by?: string | null
          compatibility_analysis?: Json | null
          compatibility_score?: number | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          request_type?: string
          requester_accepted?: boolean | null
          requester_current_role: string
          requester_id: string
          requester_project_id: string
          status?: string
          target_accepted?: boolean | null
          target_project_id?: string | null
          target_role?: string | null
          target_user_id?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_approved?: boolean | null
          approved_by?: string | null
          compatibility_analysis?: Json | null
          compatibility_score?: number | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          request_type?: string
          requester_accepted?: boolean | null
          requester_current_role?: string
          requester_id?: string
          requester_project_id?: string
          status?: string
          target_accepted?: boolean | null
          target_project_id?: string | null
          target_role?: string | null
          target_user_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_rotation_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_rotation_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "role_rotation_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_rotation_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_rotation_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "role_rotation_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_rotation_requests_requester_project_id_fkey"
            columns: ["requester_project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "role_rotation_requests_requester_project_id_fkey"
            columns: ["requester_project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_rotation_requests_requester_project_id_fkey"
            columns: ["requester_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_rotation_requests_target_project_id_fkey"
            columns: ["target_project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "role_rotation_requests_target_project_id_fkey"
            columns: ["target_project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_rotation_requests_target_project_id_fkey"
            columns: ["target_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_rotation_requests_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_rotation_requests_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "role_rotation_requests_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          ai_generated: boolean | null
          assignee_id: string | null
          completed_at: string | null
          created_at: string | null
          descripcion: string | null
          fecha_limite: string | null
          id: string
          prioridad: number | null
          project_id: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          titulo: string
        }
        Insert: {
          ai_generated?: boolean | null
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          descripcion?: string | null
          fecha_limite?: string | null
          id?: string
          prioridad?: number | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          titulo: string
        }
        Update: {
          ai_generated?: boolean | null
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          descripcion?: string | null
          fecha_limite?: string | null
          id?: string
          prioridad?: number | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_masters: {
        Row: {
          appointed_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          level: number | null
          role_name: string
          successful_defenses: number | null
          title: string | null
          total_mentees: number | null
          user_id: string
        }
        Insert: {
          appointed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          level?: number | null
          role_name: string
          successful_defenses?: number | null
          title?: string | null
          total_mentees?: number | null
          user_id: string
        }
        Update: {
          appointed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          level?: number | null
          role_name?: string
          successful_defenses?: number | null
          title?: string | null
          total_mentees?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_masters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_masters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "team_masters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_insights: {
        Row: {
          contenido: string
          created_at: string | null
          id: string
          is_private: boolean | null
          project_id: string | null
          role_context: string | null
          tags: string[] | null
          tipo: string
          titulo: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contenido: string
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          project_id?: string | null
          role_context?: string | null
          tags?: string[] | null
          tipo: string
          titulo: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contenido?: string
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          project_id?: string | null
          role_context?: string | null
          tags?: string[] | null
          tipo?: string
          titulo?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "user_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "user_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_playbooks: {
        Row: {
          ai_model: string | null
          areas_mejora: string[] | null
          contenido: Json
          created_at: string | null
          fortalezas: string[] | null
          generated_at: string | null
          id: string
          is_active: boolean | null
          objetivos_sugeridos: Json | null
          role_name: string
          user_id: string
          version: number | null
        }
        Insert: {
          ai_model?: string | null
          areas_mejora?: string[] | null
          contenido: Json
          created_at?: string | null
          fortalezas?: string[] | null
          generated_at?: string | null
          id?: string
          is_active?: boolean | null
          objetivos_sugeridos?: Json | null
          role_name: string
          user_id: string
          version?: number | null
        }
        Update: {
          ai_model?: string | null
          areas_mejora?: string[] | null
          contenido?: Json
          created_at?: string | null
          fortalezas?: string[] | null
          generated_at?: string | null
          id?: string
          is_active?: boolean | null
          objetivos_sugeridos?: Json | null
          role_name?: string
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_playbooks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_playbooks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "user_playbooks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string | null
          id: string
          notifications: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notifications?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notifications?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      financial_metrics: {
        Row: {
          cobrado: number | null
          costes: number | null
          facturacion: number | null
          margen: number | null
          margen_percent: number | null
          month: string | null
          num_ventas: number | null
          pendiente_cobro: number | null
          project_color: string | null
          project_id: string | null
          project_name: string | null
        }
        Relationships: []
      }
      member_stats: {
        Row: {
          avatar: string | null
          bps: number | null
          color: string | null
          cps: number | null
          email: string | null
          facturacion: number | null
          id: string | null
          lps: number | null
          margen: number | null
          nombre: string | null
          obvs: number | null
          obvs_exploracion: number | null
          obvs_validacion: number | null
          obvs_venta: number | null
        }
        Relationships: []
      }
      pending_payments: {
        Row: {
          cliente: string | null
          cliente_empresa: string | null
          dias_vencido: number | null
          estado_cobro: string | null
          fecha_cobro_esperada: string | null
          fecha_venta: string | null
          id: string | null
          importe: number | null
          importe_cobrado: number | null
          numero_factura: string | null
          pendiente: number | null
          proyecto_color: string | null
          proyecto_nombre: string | null
          responsable_id: string | null
          responsable_nombre: string | null
          titulo: string | null
        }
        Relationships: []
      }
      pipeline_global: {
        Row: {
          created_at: string | null
          email: string | null
          empresa: string | null
          id: string | null
          nombre: string | null
          notas: string | null
          project_id: string | null
          proxima_accion: string | null
          proxima_accion_fecha: string | null
          proyecto_color: string | null
          proyecto_nombre: string | null
          responsable_id: string | null
          responsable_nombre: string | null
          status: Database["public"]["Enums"]["lead_status"] | null
          telefono: string | null
          updated_at: string | null
          valor_potencial: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "leads_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stats: {
        Row: {
          color: string | null
          facturacion: number | null
          fase: Database["public"]["Enums"]["project_phase"] | null
          icon: string | null
          id: string | null
          leads_ganados: number | null
          margen: number | null
          nombre: string | null
          num_members: number | null
          onboarding_completed: boolean | null
          tipo: Database["public"]["Enums"]["project_type"] | null
          total_leads: number | null
          total_obvs: number | null
        }
        Relationships: []
      }
      user_role_performance: {
        Row: {
          completed_tasks: number | null
          is_lead: boolean | null
          joined_at: string | null
          lead_conversion_rate: number | null
          leads_ganados: number | null
          performance_score: number | null
          project_id: string | null
          project_name: string | null
          role_accepted: boolean | null
          role_name: Database["public"]["Enums"]["specialization_role"] | null
          task_completion_rate: number | null
          total_facturacion: number | null
          total_leads: number | null
          total_obvs: number | null
          total_tasks: number | null
          user_id: string | null
          user_name: string | null
          validated_obvs: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_members_member_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_member_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "project_members_member_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_role_performance_score: {
        Args: { p_project_id: string; p_role: string; p_user_id: string }
        Returns: number
      }
      calculate_rotation_compatibility: {
        Args: {
          p_role1: string
          p_role2: string
          p_user1_id: string
          p_user2_id: string
        }
        Returns: Json
      }
      check_master_eligibility: {
        Args: { p_role: string; p_user_id: string }
        Returns: Json
      }
      get_profile_id: { Args: { _auth_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      seed_member_kpi_base: { Args: never; Returns: undefined }
      update_role_rankings: {
        Args: { p_period_end?: string; p_period_start?: string; p_role: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "tlt" | "member"
      kpi_status: "pending" | "validated" | "rejected"
      lead_status:
        | "frio"
        | "tibio"
        | "hot"
        | "propuesta"
        | "negociacion"
        | "cerrado_ganado"
        | "cerrado_perdido"
      obv_type: "exploracion" | "validacion" | "venta"
      project_phase:
        | "idea"
        | "problema_validado"
        | "solucion_validada"
        | "mvp"
        | "traccion"
        | "crecimiento"
      project_type: "validacion" | "operacion"
      specialization_role:
        | "sales"
        | "finance"
        | "ai_tech"
        | "marketing"
        | "operations"
        | "strategy"
      task_status: "todo" | "doing" | "done" | "blocked"
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
      app_role: ["admin", "tlt", "member"],
      kpi_status: ["pending", "validated", "rejected"],
      lead_status: [
        "frio",
        "tibio",
        "hot",
        "propuesta",
        "negociacion",
        "cerrado_ganado",
        "cerrado_perdido",
      ],
      obv_type: ["exploracion", "validacion", "venta"],
      project_phase: [
        "idea",
        "problema_validado",
        "solucion_validada",
        "mvp",
        "traccion",
        "crecimiento",
      ],
      project_type: ["validacion", "operacion"],
      specialization_role: [
        "sales",
        "finance",
        "ai_tech",
        "marketing",
        "operations",
        "strategy",
      ],
      task_status: ["todo", "doing", "done", "blocked"],
    },
  },
} as const
