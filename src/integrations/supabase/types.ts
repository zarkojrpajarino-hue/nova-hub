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
            referencedRelation: "member_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          condicion: Json | null
          descripcion: string | null
          icon: string | null
          id: string
          nombre: string
        }
        Insert: {
          condicion?: Json | null
          descripcion?: string | null
          icon?: string | null
          id?: string
          nombre: string
        }
        Update: {
          condicion?: Json | null
          descripcion?: string | null
          icon?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      cobros_parciales: {
        Row: {
          created_at: string | null
          created_by: string | null
          fecha_cobro: string
          id: string
          metodo: string | null
          monto: number
          notas: string | null
          obv_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          fecha_cobro: string
          id?: string
          metodo?: string | null
          monto: number
          notas?: string | null
          obv_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          fecha_cobro?: string
          id?: string
          metodo?: string | null
          monto?: number
          notas?: string | null
          obv_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cobros_parciales_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobros_parciales_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobros_parciales_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobros_parciales_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobros_parciales_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "crm_cerrados_ganados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobros_parciales_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "obvs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobros_parciales_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "obvs_financial"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobros_parciales_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "obvs_public"
            referencedColumns: ["id"]
          },
        ]
      }
      key_results: {
        Row: {
          actual_valor: number | null
          created_at: string | null
          id: string
          meta_valor: number | null
          okr_id: string | null
          titulo: string
          unidad: string | null
        }
        Insert: {
          actual_valor?: number | null
          created_at?: string | null
          id?: string
          meta_valor?: number | null
          okr_id?: string | null
          titulo: string
          unidad?: string | null
        }
        Update: {
          actual_valor?: number | null
          created_at?: string | null
          id?: string
          meta_valor?: number | null
          okr_id?: string | null
          titulo?: string
          unidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "key_results_okr_id_fkey"
            columns: ["okr_id"]
            isOneToOne: false
            referencedRelation: "okrs"
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
          kpi_id: string | null
          validator_id: string | null
        }
        Insert: {
          approved?: boolean | null
          comentario?: string | null
          created_at?: string | null
          id?: string
          kpi_id?: string | null
          validator_id?: string | null
        }
        Update: {
          approved?: boolean | null
          comentario?: string | null
          created_at?: string | null
          id?: string
          kpi_id?: string | null
          validator_id?: string | null
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
            referencedRelation: "member_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_validaciones_validator_id_fkey"
            columns: ["validator_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_validaciones_validator_id_fkey"
            columns: ["validator_id"]
            isOneToOne: false
            referencedRelation: "members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_validaciones_validator_id_fkey"
            columns: ["validator_id"]
            isOneToOne: false
            referencedRelation: "public_members"
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
          owner_id: string | null
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
          owner_id?: string | null
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
          owner_id?: string | null
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
            referencedRelation: "member_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpis_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpis_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpis_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          lead_id: string | null
          new_status: Database["public"]["Enums"]["lead_status"] | null
          notas: string | null
          old_status: Database["public"]["Enums"]["lead_status"] | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          new_status?: Database["public"]["Enums"]["lead_status"] | null
          notas?: string | null
          old_status?: Database["public"]["Enums"]["lead_status"] | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          new_status?: Database["public"]["Enums"]["lead_status"] | null
          notas?: string | null
          old_status?: Database["public"]["Enums"]["lead_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "member_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
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
          project_id: string | null
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
          project_id?: string | null
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
          project_id?: string | null
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
            referencedRelation: "analisis_costes_por_proyecto"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "cobros_por_proyecto"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats_complete"
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
            referencedRelation: "member_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_badges: {
        Row: {
          badge_id: string | null
          id: string
          member_id: string | null
          unlocked_at: string | null
        }
        Insert: {
          badge_id?: string | null
          id?: string
          member_id?: string | null
          unlocked_at?: string | null
        }
        Update: {
          badge_id?: string | null
          id?: string
          member_id?: string | null
          unlocked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_badges_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_badges_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_badges_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_badges_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          auth_id: string | null
          avatar: string | null
          bps: number | null
          color: string | null
          cps: number | null
          created_at: string | null
          email: string
          especialization:
            | Database["public"]["Enums"]["specialization_role"]
            | null
          facturacion: number | null
          id: string
          lps: number | null
          margen: number | null
          nombre: string
          obvs: number | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          auth_id?: string | null
          avatar?: string | null
          bps?: number | null
          color?: string | null
          cps?: number | null
          created_at?: string | null
          email: string
          especialization?:
            | Database["public"]["Enums"]["specialization_role"]
            | null
          facturacion?: number | null
          id?: string
          lps?: number | null
          margen?: number | null
          nombre: string
          obvs?: number | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_id?: string | null
          avatar?: string | null
          bps?: number | null
          color?: string | null
          cps?: number | null
          created_at?: string | null
          email?: string
          especialization?:
            | Database["public"]["Enums"]["specialization_role"]
            | null
          facturacion?: number | null
          id?: string
          lps?: number | null
          margen?: number | null
          nombre?: string
          obvs?: number | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          leida?: boolean | null
          link?: string | null
          mensaje?: string | null
          tipo?: string | null
          titulo?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          leida?: boolean | null
          link?: string | null
          mensaje?: string | null
          tipo?: string | null
          titulo?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "member_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
        ]
      }
      objetivos_semanales: {
        Row: {
          ai_generated: boolean | null
          completado: boolean | null
          created_at: string | null
          id: string
          member_id: string | null
          project_id: string | null
          semana: string | null
          titulo: string
        }
        Insert: {
          ai_generated?: boolean | null
          completado?: boolean | null
          created_at?: string | null
          id?: string
          member_id?: string | null
          project_id?: string | null
          semana?: string | null
          titulo: string
        }
        Update: {
          ai_generated?: boolean | null
          completado?: boolean | null
          created_at?: string | null
          id?: string
          member_id?: string | null
          project_id?: string | null
          semana?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "objetivos_semanales_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objetivos_semanales_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objetivos_semanales_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objetivos_semanales_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objetivos_semanales_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "analisis_costes_por_proyecto"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "objetivos_semanales_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "cobros_por_proyecto"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "objetivos_semanales_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objetivos_semanales_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      obv_participantes: {
        Row: {
          id: string
          member_id: string | null
          obv_id: string | null
          porcentaje: number | null
        }
        Insert: {
          id?: string
          member_id?: string | null
          obv_id?: string | null
          porcentaje?: number | null
        }
        Update: {
          id?: string
          member_id?: string | null
          obv_id?: string | null
          porcentaje?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "obv_participantes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_participantes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_participantes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_participantes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_participantes_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "crm_cerrados_ganados"
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
            referencedRelation: "obvs_financial"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_participantes_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "obvs_public"
            referencedColumns: ["id"]
          },
        ]
      }
      obv_pipeline_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          new_status: Database["public"]["Enums"]["lead_status"]
          notas: string | null
          obv_id: string
          old_status: Database["public"]["Enums"]["lead_status"] | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status: Database["public"]["Enums"]["lead_status"]
          notas?: string | null
          obv_id: string
          old_status?: Database["public"]["Enums"]["lead_status"] | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["lead_status"]
          notas?: string | null
          obv_id?: string
          old_status?: Database["public"]["Enums"]["lead_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "obv_pipeline_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "member_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_pipeline_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_pipeline_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_pipeline_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_pipeline_history_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "crm_cerrados_ganados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_pipeline_history_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "obvs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_pipeline_history_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "obvs_financial"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_pipeline_history_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "obvs_public"
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
          obv_id: string | null
          validator_id: string | null
        }
        Insert: {
          approved?: boolean | null
          comentario?: string | null
          created_at?: string | null
          id?: string
          obv_id?: string | null
          validator_id?: string | null
        }
        Update: {
          approved?: boolean | null
          comentario?: string | null
          created_at?: string | null
          id?: string
          obv_id?: string | null
          validator_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obv_validaciones_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "crm_cerrados_ganados"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "obvs_financial"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_validaciones_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "obvs_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_validaciones_validator_id_fkey"
            columns: ["validator_id"]
            isOneToOne: false
            referencedRelation: "member_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_validaciones_validator_id_fkey"
            columns: ["validator_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_validaciones_validator_id_fkey"
            columns: ["validator_id"]
            isOneToOne: false
            referencedRelation: "members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_validaciones_validator_id_fkey"
            columns: ["validator_id"]
            isOneToOne: false
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
        ]
      }
      obvs: {
        Row: {
          cantidad: number | null
          cobrado: boolean | null
          cobrado_parcial: number | null
          cobro_estado: string | null
          cobro_fecha_esperada: string | null
          cobro_fecha_real: string | null
          cobro_metodo: string | null
          costes: number | null
          costes_detalle: Json | null
          created_at: string | null
          descripcion: string | null
          email_contacto: string | null
          empresa: string | null
          es_venta: boolean | null
          evidence_url: string | null
          facturacion: number | null
          fecha: string | null
          id: string
          lead_id: string | null
          margen: number | null
          nombre_contacto: string | null
          notas: string | null
          owner_id: string | null
          pipeline_status: Database["public"]["Enums"]["lead_status"] | null
          precio_unitario: number | null
          producto: string | null
          project_id: string | null
          proxima_accion: string | null
          proxima_accion_fecha: string | null
          responsable_id: string | null
          status: Database["public"]["Enums"]["kpi_status"] | null
          telefono_contacto: string | null
          tipo: Database["public"]["Enums"]["obv_type"]
          titulo: string
          updated_at: string | null
          validated_at: string | null
          valor_potencial: number | null
        }
        Insert: {
          cantidad?: number | null
          cobrado?: boolean | null
          cobrado_parcial?: number | null
          cobro_estado?: string | null
          cobro_fecha_esperada?: string | null
          cobro_fecha_real?: string | null
          cobro_metodo?: string | null
          costes?: number | null
          costes_detalle?: Json | null
          created_at?: string | null
          descripcion?: string | null
          email_contacto?: string | null
          empresa?: string | null
          es_venta?: boolean | null
          evidence_url?: string | null
          facturacion?: number | null
          fecha?: string | null
          id?: string
          lead_id?: string | null
          margen?: number | null
          nombre_contacto?: string | null
          notas?: string | null
          owner_id?: string | null
          pipeline_status?: Database["public"]["Enums"]["lead_status"] | null
          precio_unitario?: number | null
          producto?: string | null
          project_id?: string | null
          proxima_accion?: string | null
          proxima_accion_fecha?: string | null
          responsable_id?: string | null
          status?: Database["public"]["Enums"]["kpi_status"] | null
          telefono_contacto?: string | null
          tipo: Database["public"]["Enums"]["obv_type"]
          titulo: string
          updated_at?: string | null
          validated_at?: string | null
          valor_potencial?: number | null
        }
        Update: {
          cantidad?: number | null
          cobrado?: boolean | null
          cobrado_parcial?: number | null
          cobro_estado?: string | null
          cobro_fecha_esperada?: string | null
          cobro_fecha_real?: string | null
          cobro_metodo?: string | null
          costes?: number | null
          costes_detalle?: Json | null
          created_at?: string | null
          descripcion?: string | null
          email_contacto?: string | null
          empresa?: string | null
          es_venta?: boolean | null
          evidence_url?: string | null
          facturacion?: number | null
          fecha?: string | null
          id?: string
          lead_id?: string | null
          margen?: number | null
          nombre_contacto?: string | null
          notas?: string | null
          owner_id?: string | null
          pipeline_status?: Database["public"]["Enums"]["lead_status"] | null
          precio_unitario?: number | null
          producto?: string | null
          project_id?: string | null
          proxima_accion?: string | null
          proxima_accion_fecha?: string | null
          responsable_id?: string | null
          status?: Database["public"]["Enums"]["kpi_status"] | null
          telefono_contacto?: string | null
          tipo?: Database["public"]["Enums"]["obv_type"]
          titulo?: string
          updated_at?: string | null
          validated_at?: string | null
          valor_potencial?: number | null
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
            foreignKeyName: "obvs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "member_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "analisis_costes_por_proyecto"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "obvs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "cobros_por_proyecto"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "obvs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "member_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
        ]
      }
      okrs: {
        Row: {
          created_at: string | null
          descripcion: string | null
          id: string
          progreso: number | null
          project_id: string | null
          titulo: string
          trimestre: string | null
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          id?: string
          progreso?: number | null
          project_id?: string | null
          titulo: string
          trimestre?: string | null
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          id?: string
          progreso?: number | null
          project_id?: string | null
          titulo?: string
          trimestre?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "okrs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "analisis_costes_por_proyecto"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "okrs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "cobros_por_proyecto"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "okrs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "okrs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_context: {
        Row: {
          content: string | null
          context_type: string | null
          created_at: string | null
          created_by: string | null
          id: string
          project_id: string | null
        }
        Insert: {
          content?: string | null
          context_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          project_id?: string | null
        }
        Update: {
          content?: string | null
          context_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_context_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_context_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_context_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_context_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_context_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "analisis_costes_por_proyecto"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_context_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "cobros_por_proyecto"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_context_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_context_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          id: string
          is_lead: boolean | null
          joined_at: string | null
          member_id: string | null
          project_id: string | null
          role: Database["public"]["Enums"]["specialization_role"]
        }
        Insert: {
          id?: string
          is_lead?: boolean | null
          joined_at?: string | null
          member_id?: string | null
          project_id?: string | null
          role: Database["public"]["Enums"]["specialization_role"]
        }
        Update: {
          id?: string
          is_lead?: boolean | null
          joined_at?: string | null
          member_id?: string | null
          project_id?: string | null
          role?: Database["public"]["Enums"]["specialization_role"]
        }
        Relationships: [
          {
            foreignKeyName: "project_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "analisis_costes_por_proyecto"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "cobros_por_proyecto"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats_complete"
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
            referencedRelation: "member_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
        ]
      }
      role_meeting_insights: {
        Row: {
          created_at: string | null
          id: string
          insight: string
          meeting_id: string | null
          member_id: string | null
          project_id: string | null
          tipo: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          insight: string
          meeting_id?: string | null
          member_id?: string | null
          project_id?: string | null
          tipo?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          insight?: string
          meeting_id?: string | null
          member_id?: string | null
          project_id?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_meeting_insights_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "role_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_meeting_insights_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_meeting_insights_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_meeting_insights_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_meeting_insights_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_meeting_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "analisis_costes_por_proyecto"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "role_meeting_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "cobros_por_proyecto"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "role_meeting_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_meeting_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      role_meetings: {
        Row: {
          ai_questions: Json | null
          created_at: string | null
          fecha: string
          id: string
          role: Database["public"]["Enums"]["specialization_role"]
        }
        Insert: {
          ai_questions?: Json | null
          created_at?: string | null
          fecha: string
          id?: string
          role: Database["public"]["Enums"]["specialization_role"]
        }
        Update: {
          ai_questions?: Json | null
          created_at?: string | null
          fecha?: string
          id?: string
          role?: Database["public"]["Enums"]["specialization_role"]
        }
        Relationships: []
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
          objetivo_vinculado: string | null
          prioridad: number | null
          project_id: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          tiempo_estimado: number | null
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
          objetivo_vinculado?: string | null
          prioridad?: number | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          tiempo_estimado?: number | null
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
          objetivo_vinculado?: string | null
          prioridad?: number | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          tiempo_estimado?: number | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "member_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_objetivo_vinculado_fkey"
            columns: ["objetivo_vinculado"]
            isOneToOne: false
            referencedRelation: "objetivos_semanales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "analisis_costes_por_proyecto"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "cobros_por_proyecto"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats_complete"
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
      transacciones: {
        Row: {
          cobrado_pagado: boolean | null
          concepto: string
          created_at: string | null
          created_by: string | null
          fecha: string | null
          id: string
          monto: number
          obv_id: string | null
          project_id: string | null
          tipo: string
        }
        Insert: {
          cobrado_pagado?: boolean | null
          concepto: string
          created_at?: string | null
          created_by?: string | null
          fecha?: string | null
          id?: string
          monto: number
          obv_id?: string | null
          project_id?: string | null
          tipo: string
        }
        Update: {
          cobrado_pagado?: boolean | null
          concepto?: string
          created_at?: string | null
          created_by?: string | null
          fecha?: string | null
          id?: string
          monto?: number
          obv_id?: string | null
          project_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "transacciones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "crm_cerrados_ganados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "obvs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "obvs_financial"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "obvs_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "analisis_costes_por_proyecto"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "transacciones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "cobros_por_proyecto"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "transacciones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      analisis_costes_global: {
        Row: {
          num_ventas: number | null
          total_comisiones: number | null
          total_costes: number | null
          total_herramientas: number | null
          total_logistica: number | null
          total_marketing: number | null
          total_materiales: number | null
          total_otros: number | null
          total_subcontratacion: number | null
        }
        Relationships: []
      }
      analisis_costes_por_proyecto: {
        Row: {
          facturacion: number | null
          margen: number | null
          num_ventas: number | null
          project_id: string | null
          proyecto: string | null
          total_costes: number | null
          total_materiales: number | null
          total_subcontratacion: number | null
        }
        Relationships: []
      }
      cobros_por_proyecto: {
        Row: {
          cobrado: number | null
          facturado: number | null
          num_ventas: number | null
          project_id: string | null
          proyecto: string | null
        }
        Relationships: []
      }
      crm_cerrados_ganados: {
        Row: {
          created_at: string | null
          email_contacto: string | null
          empresa: string | null
          facturacion: number | null
          id: string | null
          nombre_contacto: string | null
          owner_color: string | null
          owner_id: string | null
          owner_nombre: string | null
          pipeline_status: Database["public"]["Enums"]["lead_status"] | null
          project_id: string | null
          proyecto_color: string | null
          proyecto_icon: string | null
          proyecto_nombre: string | null
          telefono_contacto: string | null
          titulo: string | null
          valor_potencial: number | null
        }
        Relationships: [
          {
            foreignKeyName: "obvs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "member_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "analisis_costes_por_proyecto"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "obvs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "cobros_por_proyecto"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "obvs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats_complete"
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
      dashboard_cobros: {
        Row: {
          num_pendientes: number | null
          total_cobrado: number | null
          total_facturado: number | null
          total_ventas: number | null
        }
        Relationships: []
      }
      forecast_ingresos: {
        Row: {
          proyeccion_hot: number | null
          proyeccion_negociacion: number | null
          proyeccion_propuesta: number | null
          total_proyectado_30_dias: number | null
        }
        Relationships: []
      }
      member_stats_complete: {
        Row: {
          avatar: string | null
          color: string | null
          email: string | null
          especialization:
            | Database["public"]["Enums"]["specialization_role"]
            | null
          facturacion_total: number | null
          id: string | null
          margen_total: number | null
          nombre: string | null
          num_proyectos: number | null
          obvs_validated: number | null
        }
        Relationships: []
      }
      members_public: {
        Row: {
          auth_id: string | null
          avatar: string | null
          color: string | null
          created_at: string | null
          email: string | null
          especialization:
            | Database["public"]["Enums"]["specialization_role"]
            | null
          id: string | null
          nombre: string | null
          updated_at: string | null
        }
        Insert: {
          auth_id?: string | null
          avatar?: string | null
          color?: string | null
          created_at?: string | null
          email?: never
          especialization?:
            | Database["public"]["Enums"]["specialization_role"]
            | null
          id?: string | null
          nombre?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_id?: string | null
          avatar?: string | null
          color?: string | null
          created_at?: string | null
          email?: never
          especialization?:
            | Database["public"]["Enums"]["specialization_role"]
            | null
          id?: string | null
          nombre?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mis_validaciones_pendientes: {
        Row: {
          created_at: string | null
          descripcion: string | null
          evidence_url: string | null
          item_id: string | null
          owner_color: string | null
          owner_id: string | null
          owner_nombre: string | null
          proyecto_nombre: string | null
          tipo: string | null
          titulo: string | null
        }
        Relationships: []
      }
      obvs_financial: {
        Row: {
          cantidad: number | null
          cobrado: boolean | null
          cobrado_parcial: number | null
          costes: number | null
          created_at: string | null
          descripcion: string | null
          es_venta: boolean | null
          evidence_url: string | null
          facturacion: number | null
          fecha: string | null
          id: string | null
          lead_id: string | null
          margen: number | null
          owner_id: string | null
          precio_unitario: number | null
          producto: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["kpi_status"] | null
          tipo: Database["public"]["Enums"]["obv_type"] | null
          titulo: string | null
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
          evidence_url?: string | null
          facturacion?: number | null
          fecha?: string | null
          id?: string | null
          lead_id?: string | null
          margen?: number | null
          owner_id?: string | null
          precio_unitario?: number | null
          producto?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["kpi_status"] | null
          tipo?: Database["public"]["Enums"]["obv_type"] | null
          titulo?: string | null
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
          evidence_url?: string | null
          facturacion?: number | null
          fecha?: string | null
          id?: string | null
          lead_id?: string | null
          margen?: number | null
          owner_id?: string | null
          precio_unitario?: number | null
          producto?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["kpi_status"] | null
          tipo?: Database["public"]["Enums"]["obv_type"] | null
          titulo?: string | null
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
            foreignKeyName: "obvs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "member_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "analisis_costes_por_proyecto"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "obvs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "cobros_por_proyecto"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "obvs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats_complete"
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
      obvs_public: {
        Row: {
          cantidad: number | null
          cobrado: boolean | null
          created_at: string | null
          descripcion: string | null
          es_venta: boolean | null
          evidence_url: string | null
          fecha: string | null
          id: string | null
          lead_id: string | null
          nota_datos_financieros: string | null
          owner_id: string | null
          producto: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["kpi_status"] | null
          tipo: Database["public"]["Enums"]["obv_type"] | null
          titulo: string | null
          updated_at: string | null
          validated_at: string | null
        }
        Insert: {
          cantidad?: number | null
          cobrado?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          es_venta?: boolean | null
          evidence_url?: string | null
          fecha?: string | null
          id?: string | null
          lead_id?: string | null
          nota_datos_financieros?: never
          owner_id?: string | null
          producto?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["kpi_status"] | null
          tipo?: Database["public"]["Enums"]["obv_type"] | null
          titulo?: string | null
          updated_at?: string | null
          validated_at?: string | null
        }
        Update: {
          cantidad?: number | null
          cobrado?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          es_venta?: boolean | null
          evidence_url?: string | null
          fecha?: string | null
          id?: string | null
          lead_id?: string | null
          nota_datos_financieros?: never
          owner_id?: string | null
          producto?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["kpi_status"] | null
          tipo?: Database["public"]["Enums"]["obv_type"] | null
          titulo?: string | null
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
            foreignKeyName: "obvs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "member_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "analisis_costes_por_proyecto"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "obvs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "cobros_por_proyecto"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "obvs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats_complete"
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
      project_roles_view: {
        Row: {
          is_lead: boolean | null
          member_id: string | null
          member_nombre: string | null
          project_id: string | null
          project_nombre: string | null
          role: Database["public"]["Enums"]["specialization_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "project_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_stats_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "public_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "analisis_costes_por_proyecto"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "cobros_por_proyecto"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats_complete"
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
      project_stats_complete: {
        Row: {
          color: string | null
          facturacion_total: number | null
          fase: Database["public"]["Enums"]["project_phase"] | null
          icon: string | null
          id: string | null
          leads_ganados: number | null
          margen_total: number | null
          nombre: string | null
          num_miembros: number | null
          total_obvs: number | null
        }
        Relationships: []
      }
      public_members: {
        Row: {
          auth_id: string | null
          avatar: string | null
          color: string | null
          created_at: string | null
          email: string | null
          id: string | null
          nombre: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          auth_id?: string | null
          avatar?: string | null
          color?: string | null
          created_at?: string | null
          email?: never
          id?: string | null
          nombre?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_id?: string | null
          avatar?: string | null
          color?: string | null
          created_at?: string | null
          email?: never
          id?: string | null
          nombre?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      top_clientes_valor: {
        Row: {
          email_contacto: string | null
          empresa: string | null
          num_compras: number | null
          telefono_contacto: string | null
          ultima_compra: string | null
          valor_total_facturado: number | null
          valor_total_margen: number | null
        }
        Relationships: []
      }
      top_productos_rentables: {
        Row: {
          facturacion_total: number | null
          margen_porcentaje: number | null
          margen_total: number | null
          num_ventas: number | null
          producto: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calcular_costes_desde_detalle: { Args: { costes: Json }; Returns: number }
      crear_costes_detalle: {
        Args: {
          p_comisiones?: number
          p_herramientas?: number
          p_logistica?: number
          p_marketing?: number
          p_materiales?: number
          p_otros?: number
          p_subcontratacion?: number
        }
        Returns: Json
      }
      get_member_id: { Args: { _auth_id: string }; Returns: string }
      get_pipeline_stats: {
        Args: { p_project_id?: string }
        Returns: {
          conversion_rate: number
          count: number
          status: Database["public"]["Enums"]["lead_status"]
          valor_total: number
        }[]
      }
    }
    Enums: {
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
