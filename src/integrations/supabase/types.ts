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
      badge_definitions: {
        Row: {
          badge_category: string
          badge_description: string
          badge_icon: string
          badge_key: string
          badge_name: string
          created_at: string | null
          is_rare: boolean | null
          points_value: number | null
          requirement_description: string
        }
        Insert: {
          badge_category: string
          badge_description: string
          badge_icon: string
          badge_key: string
          badge_name: string
          created_at?: string | null
          is_rare?: boolean | null
          points_value?: number | null
          requirement_description: string
        }
        Update: {
          badge_category?: string
          badge_description?: string
          badge_icon?: string
          badge_key?: string
          badge_name?: string
          created_at?: string | null
          is_rare?: boolean | null
          points_value?: number | null
          requirement_description?: string
        }
        Relationships: []
      }
      feedback_summary: {
        Row: {
          avg_collaboration: number | null
          avg_communication: number | null
          avg_initiative: number | null
          avg_quality: number | null
          avg_technical_skills: number | null
          exploration_period_id: string
          id: string
          last_updated: string | null
          total_feedback_count: number | null
        }
        Insert: {
          avg_collaboration?: number | null
          avg_communication?: number | null
          avg_initiative?: number | null
          avg_quality?: number | null
          avg_technical_skills?: number | null
          exploration_period_id: string
          id?: string
          last_updated?: string | null
          total_feedback_count?: number | null
        }
        Update: {
          avg_collaboration?: number | null
          avg_communication?: number | null
          avg_initiative?: number | null
          avg_quality?: number | null
          avg_technical_skills?: number | null
          exploration_period_id?: string
          id?: string
          last_updated?: string | null
          total_feedback_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_summary_exploration_period_id_fkey"
            columns: ["exploration_period_id"]
            isOneToOne: true
            referencedRelation: "path_to_master_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_summary_exploration_period_id_fkey"
            columns: ["exploration_period_id"]
            isOneToOne: true
            referencedRelation: "role_exploration_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      member_badges: {
        Row: {
          badge_category: string
          badge_description: string
          badge_icon: string
          badge_key: string
          badge_name: string
          earned_at: string | null
          id: string
          member_id: string
          points_value: number | null
        }
        Insert: {
          badge_category: string
          badge_description: string
          badge_icon: string
          badge_key: string
          badge_name: string
          earned_at?: string | null
          id?: string
          member_id: string
          points_value?: number | null
        }
        Update: {
          badge_category?: string
          badge_description?: string
          badge_icon?: string
          badge_key?: string
          badge_name?: string
          earned_at?: string | null
          id?: string
          member_id?: string
          points_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "member_badges_badge_key_fkey"
            columns: ["badge_key"]
            isOneToOne: false
            referencedRelation: "badge_definitions"
            referencedColumns: ["badge_key"]
          },
          {
            foreignKeyName: "member_badges_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_feedback_overview"
            referencedColumns: ["member_id"]
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
            referencedRelation: "role_leaderboard"
            referencedColumns: ["member_id"]
          },
        ]
      }
      member_phase_progress: {
        Row: {
          created_at: string | null
          current_phase: number | null
          id: string
          member_id: string
          phase_1_completed_at: string | null
          phase_1_started_at: string | null
          phase_2_completed_at: string | null
          phase_2_started_at: string | null
          phase_3_started_at: string | null
          roles_explored_phase_1: string[] | null
          secondary_role: string | null
          secondary_role_fit_score: number | null
          star_role: string | null
          star_role_fit_score: number | null
          top_2_roles: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_phase?: number | null
          id?: string
          member_id: string
          phase_1_completed_at?: string | null
          phase_1_started_at?: string | null
          phase_2_completed_at?: string | null
          phase_2_started_at?: string | null
          phase_3_started_at?: string | null
          roles_explored_phase_1?: string[] | null
          secondary_role?: string | null
          secondary_role_fit_score?: number | null
          star_role?: string | null
          star_role_fit_score?: number | null
          top_2_roles?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_phase?: number | null
          id?: string
          member_id?: string
          phase_1_completed_at?: string | null
          phase_1_started_at?: string | null
          phase_2_completed_at?: string | null
          phase_2_started_at?: string | null
          phase_3_started_at?: string | null
          roles_explored_phase_1?: string[] | null
          secondary_role?: string | null
          secondary_role_fit_score?: number | null
          star_role?: string | null
          star_role_fit_score?: number | null
          top_2_roles?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_phase_progress_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "member_feedback_overview"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "member_phase_progress_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_phase_progress_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "role_leaderboard"
            referencedColumns: ["member_id"]
          },
        ]
      }
      members: {
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
          role: string | null
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
          role?: string | null
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
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          priority: string | null
          read: boolean | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          priority?: string | null
          read?: boolean | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          priority?: string | null
          read?: boolean | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "member_feedback_overview"
            referencedColumns: ["member_id"]
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
            referencedRelation: "role_leaderboard"
            referencedColumns: ["member_id"]
          },
        ]
      }
      obvs: {
        Row: {
          // --- Original ---
          id: string
          titulo: string
          descripcion: string | null
          owner_id: string
          project_id: string | null
          status: Database["public"]["Enums"]["obv_status"] | null
          deadline: string | null
          validated_at: string | null
          validated_by: string | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
          // --- Base ---
          fecha: string | null
          evidence_url: string | null
          tipo: Database["public"]["Enums"]["obv_type"] | null
          // --- CRM: Contacto + Pipeline ---
          nombre_contacto: string | null
          empresa: string | null
          email_contacto: string | null
          telefono_contacto: string | null
          pipeline_status: Database["public"]["Enums"]["lead_status"] | null
          valor_potencial: number | null
          notas: string | null
          proxima_accion: string | null
          proxima_accion_fecha: string | null
          responsable_id: string | null
          // --- Ventas ---
          es_venta: boolean | null
          producto: string | null
          cantidad: number | null
          precio_unitario: number | null
          facturacion: number | null
          costes: number | null
          costes_detalle: Json | null
          margen: number | null
          // --- Facturación ---
          iva_porcentaje: number | null
          iva_importe: number | null
          total_factura: number | null
          forma_pago: string | null
          numero_factura: string | null
          numero_presupuesto: string | null
          // --- Cobros ---
          cobro_estado: string | null
          cobro_fecha_esperada: string | null
          cobro_fecha_real: string | null
          cobro_metodo: string | null
          cobrado: boolean | null
          cobrado_parcial: number | null
          estado_cobro: string | null
          importe_cobrado: number | null
          cobro_dias_retraso: number | null
        }
        Insert: {
          id?: string
          titulo: string
          descripcion?: string | null
          owner_id: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["obv_status"] | null
          deadline?: string | null
          validated_at?: string | null
          validated_by?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          fecha?: string | null
          evidence_url?: string | null
          tipo?: Database["public"]["Enums"]["obv_type"] | null
          nombre_contacto?: string | null
          empresa?: string | null
          email_contacto?: string | null
          telefono_contacto?: string | null
          pipeline_status?: Database["public"]["Enums"]["lead_status"] | null
          valor_potencial?: number | null
          notas?: string | null
          proxima_accion?: string | null
          proxima_accion_fecha?: string | null
          responsable_id?: string | null
          es_venta?: boolean | null
          producto?: string | null
          cantidad?: number | null
          precio_unitario?: number | null
          facturacion?: number | null
          costes?: number | null
          costes_detalle?: Json | null
          margen?: number | null
          iva_porcentaje?: number | null
          iva_importe?: number | null
          total_factura?: number | null
          forma_pago?: string | null
          numero_factura?: string | null
          numero_presupuesto?: string | null
          cobro_estado?: string | null
          cobro_fecha_esperada?: string | null
          cobro_fecha_real?: string | null
          cobro_metodo?: string | null
          cobrado?: boolean | null
          cobrado_parcial?: number | null
          estado_cobro?: string | null
          importe_cobrado?: number | null
          cobro_dias_retraso?: number | null
        }
        Update: {
          id?: string
          titulo?: string
          descripcion?: string | null
          owner_id?: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["obv_status"] | null
          deadline?: string | null
          validated_at?: string | null
          validated_by?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          fecha?: string | null
          evidence_url?: string | null
          tipo?: Database["public"]["Enums"]["obv_type"] | null
          nombre_contacto?: string | null
          empresa?: string | null
          email_contacto?: string | null
          telefono_contacto?: string | null
          pipeline_status?: Database["public"]["Enums"]["lead_status"] | null
          valor_potencial?: number | null
          notas?: string | null
          proxima_accion?: string | null
          proxima_accion_fecha?: string | null
          responsable_id?: string | null
          es_venta?: boolean | null
          producto?: string | null
          cantidad?: number | null
          precio_unitario?: number | null
          facturacion?: number | null
          costes?: number | null
          costes_detalle?: Json | null
          margen?: number | null
          iva_porcentaje?: number | null
          iva_importe?: number | null
          total_factura?: number | null
          forma_pago?: string | null
          numero_factura?: string | null
          numero_presupuesto?: string | null
          cobro_estado?: string | null
          cobro_fecha_esperada?: string | null
          cobro_fecha_real?: string | null
          cobro_metodo?: string | null
          cobrado?: boolean | null
          cobrado_parcial?: number | null
          estado_cobro?: string | null
          importe_cobrado?: number | null
          cobro_dias_retraso?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "obvs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "member_feedback_overview"
            referencedColumns: ["member_id"]
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
            referencedRelation: "role_leaderboard"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "obvs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_role_competitions"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "obvs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "member_feedback_overview"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "obvs_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "role_leaderboard"
            referencedColumns: ["member_id"]
          },
        ]
      }
      kpis: {
        Row: {
          id: string
          owner_id: string
          project_id: string | null
          type: string
          titulo: string
          descripcion: string | null
          cp_points: number | null
          evidence_url: string | null
          evidencia_url: string | null
          status: string | null
          validated_at: string | null
          valor_objetivo: number | null
          valor_actual: number | null
          unidad: string | null
          periodo: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          owner_id: string
          project_id?: string | null
          type: string
          titulo: string
          descripcion?: string | null
          cp_points?: number | null
          evidence_url?: string | null
          evidencia_url?: string | null
          status?: string | null
          validated_at?: string | null
          valor_objetivo?: number | null
          valor_actual?: number | null
          unidad?: string | null
          periodo?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          owner_id?: string
          project_id?: string | null
          type?: string
          titulo?: string
          descripcion?: string | null
          cp_points?: number | null
          evidence_url?: string | null
          evidencia_url?: string | null
          status?: string | null
          validated_at?: string | null
          valor_objetivo?: number | null
          valor_actual?: number | null
          unidad?: string | null
          periodo?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kpis_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpis_project_id_fkey"
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
          obv_id: string
          member_id: string
          porcentaje: number | null
        }
        Insert: {
          id?: string
          obv_id: string
          member_id: string
          porcentaje?: number | null
        }
        Update: {
          id?: string
          obv_id?: string
          member_id?: string
          porcentaje?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "obv_participantes_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "obvs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_participantes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      obv_pipeline_history: {
        Row: {
          id: string
          obv_id: string
          old_status: Database["public"]["Enums"]["lead_status"] | null
          new_status: Database["public"]["Enums"]["lead_status"]
          changed_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          obv_id: string
          old_status?: Database["public"]["Enums"]["lead_status"] | null
          new_status: Database["public"]["Enums"]["lead_status"]
          changed_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          obv_id?: string
          old_status?: Database["public"]["Enums"]["lead_status"] | null
          new_status?: Database["public"]["Enums"]["lead_status"]
          changed_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obv_pipeline_history_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "obvs"
            referencedColumns: ["id"]
          },
        ]
      }
      peer_feedback: {
        Row: {
          collaboration_rating: number | null
          communication_rating: number | null
          created_at: string | null
          exploration_period_id: string
          from_member_id: string
          id: string
          improvements: string | null
          initiative_rating: number | null
          is_anonymous: boolean | null
          quality_rating: number | null
          strengths: string | null
          technical_skills_rating: number | null
          to_member_id: string
          updated_at: string | null
        }
        Insert: {
          collaboration_rating?: number | null
          communication_rating?: number | null
          created_at?: string | null
          exploration_period_id: string
          from_member_id: string
          id?: string
          improvements?: string | null
          initiative_rating?: number | null
          is_anonymous?: boolean | null
          quality_rating?: number | null
          strengths?: string | null
          technical_skills_rating?: number | null
          to_member_id: string
          updated_at?: string | null
        }
        Update: {
          collaboration_rating?: number | null
          communication_rating?: number | null
          created_at?: string | null
          exploration_period_id?: string
          from_member_id?: string
          id?: string
          improvements?: string | null
          initiative_rating?: number | null
          is_anonymous?: boolean | null
          quality_rating?: number | null
          strengths?: string | null
          technical_skills_rating?: number | null
          to_member_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "peer_feedback_exploration_period_id_fkey"
            columns: ["exploration_period_id"]
            isOneToOne: false
            referencedRelation: "path_to_master_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_feedback_exploration_period_id_fkey"
            columns: ["exploration_period_id"]
            isOneToOne: false
            referencedRelation: "role_exploration_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_feedback_from_member_id_fkey"
            columns: ["from_member_id"]
            isOneToOne: false
            referencedRelation: "member_feedback_overview"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "peer_feedback_from_member_id_fkey"
            columns: ["from_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_feedback_from_member_id_fkey"
            columns: ["from_member_id"]
            isOneToOne: false
            referencedRelation: "role_leaderboard"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "peer_feedback_to_member_id_fkey"
            columns: ["to_member_id"]
            isOneToOne: false
            referencedRelation: "member_feedback_overview"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "peer_feedback_to_member_id_fkey"
            columns: ["to_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_feedback_to_member_id_fkey"
            columns: ["to_member_id"]
            isOneToOne: false
            referencedRelation: "role_leaderboard"
            referencedColumns: ["member_id"]
          },
        ]
      }
      project_members: {
        Row: {
          assignment_end_date: string | null
          assignment_reason: string | null
          assignment_start_date: string | null
          assignment_type: string | null
          created_at: string | null
          id: string
          member_id: string
          previous_role:
            | Database["public"]["Enums"]["specialization_role"]
            | null
          project_id: string
          role: Database["public"]["Enums"]["specialization_role"]
        }
        Insert: {
          assignment_end_date?: string | null
          assignment_reason?: string | null
          assignment_start_date?: string | null
          assignment_type?: string | null
          created_at?: string | null
          id?: string
          member_id: string
          previous_role?:
            | Database["public"]["Enums"]["specialization_role"]
            | null
          project_id: string
          role: Database["public"]["Enums"]["specialization_role"]
        }
        Update: {
          assignment_end_date?: string | null
          assignment_reason?: string | null
          assignment_start_date?: string | null
          assignment_type?: string | null
          created_at?: string | null
          id?: string
          member_id?: string
          previous_role?:
            | Database["public"]["Enums"]["specialization_role"]
            | null
          project_id?: string
          role?: Database["public"]["Enums"]["specialization_role"]
        }
        Relationships: [
          {
            foreignKeyName: "project_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_feedback_overview"
            referencedColumns: ["member_id"]
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
            referencedRelation: "role_leaderboard"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_role_competitions"
            referencedColumns: ["project_id"]
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
          id: string
          nombre: string
          descripcion: string | null
          fase: Database["public"]["Enums"]["project_phase"] | null
          tipo: Database["public"]["Enums"]["project_type"] | null
          creator_id: string | null
          owner_id: string | null
          created_by: string | null
          onboarding_completed: boolean | null
          onboarding_data: Json | null
          icon: string | null
          color: string | null
          work_mode: string | null
          business_idea: string | null
          industry: string | null
          metadata: Json | null
          country: string | null
          target_markets: string[] | null
          mobility_plan: string | null
          team_size_current: number | null
          team_size_needed: number | null
          has_existing_team: boolean | null
          user_stage: string | null
          methodology: string | null
          logo_url: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          nombre: string
          descripcion?: string | null
          fase?: Database["public"]["Enums"]["project_phase"] | null
          tipo?: Database["public"]["Enums"]["project_type"] | null
          creator_id?: string | null
          owner_id?: string | null
          created_by?: string | null
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          icon?: string | null
          color?: string | null
          work_mode?: string | null
          business_idea?: string | null
          industry?: string | null
          metadata?: Json | null
          country?: string | null
          target_markets?: string[] | null
          mobility_plan?: string | null
          team_size_current?: number | null
          team_size_needed?: number | null
          has_existing_team?: boolean | null
          user_stage?: string | null
          methodology?: string | null
          logo_url?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          nombre?: string
          descripcion?: string | null
          fase?: Database["public"]["Enums"]["project_phase"] | null
          tipo?: Database["public"]["Enums"]["project_type"] | null
          creator_id?: string | null
          owner_id?: string | null
          created_by?: string | null
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          icon?: string | null
          color?: string | null
          work_mode?: string | null
          business_idea?: string | null
          industry?: string | null
          metadata?: Json | null
          country?: string | null
          target_markets?: string[] | null
          mobility_plan?: string | null
          team_size_current?: number | null
          team_size_needed?: number | null
          has_existing_team?: boolean | null
          user_stage?: string | null
          methodology?: string | null
          logo_url?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "member_feedback_overview"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "role_leaderboard"
            referencedColumns: ["member_id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          count: number
          created_at: string | null
          endpoint: string
          id: string
          user_id: string
          window_start: string
        }
        Insert: {
          count?: number
          created_at?: string | null
          endpoint: string
          id?: string
          user_id: string
          window_start?: string
        }
        Update: {
          count?: number
          created_at?: string | null
          endpoint?: string
          id?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      role_competition_results: {
        Row: {
          decided_at: string | null
          decided_by: string | null
          final_scores: Json | null
          id: string
          notes: string | null
          participants: string[]
          project_id: string
          role: Database["public"]["Enums"]["specialization_role"]
          winner_id: string | null
        }
        Insert: {
          decided_at?: string | null
          decided_by?: string | null
          final_scores?: Json | null
          id?: string
          notes?: string | null
          participants: string[]
          project_id: string
          role: Database["public"]["Enums"]["specialization_role"]
          winner_id?: string | null
        }
        Update: {
          decided_at?: string | null
          decided_by?: string | null
          final_scores?: Json | null
          id?: string
          notes?: string | null
          participants?: string[]
          project_id?: string
          role?: Database["public"]["Enums"]["specialization_role"]
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_competition_results_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "member_feedback_overview"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "role_competition_results_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_competition_results_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "role_leaderboard"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "role_competition_results_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_role_competitions"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "role_competition_results_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_competition_results_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "member_feedback_overview"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "role_competition_results_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_competition_results_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "role_leaderboard"
            referencedColumns: ["member_id"]
          },
        ]
      }
      role_exploration_periods: {
        Row: {
          collaboration_score: number | null
          created_at: string | null
          duration_days: number | null
          end_date: string
          fit_score: number | null
          id: string
          initiative_obvs: number | null
          member_id: string
          notes: string | null
          obvs_completed: number | null
          obvs_validated: number | null
          project_id: string | null
          role: Database["public"]["Enums"]["specialization_role"]
          self_rating: number | null
          start_date: string | null
          status: string | null
          tasks_completed: number | null
          tasks_on_time: number | null
          team_rating: number | null
          updated_at: string | null
          wants_to_continue: boolean | null
        }
        Insert: {
          collaboration_score?: number | null
          created_at?: string | null
          duration_days?: number | null
          end_date: string
          fit_score?: number | null
          id?: string
          initiative_obvs?: number | null
          member_id: string
          notes?: string | null
          obvs_completed?: number | null
          obvs_validated?: number | null
          project_id?: string | null
          role: Database["public"]["Enums"]["specialization_role"]
          self_rating?: number | null
          start_date?: string | null
          status?: string | null
          tasks_completed?: number | null
          tasks_on_time?: number | null
          team_rating?: number | null
          updated_at?: string | null
          wants_to_continue?: boolean | null
        }
        Update: {
          collaboration_score?: number | null
          created_at?: string | null
          duration_days?: number | null
          end_date?: string
          fit_score?: number | null
          id?: string
          initiative_obvs?: number | null
          member_id?: string
          notes?: string | null
          obvs_completed?: number | null
          obvs_validated?: number | null
          project_id?: string | null
          role?: Database["public"]["Enums"]["specialization_role"]
          self_rating?: number | null
          start_date?: string | null
          status?: string | null
          tasks_completed?: number | null
          tasks_on_time?: number | null
          team_rating?: number | null
          updated_at?: string | null
          wants_to_continue?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "role_exploration_periods_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_feedback_overview"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "role_exploration_periods_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_exploration_periods_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "role_leaderboard"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "role_exploration_periods_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_role_competitions"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "role_exploration_periods_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      role_performance_metrics: {
        Row: {
          collaboration_events: number | null
          created_at: string | null
          id: string
          initiative_score: number | null
          member_id: string
          obvs_created: number | null
          obvs_validated: number | null
          overall_score: number | null
          period_end: string
          period_start: string
          project_id: string | null
          quality_score: number | null
          role: Database["public"]["Enums"]["specialization_role"]
          tasks_assigned: number | null
          tasks_completed: number | null
          tasks_on_time: number | null
        }
        Insert: {
          collaboration_events?: number | null
          created_at?: string | null
          id?: string
          initiative_score?: number | null
          member_id: string
          obvs_created?: number | null
          obvs_validated?: number | null
          overall_score?: number | null
          period_end: string
          period_start: string
          project_id?: string | null
          quality_score?: number | null
          role: Database["public"]["Enums"]["specialization_role"]
          tasks_assigned?: number | null
          tasks_completed?: number | null
          tasks_on_time?: number | null
        }
        Update: {
          collaboration_events?: number | null
          created_at?: string | null
          id?: string
          initiative_score?: number | null
          member_id?: string
          obvs_created?: number | null
          obvs_validated?: number | null
          overall_score?: number | null
          period_end?: string
          period_start?: string
          project_id?: string | null
          quality_score?: number | null
          role?: Database["public"]["Enums"]["specialization_role"]
          tasks_assigned?: number | null
          tasks_completed?: number | null
          tasks_on_time?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "role_performance_metrics_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_feedback_overview"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "role_performance_metrics_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_performance_metrics_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "role_leaderboard"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "role_performance_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_role_competitions"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "role_performance_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      role_preferences: {
        Row: {
          after_exploration_period_id: string | null
          id: string
          marked_at: string | null
          member_id: string
          preference_level: number | null
          reasons: string[] | null
          role: Database["public"]["Enums"]["specialization_role"]
          updated_at: string | null
        }
        Insert: {
          after_exploration_period_id?: string | null
          id?: string
          marked_at?: string | null
          member_id: string
          preference_level?: number | null
          reasons?: string[] | null
          role: Database["public"]["Enums"]["specialization_role"]
          updated_at?: string | null
        }
        Update: {
          after_exploration_period_id?: string | null
          id?: string
          marked_at?: string | null
          member_id?: string
          preference_level?: number | null
          reasons?: string[] | null
          role?: Database["public"]["Enums"]["specialization_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_preferences_after_exploration_period_id_fkey"
            columns: ["after_exploration_period_id"]
            isOneToOne: false
            referencedRelation: "path_to_master_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_preferences_after_exploration_period_id_fkey"
            columns: ["after_exploration_period_id"]
            isOneToOne: false
            referencedRelation: "role_exploration_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_preferences_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_feedback_overview"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "role_preferences_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_preferences_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "role_leaderboard"
            referencedColumns: ["member_id"]
          },
        ]
      }
      role_rotation_history: {
        Row: {
          approved_by: string | null
          created_at: string | null
          from_role: Database["public"]["Enums"]["specialization_role"] | null
          id: string
          member_id: string
          performance_before: Json | null
          project_id: string
          reason: string
          rotation_type: string | null
          suggested_by: string | null
          to_role: Database["public"]["Enums"]["specialization_role"]
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          from_role?: Database["public"]["Enums"]["specialization_role"] | null
          id?: string
          member_id: string
          performance_before?: Json | null
          project_id: string
          reason: string
          rotation_type?: string | null
          suggested_by?: string | null
          to_role: Database["public"]["Enums"]["specialization_role"]
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          from_role?: Database["public"]["Enums"]["specialization_role"] | null
          id?: string
          member_id?: string
          performance_before?: Json | null
          project_id?: string
          reason?: string
          rotation_type?: string | null
          suggested_by?: string | null
          to_role?: Database["public"]["Enums"]["specialization_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_rotation_history_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "member_feedback_overview"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "role_rotation_history_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_rotation_history_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "role_leaderboard"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "role_rotation_history_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_feedback_overview"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "role_rotation_history_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_rotation_history_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "role_leaderboard"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "role_rotation_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_role_competitions"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "role_rotation_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_rotation_history_suggested_by_fkey"
            columns: ["suggested_by"]
            isOneToOne: false
            referencedRelation: "member_feedback_overview"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "role_rotation_history_suggested_by_fkey"
            columns: ["suggested_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_rotation_history_suggested_by_fkey"
            columns: ["suggested_by"]
            isOneToOne: false
            referencedRelation: "role_leaderboard"
            referencedColumns: ["member_id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          created_at: string | null
          descripcion: string | null
          due_date: string | null
          id: string
          metadata: Json | null
          priority: number | null
          project_id: string
          status: Database["public"]["Enums"]["task_status"] | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          descripcion?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: number | null
          project_id: string
          status?: Database["public"]["Enums"]["task_status"] | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          descripcion?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: number | null
          project_id?: string
          status?: Database["public"]["Enums"]["task_status"] | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "member_feedback_overview"
            referencedColumns: ["member_id"]
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
            referencedRelation: "role_leaderboard"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_role_competitions"
            referencedColumns: ["project_id"]
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
      user_insights: {
        Row: {
          contenido: string
          created_at: string | null
          exploration_period_id: string | null
          id: string
          is_public: boolean | null
          metadata: Json | null
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          contenido: string
          created_at?: string | null
          exploration_period_id?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          tipo: string
          titulo: string
          user_id: string
        }
        Update: {
          contenido?: string
          created_at?: string | null
          exploration_period_id?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_insights_exploration_period_id_fkey"
            columns: ["exploration_period_id"]
            isOneToOne: false
            referencedRelation: "path_to_master_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_insights_exploration_period_id_fkey"
            columns: ["exploration_period_id"]
            isOneToOne: false
            referencedRelation: "role_exploration_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "member_feedback_overview"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "user_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "role_leaderboard"
            referencedColumns: ["member_id"]
          },
        ]
      }
    }
    Views: {
      active_role_competitions: {
        Row: {
          competition_end_date: string | null
          participant_names: string[] | null
          participants_count: number | null
          project_id: string | null
          project_name: string | null
          role: Database["public"]["Enums"]["specialization_role"] | null
          top_fit_score: number | null
        }
        Relationships: []
      }
      member_feedback_overview: {
        Row: {
          avg_collaboration: number | null
          avg_communication: number | null
          avg_quality: number | null
          email: string | null
          member_id: string | null
          nombre: string | null
          total_feedback_given: number | null
          total_feedback_received: number | null
        }
        Relationships: []
      }
      path_to_master_active: {
        Row: {
          can_challenge_now: string | null
          current_ranking: number | null
          days_remaining: number | null
          duration_days: number | null
          end_date: string | null
          fit_score: number | null
          id: string | null
          member_id: string | null
          member_name: string | null
          obvs_validated: number | null
          role: string | null
          start_date: string | null
          tasks_completed: number | null
          tasks_on_time: number | null
        }
        Relationships: [
          {
            foreignKeyName: "role_exploration_periods_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_feedback_overview"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "role_exploration_periods_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_exploration_periods_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "role_leaderboard"
            referencedColumns: ["member_id"]
          },
        ]
      }
      role_insights: {
        Row: {
          contenido: string | null
          created_at: string | null
          fit_score: number | null
          id: string | null
          role: Database["public"]["Enums"]["specialization_role"] | null
          tipo: string | null
          titulo: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "member_feedback_overview"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "user_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "role_leaderboard"
            referencedColumns: ["member_id"]
          },
        ]
      }
      role_leaderboard: {
        Row: {
          avg_fit_score: number | null
          best_fit_score: number | null
          explorations_count: number | null
          member_id: string | null
          member_name: string | null
          ranking: number | null
          role: Database["public"]["Enums"]["specialization_role"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      auto_rotate_to_next_role: { Args: never; Returns: undefined }
      can_challenge_master: {
        Args: { p_member_id: string; p_role: string }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      start_path_to_master: {
        Args: { p_member_id: string; p_project_id?: string; p_role: string }
        Returns: string
      }
    }
    Enums: {
      obv_status: "draft" | "pending" | "validated" | "rejected"
      obv_type: "exploracion" | "validacion" | "venta"
      lead_status:
        | "frio"
        | "tibio"
        | "hot"
        | "propuesta"
        | "negociacion"
        | "cerrado_ganado"
        | "cerrado_perdido"
      project_phase:
        | "ideacion"
        | "validacion"
        | "desarrollo"
        | "lanzamiento"
        | "escalado"
        | "finalizado"
      project_type: "validacion" | "operacion"
      specialization_role:
        | "sales"
        | "finance"
        | "ai_tech"
        | "marketing"
        | "operations"
        | "strategy"
        | "customer"
      task_status:
        | "backlog"
        | "todo"
        | "in_progress"
        | "in_review"
        | "done"
        | "blocked"
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
      obv_status: ["draft", "pending", "validated", "rejected"],
      project_phase: [
        "ideacion",
        "validacion",
        "desarrollo",
        "lanzamiento",
        "escalado",
        "finalizado",
      ],
      specialization_role: [
        "sales",
        "finance",
        "ai_tech",
        "marketing",
        "operations",
        "strategy",
        "customer",
      ],
      task_status: [
        "backlog",
        "todo",
        "in_progress",
        "in_review",
        "done",
        "blocked",
      ],
    },
  },
} as const
