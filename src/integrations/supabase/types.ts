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
      advisor_chats: {
        Row: {
          created_at: string
          id: string
          messages: Json
          project_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          project_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          project_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advisor_chats_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_chats_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_chats_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "advisor_chats_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_chats_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_analysis_cache: {
        Row: {
          additional_context: string | null
          analysis_level: number
          data_sources: Json
          expires_at: string
          generated_at: string
          id: string
          last_data_updated_at: string
          model: string
          output: Json
          project_id: string
          tokens_used: number | null
        }
        Insert: {
          additional_context?: string | null
          analysis_level: number
          data_sources?: Json
          expires_at: string
          generated_at?: string
          id?: string
          last_data_updated_at: string
          model?: string
          output: Json
          project_id: string
          tokens_used?: number | null
        }
        Update: {
          additional_context?: string | null
          analysis_level?: number
          data_sources?: Json
          expires_at?: string
          generated_at?: string
          id?: string
          last_data_updated_at?: string
          model?: string
          output?: Json
          project_id?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_analysis_cache_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_cache_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_cache_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ai_analysis_cache_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_cache_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_generation_logs: {
        Row: {
          claims_made: Json | null
          coverage_percentage: number | null
          created_at: string | null
          evidence_mode: string
          evidence_status: string
          function_name: string
          generated_content: Json | null
          generation_duration_ms: number | null
          id: string
          planned_sources: Json | null
          project_id: string
          prompt_used: string | null
          search_duration_ms: number | null
          sources_found: Json | null
          total_tokens_used: number | null
          user_id: string
        }
        Insert: {
          claims_made?: Json | null
          coverage_percentage?: number | null
          created_at?: string | null
          evidence_mode: string
          evidence_status: string
          function_name: string
          generated_content?: Json | null
          generation_duration_ms?: number | null
          id?: string
          planned_sources?: Json | null
          project_id: string
          prompt_used?: string | null
          search_duration_ms?: number | null
          sources_found?: Json | null
          total_tokens_used?: number | null
          user_id: string
        }
        Update: {
          claims_made?: Json | null
          coverage_percentage?: number | null
          created_at?: string | null
          evidence_mode?: string
          evidence_status?: string
          function_name?: string
          generated_content?: Json | null
          generation_duration_ms?: number | null
          id?: string
          planned_sources?: Json | null
          project_id?: string
          prompt_used?: string | null
          search_duration_ms?: number | null
          sources_found?: Json | null
          total_tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generation_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generation_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ai_generation_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generation_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_recommendations: {
        Row: {
          action_items: Json | null
          category: string
          confidence: number
          created_at: string
          data_sources: Json | null
          description: string
          dismissed: boolean | null
          dismissed_at: string | null
          id: string
          implemented: boolean | null
          implemented_at: string | null
          priority: string
          project_id: string
          reasoning: string
          title: string
        }
        Insert: {
          action_items?: Json | null
          category: string
          confidence: number
          created_at?: string
          data_sources?: Json | null
          description: string
          dismissed?: boolean | null
          dismissed_at?: string | null
          id?: string
          implemented?: boolean | null
          implemented_at?: string | null
          priority: string
          project_id: string
          reasoning: string
          title: string
        }
        Update: {
          action_items?: Json | null
          category?: string
          confidence?: number
          created_at?: string
          data_sources?: Json | null
          description?: string
          dismissed?: boolean | null
          dismissed_at?: string | null
          id?: string
          implemented?: boolean | null
          implemented_at?: string | null
          priority?: string
          project_id?: string
          reasoning?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ai_recommendations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_source_registry: {
        Row: {
          api_endpoint: string | null
          country: string | null
          created_at: string | null
          domain: string | null
          id: string
          language: string | null
          last_updated: string | null
          metadata: Json | null
          parent_organization: string | null
          rate_limit_per_minute: number | null
          reliability_rationale: string | null
          reliability_score: number | null
          requires_api_key: boolean | null
          source_name: string
          source_type: string
          source_url: string
          update_frequency: string | null
        }
        Insert: {
          api_endpoint?: string | null
          country?: string | null
          created_at?: string | null
          domain?: string | null
          id?: string
          language?: string | null
          last_updated?: string | null
          metadata?: Json | null
          parent_organization?: string | null
          rate_limit_per_minute?: number | null
          reliability_rationale?: string | null
          reliability_score?: number | null
          requires_api_key?: boolean | null
          source_name: string
          source_type: string
          source_url: string
          update_frequency?: string | null
        }
        Update: {
          api_endpoint?: string | null
          country?: string | null
          created_at?: string | null
          domain?: string | null
          id?: string
          language?: string | null
          last_updated?: string | null
          metadata?: Json | null
          parent_organization?: string | null
          rate_limit_per_minute?: number | null
          reliability_rationale?: string | null
          reliability_score?: number | null
          requires_api_key?: boolean | null
          source_name?: string
          source_type?: string
          source_url?: string
          update_frequency?: string | null
        }
        Relationships: []
      }
      benchmarks: {
        Row: {
          confidence_score: number
          id: string
          industry: string
          metric_name: string
          model_type: string
          n_proyectos_validos: number | null
          p25: number | null
          p50: number | null
          p75: number | null
          region_cluster: string
          source_notes: string | null
          source_type: string
          updated_at: string
        }
        Insert: {
          confidence_score?: number
          id?: string
          industry: string
          metric_name: string
          model_type: string
          n_proyectos_validos?: number | null
          p25?: number | null
          p50?: number | null
          p75?: number | null
          region_cluster: string
          source_notes?: string | null
          source_type: string
          updated_at?: string
        }
        Update: {
          confidence_score?: number
          id?: string
          industry?: string
          metric_name?: string
          model_type?: string
          n_proyectos_validos?: number | null
          p25?: number | null
          p50?: number | null
          p75?: number | null
          region_cluster?: string
          source_notes?: string | null
          source_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      beta_testers: {
        Row: {
          company: string | null
          created_at: string
          email: string
          feedback: string | null
          feedback_submitted_at: string | null
          id: string
          invited_at: string
          name: string
          project_id: string
          rating: number | null
          role: string | null
          signed_up_at: string | null
          testimonial_approved: boolean | null
          testimonial_approved_at: string | null
          testimonial_draft: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          feedback?: string | null
          feedback_submitted_at?: string | null
          id?: string
          invited_at?: string
          name: string
          project_id: string
          rating?: number | null
          role?: string | null
          signed_up_at?: string | null
          testimonial_approved?: boolean | null
          testimonial_approved_at?: string | null
          testimonial_draft?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          feedback?: string | null
          feedback_submitted_at?: string | null
          id?: string
          invited_at?: string
          name?: string
          project_id?: string
          rating?: number | null
          role?: string | null
          signed_up_at?: string | null
          testimonial_approved?: boolean | null
          testimonial_approved_at?: string | null
          testimonial_draft?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beta_testers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beta_testers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beta_testers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "beta_testers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beta_testers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobros_parciales_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "cobros_parciales_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "pending_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobros_parciales_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "pipeline_global"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobros_parciales_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "v_obvs_canonical"
            referencedColumns: ["id"]
          },
        ]
      }
      cofounder_alignment: {
        Row: {
          alignment_score: number | null
          analyzed_at: string | null
          commitment_alignment: number | null
          discussion_topics: Json | null
          founder_a_session_id: string
          founder_b_session_id: string
          id: string
          misalignments: Json | null
          project_id: string
          recommendations: Json | null
          strategy_alignment: number | null
          values_alignment: number | null
          vision_alignment: number | null
        }
        Insert: {
          alignment_score?: number | null
          analyzed_at?: string | null
          commitment_alignment?: number | null
          discussion_topics?: Json | null
          founder_a_session_id: string
          founder_b_session_id: string
          id?: string
          misalignments?: Json | null
          project_id: string
          recommendations?: Json | null
          strategy_alignment?: number | null
          values_alignment?: number | null
          vision_alignment?: number | null
        }
        Update: {
          alignment_score?: number | null
          analyzed_at?: string | null
          commitment_alignment?: number | null
          discussion_topics?: Json | null
          founder_a_session_id?: string
          founder_b_session_id?: string
          id?: string
          misalignments?: Json | null
          project_id?: string
          recommendations?: Json | null
          strategy_alignment?: number | null
          values_alignment?: number | null
          vision_alignment?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cofounder_alignment_founder_a_session_id_fkey"
            columns: ["founder_a_session_id"]
            isOneToOne: false
            referencedRelation: "onboarding_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cofounder_alignment_founder_b_session_id_fkey"
            columns: ["founder_b_session_id"]
            isOneToOne: false
            referencedRelation: "onboarding_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cofounder_alignment_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cofounder_alignment_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cofounder_alignment_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "cofounder_alignment_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cofounder_alignment_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      competitive_analysis: {
        Row: {
          benchmarks: Json | null
          competitors: Json | null
          generated_at: string | null
          id: string
          market_gaps: Json | null
          project_id: string
          recommended_strategy: Json | null
          swot: Json | null
          updated_at: string | null
        }
        Insert: {
          benchmarks?: Json | null
          competitors?: Json | null
          generated_at?: string | null
          id?: string
          market_gaps?: Json | null
          project_id: string
          recommended_strategy?: Json | null
          swot?: Json | null
          updated_at?: string | null
        }
        Update: {
          benchmarks?: Json | null
          competitors?: Json | null
          generated_at?: string | null
          id?: string
          market_gaps?: Json | null
          project_id?: string
          recommended_strategy?: Json | null
          swot?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitive_analysis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitive_analysis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitive_analysis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "competitive_analysis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitive_analysis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_snapshots: {
        Row: {
          alert_sent: boolean | null
          captured_at: string
          changes_detected: Json | null
          competitor_id: string
          created_at: string
          features: Json | null
          id: string
          pricing: Json | null
          project_id: string
          raw_html: string | null
          screenshot_url: string | null
        }
        Insert: {
          alert_sent?: boolean | null
          captured_at?: string
          changes_detected?: Json | null
          competitor_id: string
          created_at?: string
          features?: Json | null
          id?: string
          pricing?: Json | null
          project_id: string
          raw_html?: string | null
          screenshot_url?: string | null
        }
        Update: {
          alert_sent?: boolean | null
          captured_at?: string
          changes_detected?: Json | null
          competitor_id?: string
          created_at?: string
          features?: Json | null
          id?: string
          pricing?: Json | null
          project_id?: string
          raw_html?: string | null
          screenshot_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "competitor_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      content_calendars: {
        Row: {
          created_at: string
          id: string
          ideas: Json
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ideas?: Json
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ideas?: Json
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_calendars_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendars_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendars_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "content_calendars_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendars_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      content_pieces: {
        Row: {
          ai_draft: string | null
          calendar_id: string | null
          created_at: string
          final_content: string | null
          id: string
          keywords: Json | null
          outline: Json | null
          project_id: string
          published_date: string | null
          published_url: string | null
          relevance_score: number | null
          scheduled_date: string | null
          search_volume: number | null
          seo_difficulty: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          ai_draft?: string | null
          calendar_id?: string | null
          created_at?: string
          final_content?: string | null
          id?: string
          keywords?: Json | null
          outline?: Json | null
          project_id: string
          published_date?: string | null
          published_url?: string | null
          relevance_score?: number | null
          scheduled_date?: string | null
          search_volume?: number | null
          seo_difficulty?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          ai_draft?: string | null
          calendar_id?: string | null
          created_at?: string
          final_content?: string | null
          id?: string
          keywords?: Json | null
          outline?: Json | null
          project_id?: string
          published_date?: string | null
          published_url?: string | null
          relevance_score?: number | null
          scheduled_date?: string | null
          search_volume?: number | null
          seo_difficulty?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_pieces_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "content_calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_pieces_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_pieces_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_pieces_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "content_pieces_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_pieces_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      country_data: {
        Row: {
          business_culture: Json
          continent: string
          cost_of_living_index: number
          country_code: string
          country_name: string
          created_at: string
          ecommerce_penetration: number
          gdp_per_capita_usd: number
          internet_penetration: number
          languages: string[]
          last_updated: string
          median_age: number
          regulatory_ease_score: number
          startup_density_rank: number
        }
        Insert: {
          business_culture?: Json
          continent: string
          cost_of_living_index: number
          country_code: string
          country_name: string
          created_at?: string
          ecommerce_penetration: number
          gdp_per_capita_usd: number
          internet_penetration: number
          languages?: string[]
          last_updated?: string
          median_age: number
          regulatory_ease_score: number
          startup_density_rank: number
        }
        Update: {
          business_culture?: Json
          continent?: string
          cost_of_living_index?: number
          country_code?: string
          country_name?: string
          created_at?: string
          ecommerce_penetration?: number
          gdp_per_capita_usd?: number
          internet_penetration?: number
          languages?: string[]
          last_updated?: string
          median_age?: number
          regulatory_ease_score?: number
          startup_density_rank?: number
        }
        Relationships: []
      }
      cycle_objective_progress: {
        Row: {
          cycle_id: string
          id: string
          notes: string | null
          objective_id: string
          recorded_at: string
          value: number
        }
        Insert: {
          cycle_id: string
          id?: string
          notes?: string | null
          objective_id: string
          recorded_at?: string
          value: number
        }
        Update: {
          cycle_id?: string
          id?: string
          notes?: string | null
          objective_id?: string
          recorded_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "cycle_objective_progress_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "strategic_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_events: {
        Row: {
          decided_at: string
          decided_by: string | null
          decision_category: string
          description: string | null
          id: string
          metadata: Json
          origin: string
          outcome_status: string | null
          project_id: string
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
        }
        Insert: {
          decided_at?: string
          decided_by?: string | null
          decision_category: string
          description?: string | null
          id?: string
          metadata?: Json
          origin: string
          outcome_status?: string | null
          project_id: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
        }
        Update: {
          decided_at?: string
          decided_by?: string | null
          decision_category?: string
          description?: string | null
          id?: string
          metadata?: Json
          origin?: string
          outcome_status?: string | null
          project_id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "decision_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_retrospectives: {
        Row: {
          created_at: string
          decision_event_id: string | null
          decision_made_at: string
          decision_summary: string
          filled_at: string | null
          id: string
          outcome_text: string | null
          project_id: string
          retrospective_due_at: string
          was_correct: boolean | null
        }
        Insert: {
          created_at?: string
          decision_event_id?: string | null
          decision_made_at?: string
          decision_summary: string
          filled_at?: string | null
          id?: string
          outcome_text?: string | null
          project_id: string
          retrospective_due_at: string
          was_correct?: boolean | null
        }
        Update: {
          created_at?: string
          decision_event_id?: string | null
          decision_made_at?: string
          decision_summary?: string
          filled_at?: string | null
          id?: string
          outcome_text?: string | null
          project_id?: string
          retrospective_due_at?: string
          was_correct?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "decision_retrospectives_decision_event_id_fkey"
            columns: ["decision_event_id"]
            isOneToOne: false
            referencedRelation: "decision_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_retrospectives_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_retrospectives_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_retrospectives_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "decision_retrospectives_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_retrospectives_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      engine_versions: {
        Row: {
          deployed_at: string
          id: string
          is_active: boolean
          motor: string
          notes: string | null
        }
        Insert: {
          deployed_at?: string
          id: string
          is_active?: boolean
          motor: string
          notes?: string | null
        }
        Update: {
          deployed_at?: string
          id?: string
          is_active?: boolean
          motor?: string
          notes?: string | null
        }
        Relationships: []
      }
      expansion_analysis_cache: {
        Row: {
          expires_at: string
          generated_at: string
          id: string
          input_snapshot: Json
          markets: Json
          output: Json
          project_id: string
        }
        Insert: {
          expires_at?: string
          generated_at?: string
          id?: string
          input_snapshot?: Json
          markets?: Json
          output?: Json
          project_id: string
        }
        Update: {
          expires_at?: string
          generated_at?: string
          id?: string
          input_snapshot?: Json
          markets?: Json
          output?: Json
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expansion_analysis_cache_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expansion_analysis_cache_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expansion_analysis_cache_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "expansion_analysis_cache_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expansion_analysis_cache_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      expansion_events: {
        Row: {
          city: string | null
          cost_eur_approx: number | null
          country: string
          created_at: string
          event_date: string | null
          event_name: string
          id: string
          reference_hubs: Json | null
          sector: string[]
          url: string | null
          why_relevant_template: string | null
        }
        Insert: {
          city?: string | null
          cost_eur_approx?: number | null
          country: string
          created_at?: string
          event_date?: string | null
          event_name: string
          id?: string
          reference_hubs?: Json | null
          sector?: string[]
          url?: string | null
          why_relevant_template?: string | null
        }
        Update: {
          city?: string | null
          cost_eur_approx?: number | null
          country?: string
          created_at?: string
          event_date?: string | null
          event_name?: string
          id?: string
          reference_hubs?: Json | null
          sector?: string[]
          url?: string | null
          why_relevant_template?: string | null
        }
        Relationships: []
      }
      financial_projections: {
        Row: {
          burn_rate: number | null
          cash_balance: number | null
          churned_customers: number | null
          cogs: number | null
          created_at: string
          gross_margin: number | null
          gross_profit: number | null
          id: string
          infrastructure: number | null
          integration_source: string | null
          marketing_spend: number | null
          month: number
          mrr: number | null
          net_profit: number | null
          new_customers: number | null
          other_costs: number | null
          payroll: number | null
          project_id: string
          revenue: number | null
          runway_months: number | null
          source_confidence: number | null
          source_timestamp: string | null
          updated_at: string
          year: number
        }
        Insert: {
          burn_rate?: number | null
          cash_balance?: number | null
          churned_customers?: number | null
          cogs?: number | null
          created_at?: string
          gross_margin?: number | null
          gross_profit?: number | null
          id?: string
          infrastructure?: number | null
          integration_source?: string | null
          marketing_spend?: number | null
          month: number
          mrr?: number | null
          net_profit?: number | null
          new_customers?: number | null
          other_costs?: number | null
          payroll?: number | null
          project_id: string
          revenue?: number | null
          runway_months?: number | null
          source_confidence?: number | null
          source_timestamp?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          burn_rate?: number | null
          cash_balance?: number | null
          churned_customers?: number | null
          cogs?: number | null
          created_at?: string
          gross_margin?: number | null
          gross_profit?: number | null
          id?: string
          infrastructure?: number | null
          integration_source?: string | null
          marketing_spend?: number | null
          month?: number
          mrr?: number | null
          net_profit?: number | null
          new_customers?: number | null
          other_costs?: number | null
          payroll?: number | null
          project_id?: string
          revenue?: number | null
          runway_months?: number | null
          source_confidence?: number | null
          source_timestamp?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_projections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_projections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_projections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "financial_projections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_projections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_tool_cache: {
        Row: {
          data_sources: Json
          expires_at: string
          generated_at: string
          id: string
          model: string
          output: Json
          project_id: string
          tokens_used: number | null
          tool_type: Database["public"]["Enums"]["founder_tool_type"]
        }
        Insert: {
          data_sources?: Json
          expires_at: string
          generated_at?: string
          id?: string
          model?: string
          output: Json
          project_id: string
          tokens_used?: number | null
          tool_type: Database["public"]["Enums"]["founder_tool_type"]
        }
        Update: {
          data_sources?: Json
          expires_at?: string
          generated_at?: string
          id?: string
          model?: string
          output?: Json
          project_id?: string
          tokens_used?: number | null
          tool_type?: Database["public"]["Enums"]["founder_tool_type"]
        }
        Relationships: [
          {
            foreignKeyName: "founder_tool_cache_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "founder_tool_cache_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "founder_tool_cache_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "founder_tool_cache_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "founder_tool_cache_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_tool_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          ignored_at: string | null
          project_id: string
          task_id: string
          tool_cache_id: string | null
          tool_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          ignored_at?: string | null
          project_id: string
          task_id: string
          tool_cache_id?: string | null
          tool_type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          ignored_at?: string | null
          project_id?: string
          task_id?: string
          tool_cache_id?: string | null
          tool_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "founder_tool_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "founder_tool_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "founder_tool_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "founder_tool_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "founder_tool_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "founder_tool_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_business_options: {
        Row: {
          constraints: Json | null
          founder_profile: Json | null
          generated_at: string | null
          id: string
          options: Json | null
          project_id: string
          selected_option_index: number | null
        }
        Insert: {
          constraints?: Json | null
          founder_profile?: Json | null
          generated_at?: string | null
          id?: string
          options?: Json | null
          project_id: string
          selected_option_index?: number | null
        }
        Update: {
          constraints?: Json | null
          founder_profile?: Json | null
          generated_at?: string | null
          id?: string
          options?: Json | null
          project_id?: string
          selected_option_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_business_options_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_business_options_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_business_options_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "generated_business_options_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_business_options_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      geo_intelligence_cache: {
        Row: {
          accelerators: Json | null
          cost_of_living: number | null
          created_at: string | null
          expires_at: string | null
          grants: Json | null
          id: string
          last_updated: string | null
          local_competitors: Json | null
          local_events: Json | null
          local_investors: Json | null
          location_key: string
          market_size: Json | null
          operational_costs: Json | null
          regulations: Json | null
        }
        Insert: {
          accelerators?: Json | null
          cost_of_living?: number | null
          created_at?: string | null
          expires_at?: string | null
          grants?: Json | null
          id?: string
          last_updated?: string | null
          local_competitors?: Json | null
          local_events?: Json | null
          local_investors?: Json | null
          location_key: string
          market_size?: Json | null
          operational_costs?: Json | null
          regulations?: Json | null
        }
        Update: {
          accelerators?: Json | null
          cost_of_living?: number | null
          created_at?: string | null
          expires_at?: string | null
          grants?: Json | null
          id?: string
          last_updated?: string | null
          local_competitors?: Json | null
          local_events?: Json | null
          local_investors?: Json | null
          location_key?: string
          market_size?: Json | null
          operational_costs?: Json | null
          regulations?: Json | null
        }
        Relationships: []
      }
      growth_playbooks: {
        Row: {
          action_plan: Json | null
          diagnosis: Json | null
          generated_at: string | null
          id: string
          key_metrics: string[] | null
          project_id: string
          scenarios: Json | null
          updated_at: string | null
        }
        Insert: {
          action_plan?: Json | null
          diagnosis?: Json | null
          generated_at?: string | null
          id?: string
          key_metrics?: string[] | null
          project_id: string
          scenarios?: Json | null
          updated_at?: string | null
        }
        Update: {
          action_plan?: Json | null
          diagnosis?: Json | null
          generated_at?: string | null
          id?: string
          key_metrics?: string[] | null
          project_id?: string
          scenarios?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "growth_playbooks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_playbooks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_playbooks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "growth_playbooks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_playbooks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_connections: {
        Row: {
          connected_at: string | null
          connected_by: string
          created_at: string
          disconnected_at: string | null
          error_message: string | null
          id: string
          last_sync_at: string | null
          metadata: Json
          project_id: string
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          connected_at?: string | null
          connected_by: string
          created_at?: string
          disconnected_at?: string | null
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          metadata?: Json
          project_id: string
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          connected_at?: string | null
          connected_by?: string
          created_at?: string
          disconnected_at?: string | null
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          metadata?: Json
          project_id?: string
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_connections_connected_by_fkey"
            columns: ["connected_by"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_connections_connected_by_fkey"
            columns: ["connected_by"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "integration_connections_connected_by_fkey"
            columns: ["connected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_connections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_connections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_connections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "integration_connections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_connections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_credentials: {
        Row: {
          connection_id: string
          created_at: string
          credential_enc: string
          credential_key: string
          expires_at: string | null
          id: string
          project_id: string
          provider: string
          updated_at: string
        }
        Insert: {
          connection_id: string
          created_at?: string
          credential_enc: string
          credential_key: string
          expires_at?: string | null
          id?: string
          project_id: string
          provider: string
          updated_at?: string
        }
        Update: {
          connection_id?: string
          created_at?: string
          credential_enc?: string
          credential_key?: string
          expires_at?: string | null
          id?: string
          project_id?: string
          provider?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_credentials_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "integration_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_credentials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_credentials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_credentials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "integration_credentials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_credentials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_entities: {
        Row: {
          confidence: number
          connection_id: string
          contract_version: string
          entity_type: string
          external_id: string
          id: string
          last_seen_at: string | null
          occurred_at: string
          payload: Json
          project_id: string
          provider: string
          source_timestamp: string
          status: string
          sync_run_id: string
          synced_at: string
        }
        Insert: {
          confidence: number
          connection_id: string
          contract_version?: string
          entity_type: string
          external_id: string
          id?: string
          last_seen_at?: string | null
          occurred_at: string
          payload: Json
          project_id: string
          provider: string
          source_timestamp: string
          status?: string
          sync_run_id: string
          synced_at?: string
        }
        Update: {
          confidence?: number
          connection_id?: string
          contract_version?: string
          entity_type?: string
          external_id?: string
          id?: string
          last_seen_at?: string | null
          occurred_at?: string
          payload?: Json
          project_id?: string
          provider?: string
          source_timestamp?: string
          status?: string
          sync_run_id?: string
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_entities_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "integration_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_entities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_entities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_entities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "integration_entities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_entities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_entities_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "integration_sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_insights: {
        Row: {
          agent_type: string
          confidence: number
          created_at: string
          entity_ids: string[]
          evidence_type: string | null
          expires_at: string | null
          generated_at: string
          id: string
          include_in_context: boolean
          insight_type: string
          low_evidence_quality: boolean
          payload: Json
          project_id: string
          source_timestamp: string
          sources_discarded: Json
          sources_used: Json
          status: string
          sync_run_id: string
        }
        Insert: {
          agent_type: string
          confidence: number
          created_at?: string
          entity_ids?: string[]
          evidence_type?: string | null
          expires_at?: string | null
          generated_at?: string
          id?: string
          include_in_context?: boolean
          insight_type: string
          low_evidence_quality?: boolean
          payload: Json
          project_id: string
          source_timestamp: string
          sources_discarded?: Json
          sources_used?: Json
          status?: string
          sync_run_id: string
        }
        Update: {
          agent_type?: string
          confidence?: number
          created_at?: string
          entity_ids?: string[]
          evidence_type?: string | null
          expires_at?: string | null
          generated_at?: string
          id?: string
          include_in_context?: boolean
          insight_type?: string
          low_evidence_quality?: boolean
          payload?: Json
          project_id?: string
          source_timestamp?: string
          sources_discarded?: Json
          sources_used?: Json
          status?: string
          sync_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "integration_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_insights_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "integration_sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_sync_runs: {
        Row: {
          adapter_version: string
          completed_at: string | null
          connection_id: string
          created_at: string
          entities_processed: number
          entities_rejected: number
          entities_skipped: number
          entities_written: number
          error_message: string | null
          id: string
          is_partial: boolean
          pagination_cursor: string | null
          post_engine_snapshot: Json | null
          pre_engine_snapshot: Json | null
          project_id: string
          provider: string
          retry_count: number
          started_at: string
          status: string
          trigger_type: string
        }
        Insert: {
          adapter_version?: string
          completed_at?: string | null
          connection_id: string
          created_at?: string
          entities_processed?: number
          entities_rejected?: number
          entities_skipped?: number
          entities_written?: number
          error_message?: string | null
          id?: string
          is_partial?: boolean
          pagination_cursor?: string | null
          post_engine_snapshot?: Json | null
          pre_engine_snapshot?: Json | null
          project_id: string
          provider: string
          retry_count?: number
          started_at?: string
          status?: string
          trigger_type?: string
        }
        Update: {
          adapter_version?: string
          completed_at?: string | null
          connection_id?: string
          created_at?: string
          entities_processed?: number
          entities_rejected?: number
          entities_skipped?: number
          entities_written?: number
          error_message?: string | null
          id?: string
          is_partial?: boolean
          pagination_cursor?: string | null
          post_engine_snapshot?: Json | null
          pre_engine_snapshot?: Json | null
          project_id?: string
          provider?: string
          retry_count?: number
          started_at?: string
          status?: string
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_sync_runs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "integration_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_sync_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_sync_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_sync_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "integration_sync_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_sync_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_write_log: {
        Row: {
          agent_type: string
          confidence: number
          created_at: string
          entity_ids: string[]
          id: string
          insight_id: string | null
          logical_period: string | null
          operation: string
          payload_hash: string
          project_id: string
          reason: string | null
          source_timestamp: string
          status: string
          sync_run_id: string
          target: string
          wrote_at: string | null
        }
        Insert: {
          agent_type: string
          confidence: number
          created_at?: string
          entity_ids?: string[]
          id?: string
          insight_id?: string | null
          logical_period?: string | null
          operation: string
          payload_hash: string
          project_id: string
          reason?: string | null
          source_timestamp: string
          status?: string
          sync_run_id: string
          target: string
          wrote_at?: string | null
        }
        Update: {
          agent_type?: string
          confidence?: number
          created_at?: string
          entity_ids?: string[]
          id?: string
          insight_id?: string | null
          logical_period?: string | null
          operation?: string
          payload_hash?: string
          project_id?: string
          reason?: string | null
          source_timestamp?: string
          status?: string
          sync_run_id?: string
          target?: string
          wrote_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_write_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_write_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_write_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "integration_write_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_write_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_write_log_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "integration_sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      key_metrics: {
        Row: {
          arr: number | null
          burn_rate: number | null
          cac: number | null
          cash_balance: number | null
          churn_rate: number | null
          churned_customers: number | null
          created_at: string
          date: string
          dau: number | null
          id: string
          integration_source: string | null
          ltv: number | null
          ltv_cac_ratio: number | null
          mau: number | null
          mrr: number | null
          mrr_growth_rate: number | null
          new_customers: number | null
          project_id: string
          runway_months: number | null
          source_confidence: number | null
          source_timestamp: string | null
          total_customers: number | null
        }
        Insert: {
          arr?: number | null
          burn_rate?: number | null
          cac?: number | null
          cash_balance?: number | null
          churn_rate?: number | null
          churned_customers?: number | null
          created_at?: string
          date: string
          dau?: number | null
          id?: string
          integration_source?: string | null
          ltv?: number | null
          ltv_cac_ratio?: number | null
          mau?: number | null
          mrr?: number | null
          mrr_growth_rate?: number | null
          new_customers?: number | null
          project_id: string
          runway_months?: number | null
          source_confidence?: number | null
          source_timestamp?: string | null
          total_customers?: number | null
        }
        Update: {
          arr?: number | null
          burn_rate?: number | null
          cac?: number | null
          cash_balance?: number | null
          churn_rate?: number | null
          churned_customers?: number | null
          created_at?: string
          date?: string
          dau?: number | null
          id?: string
          integration_source?: string | null
          ltv?: number | null
          ltv_cac_ratio?: number | null
          mau?: number | null
          mrr?: number | null
          mrr_growth_rate?: number | null
          new_customers?: number | null
          project_id?: string
          runway_months?: number | null
          source_confidence?: number | null
          source_timestamp?: string | null
          total_customers?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "key_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "key_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      launch_checklists: {
        Row: {
          created_at: string
          estimated_launch_date: string | null
          id: string
          items: Json
          progress: number | null
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estimated_launch_date?: string | null
          id?: string
          items?: Json
          progress?: number | null
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estimated_launch_date?: string | null
          id?: string
          items?: Json
          progress?: number | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "launch_checklists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "launch_checklists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "launch_checklists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "launch_checklists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "launch_checklists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          completed_resources: string[] | null
          existing_skills: string[] | null
          generated_at: string | null
          id: string
          project_id: string
          resources: Json | null
          skill_gaps: string[] | null
          updated_at: string | null
        }
        Insert: {
          completed_resources?: string[] | null
          existing_skills?: string[] | null
          generated_at?: string | null
          id?: string
          project_id: string
          resources?: Json | null
          skill_gaps?: string[] | null
          updated_at?: string | null
        }
        Update: {
          completed_resources?: string[] | null
          existing_skills?: string[] | null
          generated_at?: string | null
          id?: string
          project_id?: string
          resources?: Json | null
          skill_gaps?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_paths_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_paths_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_paths_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "learning_paths_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_paths_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      market_intelligence: {
        Row: {
          created_at: string
          id: string
          last_updated: string
          market_size: Json | null
          project_id: string
          social_mentions: Json | null
          trends_data: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated?: string
          market_size?: Json | null
          project_id: string
          social_mentions?: Json | null
          trends_data?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          last_updated?: string
          market_size?: Json | null
          project_id?: string
          social_mentions?: Json | null
          trends_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "market_intelligence_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_intelligence_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_intelligence_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "market_intelligence_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_intelligence_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "master_applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
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
      meeting_ai_questions: {
        Row: {
          asked_at: string
          created_at: string
          id: string
          meeting_id: string
          question: string | null
        }
        Insert: {
          asked_at?: string
          created_at?: string
          id?: string
          meeting_id: string
          question?: string | null
        }
        Update: {
          asked_at?: string
          created_at?: string
          id?: string
          meeting_id?: string
          question?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_ai_questions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_ai_recommendations: {
        Row: {
          created_at: string
          id: string
          meeting_id: string
          recommendation: string | null
          shown_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_id: string
          recommendation?: string | null
          shown_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_id?: string
          recommendation?: string | null
          shown_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_ai_recommendations_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_decisions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          meeting_id: string
          title: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          meeting_id: string
          title?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          meeting_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_decisions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_insights: {
        Row: {
          applied: boolean
          applied_entity_id: string | null
          content: Json
          created_at: string
          id: string
          insight_type: string
          meeting_id: string
          review_status: string
          updated_at: string
        }
        Insert: {
          applied?: boolean
          applied_entity_id?: string | null
          content: Json
          created_at?: string
          id?: string
          insight_type: string
          meeting_id: string
          review_status?: string
          updated_at?: string
        }
        Update: {
          applied?: boolean
          applied_entity_id?: string | null
          content?: Json
          created_at?: string
          id?: string
          insight_type?: string
          meeting_id?: string
          review_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_insights_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_participants: {
        Row: {
          attended: boolean
          can_receive_tasks: boolean
          created_at: string
          id: string
          meeting_id: string
          member_id: string
        }
        Insert: {
          attended?: boolean
          can_receive_tasks?: boolean
          created_at?: string
          id?: string
          meeting_id: string
          member_id: string
        }
        Update: {
          attended?: boolean
          can_receive_tasks?: boolean
          created_at?: string
          id?: string
          meeting_id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          ai_confidence_score: number | null
          alignment_data: Json | null
          audio_url: string | null
          created_at: string
          created_by: string
          description: string | null
          duration_actual_min: number | null
          ended_at: string | null
          estimated_duration_min: number | null
          id: string
          insights: Json | null
          key_points: string[] | null
          meeting_type: string
          objectives: string | null
          participant_count: number | null
          project_id: string
          started_at: string | null
          status: string
          strategic_context: Json | null
          summary: string | null
          title: string
          transcript: string | null
          transcript_segments: Json | null
          transcription_confidence: number | null
          updated_at: string
        }
        Insert: {
          ai_confidence_score?: number | null
          alignment_data?: Json | null
          audio_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          duration_actual_min?: number | null
          ended_at?: string | null
          estimated_duration_min?: number | null
          id?: string
          insights?: Json | null
          key_points?: string[] | null
          meeting_type: string
          objectives?: string | null
          participant_count?: number | null
          project_id: string
          started_at?: string | null
          status?: string
          strategic_context?: Json | null
          summary?: string | null
          title: string
          transcript?: string | null
          transcript_segments?: Json | null
          transcription_confidence?: number | null
          updated_at?: string
        }
        Update: {
          ai_confidence_score?: number | null
          alignment_data?: Json | null
          audio_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          duration_actual_min?: number | null
          ended_at?: string | null
          estimated_duration_min?: number | null
          id?: string
          insights?: Json | null
          key_points?: string[] | null
          meeting_type?: string
          objectives?: string | null
          participant_count?: number | null
          project_id?: string
          started_at?: string | null
          status?: string
          strategic_context?: Json | null
          summary?: string | null
          title?: string
          transcript?: string | null
          transcript_segments?: Json | null
          transcription_confidence?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      metric_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          created_at: string
          current_value: number
          id: string
          message: string
          metric: string
          operator: string
          project_id: string
          severity: string
          threshold: number
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          created_at?: string
          current_value: number
          id?: string
          message: string
          metric: string
          operator: string
          project_id: string
          severity: string
          threshold: number
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          created_at?: string
          current_value?: number
          id?: string
          message?: string
          metric?: string
          operator?: string
          project_id?: string
          severity?: string
          threshold?: number
        }
        Relationships: [
          {
            foreignKeyName: "metric_alerts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_alerts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_alerts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "metric_alerts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_alerts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_health_snapshots: {
        Row: {
          captured_at: string
          data: Json
          environment: string
          id: string
          panel: string
        }
        Insert: {
          captured_at?: string
          data: Json
          environment?: string
          id?: string
          panel: string
        }
        Update: {
          captured_at?: string
          data?: Json
          environment?: string
          id?: string
          panel?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          archived: boolean | null
          created_at: string | null
          emailed_at: string | null
          id: string
          link: string | null
          message: string | null
          metadata: Json | null
          priority: string | null
          project_id: string | null
          read: boolean | null
          snoozed_until: string | null
          title: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          archived?: boolean | null
          created_at?: string | null
          emailed_at?: string | null
          id?: string
          link?: string | null
          message?: string | null
          metadata?: Json | null
          priority?: string | null
          project_id?: string | null
          read?: boolean | null
          snoozed_until?: string | null
          title?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          archived?: boolean | null
          created_at?: string | null
          emailed_at?: string | null
          id?: string
          link?: string | null
          message?: string | null
          metadata?: Json | null
          priority?: string | null
          project_id?: string | null
          read?: boolean | null
          snoozed_until?: string | null
          title?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "obv_participantes_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "pipeline_global"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_participantes_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "v_obvs_canonical"
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
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_pipeline_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "obv_pipeline_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "pending_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_pipeline_history_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "pipeline_global"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_pipeline_history_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "v_obvs_canonical"
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
            foreignKeyName: "obv_validaciones_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "pipeline_global"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obv_validaciones_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "v_obvs_canonical"
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
          cobro_dias_retraso: number | null
          cobro_estado: string | null
          cobro_fecha_esperada: string | null
          cobro_fecha_real: string | null
          cobro_metodo: string | null
          costes: number | null
          costes_detalle: Json | null
          created_at: string | null
          descripcion: string | null
          dispute_flag: boolean
          email_contacto: string | null
          empresa: string | null
          es_venta: boolean | null
          estado_cobro: string | null
          evidence_type: string | null
          evidence_url: string | null
          external_id: string | null
          external_provider: string | null
          facturacion: number | null
          fecha: string | null
          forma_pago: string | null
          id: string
          importe_cobrado: number | null
          iva_importe: number | null
          iva_porcentaje: number | null
          margen: number | null
          nombre_contacto: string | null
          notas: string | null
          numero_factura: string | null
          numero_presupuesto: string | null
          obv_outcome: string
          owner_id: string
          pipeline_status: Database["public"]["Enums"]["lead_status"] | null
          precio_unitario: number | null
          producto: string | null
          project_id: string | null
          proxima_accion: string | null
          proxima_accion_fecha: string | null
          responsable_id: string | null
          source: string
          status: Database["public"]["Enums"]["kpi_status"] | null
          telefono_contacto: string | null
          tipo: Database["public"]["Enums"]["obv_type"]
          titulo: string
          total_factura: number | null
          type_auto_update_reason: string | null
          type_auto_updated: boolean
          type_declared_original: Database["public"]["Enums"]["obv_type"] | null
          updated_at: string | null
          validated_at: string | null
          valor_potencial: number | null
        }
        Insert: {
          cantidad?: number | null
          cobrado?: boolean | null
          cobrado_parcial?: number | null
          cobro_dias_retraso?: number | null
          cobro_estado?: string | null
          cobro_fecha_esperada?: string | null
          cobro_fecha_real?: string | null
          cobro_metodo?: string | null
          costes?: number | null
          costes_detalle?: Json | null
          created_at?: string | null
          descripcion?: string | null
          dispute_flag?: boolean
          email_contacto?: string | null
          empresa?: string | null
          es_venta?: boolean | null
          estado_cobro?: string | null
          evidence_type?: string | null
          evidence_url?: string | null
          external_id?: string | null
          external_provider?: string | null
          facturacion?: number | null
          fecha?: string | null
          forma_pago?: string | null
          id?: string
          importe_cobrado?: number | null
          iva_importe?: number | null
          iva_porcentaje?: number | null
          margen?: number | null
          nombre_contacto?: string | null
          notas?: string | null
          numero_factura?: string | null
          numero_presupuesto?: string | null
          obv_outcome: string
          owner_id: string
          pipeline_status?: Database["public"]["Enums"]["lead_status"] | null
          precio_unitario?: number | null
          producto?: string | null
          project_id?: string | null
          proxima_accion?: string | null
          proxima_accion_fecha?: string | null
          responsable_id?: string | null
          source?: string
          status?: Database["public"]["Enums"]["kpi_status"] | null
          telefono_contacto?: string | null
          tipo: Database["public"]["Enums"]["obv_type"]
          titulo: string
          total_factura?: number | null
          type_auto_update_reason?: string | null
          type_auto_updated?: boolean
          type_declared_original?:
            | Database["public"]["Enums"]["obv_type"]
            | null
          updated_at?: string | null
          validated_at?: string | null
          valor_potencial?: number | null
        }
        Update: {
          cantidad?: number | null
          cobrado?: boolean | null
          cobrado_parcial?: number | null
          cobro_dias_retraso?: number | null
          cobro_estado?: string | null
          cobro_fecha_esperada?: string | null
          cobro_fecha_real?: string | null
          cobro_metodo?: string | null
          costes?: number | null
          costes_detalle?: Json | null
          created_at?: string | null
          descripcion?: string | null
          dispute_flag?: boolean
          email_contacto?: string | null
          empresa?: string | null
          es_venta?: boolean | null
          estado_cobro?: string | null
          evidence_type?: string | null
          evidence_url?: string | null
          external_id?: string | null
          external_provider?: string | null
          facturacion?: number | null
          fecha?: string | null
          forma_pago?: string | null
          id?: string
          importe_cobrado?: number | null
          iva_importe?: number | null
          iva_porcentaje?: number | null
          margen?: number | null
          nombre_contacto?: string | null
          notas?: string | null
          numero_factura?: string | null
          numero_presupuesto?: string | null
          obv_outcome?: string
          owner_id?: string
          pipeline_status?: Database["public"]["Enums"]["lead_status"] | null
          precio_unitario?: number | null
          producto?: string | null
          project_id?: string | null
          proxima_accion?: string | null
          proxima_accion_fecha?: string | null
          responsable_id?: string | null
          source?: string
          status?: Database["public"]["Enums"]["kpi_status"] | null
          telefono_contacto?: string | null
          tipo?: Database["public"]["Enums"]["obv_type"]
          titulo?: string
          total_factura?: number | null
          type_auto_update_reason?: string | null
          type_auto_updated?: boolean
          type_declared_original?:
            | Database["public"]["Enums"]["obv_type"]
            | null
          updated_at?: string | null
          validated_at?: string | null
          valor_potencial?: number | null
        }
        Relationships: [
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
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
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
          {
            foreignKeyName: "obvs_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "obvs_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      okrs: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          key_results: Json
          objective: string
          owner: string | null
          project_id: string
          quarter: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          key_results?: Json
          objective: string
          owner?: string | null
          project_id: string
          quarter: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          key_results?: Json
          objective?: string
          owner?: string | null
          project_id?: string
          quarter?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "okrs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "okrs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "okrs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "okrs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
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
      onboarding_sessions: {
        Row: {
          alignment_score: number | null
          answers: Json | null
          cofounder_session_id: string | null
          completed_at: string | null
          completion_percentage: number | null
          founder_background: string | null
          founder_skills: string[] | null
          has_cofounder: boolean | null
          id: string
          linkedin_data: Json | null
          location_city: string | null
          location_coordinates: Json | null
          location_country: string | null
          onboarding_type: string
          phase: string
          project_id: string
          started_at: string | null
          target_market: string[] | null
          updated_at: string | null
        }
        Insert: {
          alignment_score?: number | null
          answers?: Json | null
          cofounder_session_id?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          founder_background?: string | null
          founder_skills?: string[] | null
          has_cofounder?: boolean | null
          id?: string
          linkedin_data?: Json | null
          location_city?: string | null
          location_coordinates?: Json | null
          location_country?: string | null
          onboarding_type: string
          phase?: string
          project_id: string
          started_at?: string | null
          target_market?: string[] | null
          updated_at?: string | null
        }
        Update: {
          alignment_score?: number | null
          answers?: Json | null
          cofounder_session_id?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          founder_background?: string | null
          founder_skills?: string[] | null
          has_cofounder?: boolean | null
          id?: string
          linkedin_data?: Json | null
          location_city?: string | null
          location_coordinates?: Json | null
          location_country?: string | null
          onboarding_type?: string
          phase?: string
          project_id?: string
          started_at?: string | null
          target_market?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_sessions_cofounder_session_id_fkey"
            columns: ["cofounder_session_id"]
            isOneToOne: false
            referencedRelation: "onboarding_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "onboarding_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      optimus_feedback_events: {
        Row: {
          category: string | null
          confidence: string | null
          created_at: string
          id: string
          note: string | null
          optimus_mode: string | null
          primary_action: string
          primary_block: string | null
          project_id: string
          user_id: string
          vote: string
        }
        Insert: {
          category?: string | null
          confidence?: string | null
          created_at?: string
          id?: string
          note?: string | null
          optimus_mode?: string | null
          primary_action: string
          primary_block?: string | null
          project_id: string
          user_id: string
          vote: string
        }
        Update: {
          category?: string | null
          confidence?: string | null
          created_at?: string
          id?: string
          note?: string | null
          optimus_mode?: string | null
          primary_action?: string
          primary_block?: string | null
          project_id?: string
          user_id?: string
          vote?: string
        }
        Relationships: [
          {
            foreignKeyName: "optimus_feedback_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optimus_feedback_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optimus_feedback_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "optimus_feedback_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optimus_feedback_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      optimus_profile: {
        Row: {
          feedback_summary: Json
          preferred_depth: string
          project_id: string
          response_style: string
          risk_tolerance: string
          total_feedbacks: number
          updated_at: string
          user_id: string
        }
        Insert: {
          feedback_summary?: Json
          preferred_depth?: string
          project_id: string
          response_style?: string
          risk_tolerance?: string
          total_feedbacks?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          feedback_summary?: Json
          preferred_depth?: string
          project_id?: string
          response_style?: string
          risk_tolerance?: string
          total_feedbacks?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "optimus_profile_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optimus_profile_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optimus_profile_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "optimus_profile_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optimus_profile_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_validations: {
        Row: {
          created_at: string | null
          deadline: string
          id: string
          is_late: boolean | null
          item_type: string
          kpi_id: string | null
          obv_id: string | null
          owner_id: string
          validated_at: string | null
          validator_id: string
        }
        Insert: {
          created_at?: string | null
          deadline: string
          id?: string
          is_late?: boolean | null
          item_type: string
          kpi_id?: string | null
          obv_id?: string | null
          owner_id: string
          validated_at?: string | null
          validator_id: string
        }
        Update: {
          created_at?: string | null
          deadline?: string
          id?: string
          is_late?: boolean | null
          item_type?: string
          kpi_id?: string | null
          obv_id?: string | null
          owner_id?: string
          validated_at?: string | null
          validator_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_validations_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_validations_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "obvs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_validations_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_validations_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "pipeline_global"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_validations_obv_id_fkey"
            columns: ["obv_id"]
            isOneToOne: false
            referencedRelation: "v_obvs_canonical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_validations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_validations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "pending_validations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_validations_validator_id_fkey"
            columns: ["validator_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_validations_validator_id_fkey"
            columns: ["validator_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "pending_validations_validator_id_fkey"
            columns: ["validator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      process_artifacts: {
        Row: {
          checklist_items_count: number
          created_at: string
          function_type: string
          id: string
          last_used_at: string | null
          link_or_doc_id: string | null
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          checklist_items_count?: number
          created_at?: string
          function_type: string
          id?: string
          last_used_at?: string | null
          link_or_doc_id?: string | null
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          checklist_items_count?: number
          created_at?: string
          function_type?: string
          id?: string
          last_used_at?: string | null
          link_or_doc_id?: string | null
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_artifacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_artifacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_artifacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "process_artifacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_artifacts_project_id_fkey"
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
      project_acquisition_channel: {
        Row: {
          channel_type: string
          created_at: string
          documented_playbook: boolean
          estimated_cac: number | null
          id: string
          is_primary: boolean
          last_validated_at: string | null
          notes: string | null
          project_id: string
          updated_at: string
        }
        Insert: {
          channel_type: string
          created_at?: string
          documented_playbook?: boolean
          estimated_cac?: number | null
          id?: string
          is_primary?: boolean
          last_validated_at?: string | null
          notes?: string | null
          project_id: string
          updated_at?: string
        }
        Update: {
          channel_type?: string
          created_at?: string
          documented_playbook?: boolean
          estimated_cac?: number | null
          id?: string
          is_primary?: boolean
          last_validated_at?: string | null
          notes?: string | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_acquisition_channel_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_acquisition_channel_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_acquisition_channel_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_acquisition_channel_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_acquisition_channel_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_challenges: {
        Row: {
          activated_at: string | null
          activated_by: string | null
          challenge_type: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string | null
          dismissed_at: string | null
          dismissed_by: string | null
          ends_at: string | null
          id: string
          outcome: string | null
          outcome_notes: string | null
          project_id: string
          source_engine: string
          source_function: string | null
          source_role_candidates: Json | null
          starts_at: string | null
          status: string
          suggested_at: string
          title: string
        }
        Insert: {
          activated_at?: string | null
          activated_by?: string | null
          challenge_type: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          dismissed_at?: string | null
          dismissed_by?: string | null
          ends_at?: string | null
          id?: string
          outcome?: string | null
          outcome_notes?: string | null
          project_id: string
          source_engine: string
          source_function?: string | null
          source_role_candidates?: Json | null
          starts_at?: string | null
          status?: string
          suggested_at?: string
          title: string
        }
        Update: {
          activated_at?: string | null
          activated_by?: string | null
          challenge_type?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          dismissed_at?: string | null
          dismissed_by?: string | null
          ends_at?: string | null
          id?: string
          outcome?: string | null
          outcome_notes?: string | null
          project_id?: string
          source_engine?: string
          source_function?: string | null
          source_role_candidates?: Json | null
          starts_at?: string | null
          status?: string
          suggested_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_challenges_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_challenges_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_challenges_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_challenges_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_challenges_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_documents: {
        Row: {
          authority_score: number | null
          content_language: string | null
          content_tsvector: unknown
          created_at: string | null
          file_size_bytes: number | null
          file_type: string
          id: string
          metadata: Json | null
          name: string
          pages_count: number | null
          project_id: string
          raw_content: string | null
          sections: Json | null
          source_type: string | null
          structured_data: Json | null
          updated_at: string | null
          upload_date: string | null
          user_id: string
        }
        Insert: {
          authority_score?: number | null
          content_language?: string | null
          content_tsvector?: unknown
          created_at?: string | null
          file_size_bytes?: number | null
          file_type: string
          id?: string
          metadata?: Json | null
          name: string
          pages_count?: number | null
          project_id: string
          raw_content?: string | null
          sections?: Json | null
          source_type?: string | null
          structured_data?: Json | null
          updated_at?: string | null
          upload_date?: string | null
          user_id: string
        }
        Update: {
          authority_score?: number | null
          content_language?: string | null
          content_tsvector?: unknown
          created_at?: string | null
          file_size_bytes?: number | null
          file_type?: string
          id?: string
          metadata?: Json | null
          name?: string
          pages_count?: number | null
          project_id?: string
          raw_content?: string | null
          sections?: Json | null
          source_type?: string | null
          structured_data?: Json | null
          updated_at?: string | null
          upload_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_economic_profile: {
        Row: {
          avg_ticket: number | null
          cac_estimate: number | null
          cash_on_hand: number | null
          cash_on_hand_updated_at: string | null
          confidence_level: string
          confidence_score: number
          engine_version: string
          field_sources: Json
          gross_margin_target: number | null
          incoherences: Json
          inputs_sources: Json | null
          integration_source: string | null
          last_updated_at: string
          model_type: string
          pricing_model: string
          project_id: string
          revenue_type: string
          sales_cycle_days: number | null
          source_confidence: number | null
          source_timestamp: string | null
          top_client_revenue_percent: number | null
        }
        Insert: {
          avg_ticket?: number | null
          cac_estimate?: number | null
          cash_on_hand?: number | null
          cash_on_hand_updated_at?: string | null
          confidence_level?: string
          confidence_score?: number
          engine_version?: string
          field_sources?: Json
          gross_margin_target?: number | null
          incoherences?: Json
          inputs_sources?: Json | null
          integration_source?: string | null
          last_updated_at?: string
          model_type: string
          pricing_model?: string
          project_id: string
          revenue_type?: string
          sales_cycle_days?: number | null
          source_confidence?: number | null
          source_timestamp?: string | null
          top_client_revenue_percent?: number | null
        }
        Update: {
          avg_ticket?: number | null
          cac_estimate?: number | null
          cash_on_hand?: number | null
          cash_on_hand_updated_at?: string | null
          confidence_level?: string
          confidence_score?: number
          engine_version?: string
          field_sources?: Json
          gross_margin_target?: number | null
          incoherences?: Json
          inputs_sources?: Json | null
          integration_source?: string | null
          last_updated_at?: string
          model_type?: string
          pricing_model?: string
          project_id?: string
          revenue_type?: string
          sales_cycle_days?: number | null
          source_confidence?: number | null
          source_timestamp?: string | null
          top_client_revenue_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_economic_profile_engine_version_fkey"
            columns: ["engine_version"]
            isOneToOne: false
            referencedRelation: "engine_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_economic_profile_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_economic_profile_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_economic_profile_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_economic_profile_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_economic_profile_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_economic_profile_history: {
        Row: {
          change_reason: string
          changed_at: string
          changed_fields: Json
          engine_version: string | null
          id: string
          profile_snapshot: Json
          project_id: string
        }
        Insert: {
          change_reason: string
          changed_at?: string
          changed_fields: Json
          engine_version?: string | null
          id?: string
          profile_snapshot?: Json
          project_id: string
        }
        Update: {
          change_reason?: string
          changed_at?: string
          changed_fields?: Json
          engine_version?: string | null
          id?: string
          profile_snapshot?: Json
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_economic_profile_history_engine_version_fkey"
            columns: ["engine_version"]
            isOneToOne: false
            referencedRelation: "engine_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_economic_profile_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_economic_profile_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_economic_profile_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_economic_profile_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_economic_profile_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_function_coverage: {
        Row: {
          block_health_score: number
          coverage_level: string
          coverage_score: number
          engine_version: string
          function_type: string
          last_calculated_at: string
          owner_assigned_score: number
          process_score: number
          project_id: string
          tasks_execution_score: number
        }
        Insert: {
          block_health_score?: number
          coverage_level?: string
          coverage_score?: number
          engine_version: string
          function_type: string
          last_calculated_at?: string
          owner_assigned_score?: number
          process_score?: number
          project_id: string
          tasks_execution_score?: number
        }
        Update: {
          block_health_score?: number
          coverage_level?: string
          coverage_score?: number
          engine_version?: string
          function_type?: string
          last_calculated_at?: string
          owner_assigned_score?: number
          process_score?: number
          project_id?: string
          tasks_execution_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_function_coverage_engine_version_fkey"
            columns: ["engine_version"]
            isOneToOne: false
            referencedRelation: "engine_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_function_coverage_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_function_coverage_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_function_coverage_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_function_coverage_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_function_coverage_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_functions: {
        Row: {
          created_at: string
          documented_process_id: string | null
          function_type: string
          id: string
          owner_user_id: string | null
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          documented_process_id?: string | null
          function_type: string
          id?: string
          owner_user_id?: string | null
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          documented_process_id?: string | null
          function_type?: string
          id?: string
          owner_user_id?: string | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_functions_documented_process"
            columns: ["documented_process_id"]
            isOneToOne: false
            referencedRelation: "process_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_functions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_functions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_functions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_functions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_functions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string | null
          expires_at: string
          id: string
          invited_by: string
          max_uses: number
          project_id: string
          role: Database["public"]["Enums"]["specialization_role"]
          status: string
          token: string
          uses_count: number
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string | null
          expires_at: string
          id?: string
          invited_by: string
          max_uses?: number
          project_id: string
          role: Database["public"]["Enums"]["specialization_role"]
          status?: string
          token: string
          uses_count?: number
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          invited_by?: string
          max_uses?: number
          project_id?: string
          role?: Database["public"]["Enums"]["specialization_role"]
          status?: string
          token?: string
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "project_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "project_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invitations_project_id_fkey"
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
          last_performance_update: string | null
          member_id: string
          performance_score: number | null
          performance_score_v2: number | null
          project_id: string
          role: Database["public"]["Enums"]["specialization_role"] | null
          role_accepted: boolean | null
          role_accepted_at: string | null
          role_profile: Json | null
          role_responsibilities: Json | null
        }
        Insert: {
          id?: string
          is_lead?: boolean | null
          joined_at?: string | null
          last_performance_update?: string | null
          member_id: string
          performance_score?: number | null
          performance_score_v2?: number | null
          project_id: string
          role?: Database["public"]["Enums"]["specialization_role"] | null
          role_accepted?: boolean | null
          role_accepted_at?: string | null
          role_profile?: Json | null
          role_responsibilities?: Json | null
        }
        Update: {
          id?: string
          is_lead?: boolean | null
          joined_at?: string | null
          last_performance_update?: string | null
          member_id?: string
          performance_score?: number | null
          performance_score_v2?: number | null
          project_id?: string
          role?: Database["public"]["Enums"]["specialization_role"] | null
          role_accepted?: boolean | null
          role_accepted_at?: string | null
          role_profile?: Json | null
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
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
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
      project_org_state: {
        Row: {
          bottleneck_function: string | null
          bottleneck_role: string | null
          bottleneck_role_candidates: Json | null
          coverage_cash: string
          coverage_delivery: string
          coverage_demand: string
          critical_role_empty: boolean
          engine_version: string
          last_calculated_at: string
          missing_critical_role: string | null
          org_health_score: number
          org_status: string
          project_id: string
          roles_filled: number
          roles_unfilled: number
          total_members: number
        }
        Insert: {
          bottleneck_function?: string | null
          bottleneck_role?: string | null
          bottleneck_role_candidates?: Json | null
          coverage_cash?: string
          coverage_delivery?: string
          coverage_demand?: string
          critical_role_empty?: boolean
          engine_version?: string
          last_calculated_at?: string
          missing_critical_role?: string | null
          org_health_score?: number
          org_status?: string
          project_id: string
          roles_filled?: number
          roles_unfilled?: number
          total_members?: number
        }
        Update: {
          bottleneck_function?: string | null
          bottleneck_role?: string | null
          bottleneck_role_candidates?: Json | null
          coverage_cash?: string
          coverage_delivery?: string
          coverage_demand?: string
          critical_role_empty?: boolean
          engine_version?: string
          last_calculated_at?: string
          missing_critical_role?: string | null
          org_health_score?: number
          org_status?: string
          project_id?: string
          roles_filled?: number
          roles_unfilled?: number
          total_members?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_org_state_engine_version_fkey"
            columns: ["engine_version"]
            isOneToOne: false
            referencedRelation: "engine_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_org_state_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_org_state_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_org_state_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_org_state_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_org_state_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_phase_history: {
        Row: {
          calculated_at: string
          change_reason: string | null
          engine_version: string
          hard_signal_met: boolean
          id: string
          phase: number
          phase_score: number
          phase_status: string
          project_id: string
          trigger_source: string
        }
        Insert: {
          calculated_at?: string
          change_reason?: string | null
          engine_version: string
          hard_signal_met: boolean
          id?: string
          phase: number
          phase_score: number
          phase_status: string
          project_id: string
          trigger_source: string
        }
        Update: {
          calculated_at?: string
          change_reason?: string | null
          engine_version?: string
          hard_signal_met?: boolean
          id?: string
          phase?: number
          phase_score?: number
          phase_status?: string
          project_id?: string
          trigger_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_phase_history_engine_version_fkey"
            columns: ["engine_version"]
            isOneToOne: false
            referencedRelation: "engine_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phase_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phase_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phase_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_phase_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phase_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_phase_state: {
        Row: {
          consecutive_low_score: number
          current_phase: number
          engine_version: string
          entry_mode: string | null
          graduated: boolean
          graduation_eligible_since: string | null
          hard_signal_met: boolean
          inputs_sources: Json | null
          last_calculated_at: string
          phase_entered_at: string
          phase_last_changed_at: string
          phase_score: number
          phase_status: string
          primary_block: string
          project_id: string
        }
        Insert: {
          consecutive_low_score?: number
          current_phase: number
          engine_version: string
          entry_mode?: string | null
          graduated?: boolean
          graduation_eligible_since?: string | null
          hard_signal_met?: boolean
          inputs_sources?: Json | null
          last_calculated_at?: string
          phase_entered_at?: string
          phase_last_changed_at?: string
          phase_score: number
          phase_status: string
          primary_block?: string
          project_id: string
        }
        Update: {
          consecutive_low_score?: number
          current_phase?: number
          engine_version?: string
          entry_mode?: string | null
          graduated?: boolean
          graduation_eligible_since?: string | null
          hard_signal_met?: boolean
          inputs_sources?: Json | null
          last_calculated_at?: string
          phase_entered_at?: string
          phase_last_changed_at?: string
          phase_score?: number
          phase_status?: string
          primary_block?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_phase_state_engine_version_fkey"
            columns: ["engine_version"]
            isOneToOne: false
            referencedRelation: "engine_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phase_state_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phase_state_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phase_state_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_phase_state_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phase_state_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_probability: {
        Row: {
          capacity_health_input: number | null
          data_completeness_score: number
          engine_version: string
          execution_rate_input: number | null
          inputs_sources: Json | null
          last_calculated_at: string
          phase_score_input: number | null
          probability_score: number | null
          probability_status: string
          project_id: string
          revenue_momentum_input: number | null
          validation_strength_input: number | null
        }
        Insert: {
          capacity_health_input?: number | null
          data_completeness_score?: number
          engine_version: string
          execution_rate_input?: number | null
          inputs_sources?: Json | null
          last_calculated_at?: string
          phase_score_input?: number | null
          probability_score?: number | null
          probability_status?: string
          project_id: string
          revenue_momentum_input?: number | null
          validation_strength_input?: number | null
        }
        Update: {
          capacity_health_input?: number | null
          data_completeness_score?: number
          engine_version?: string
          execution_rate_input?: number | null
          inputs_sources?: Json | null
          last_calculated_at?: string
          phase_score_input?: number | null
          probability_score?: number | null
          probability_status?: string
          project_id?: string
          revenue_momentum_input?: number | null
          validation_strength_input?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_probability_engine_version_fkey"
            columns: ["engine_version"]
            isOneToOne: false
            referencedRelation: "engine_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_probability_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_probability_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_probability_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_probability_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_probability_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_probability_history: {
        Row: {
          calculated_at: string
          capacity_health_input: number | null
          data_completeness_score: number
          engine_version: string
          execution_rate_input: number | null
          id: string
          phase_score_input: number | null
          probability_score: number | null
          probability_status: string
          project_id: string
          revenue_momentum_input: number | null
          trigger_source: string
          validation_strength_input: number | null
        }
        Insert: {
          calculated_at?: string
          capacity_health_input?: number | null
          data_completeness_score?: number
          engine_version: string
          execution_rate_input?: number | null
          id?: string
          phase_score_input?: number | null
          probability_score?: number | null
          probability_status: string
          project_id: string
          revenue_momentum_input?: number | null
          trigger_source: string
          validation_strength_input?: number | null
        }
        Update: {
          calculated_at?: string
          capacity_health_input?: number | null
          data_completeness_score?: number
          engine_version?: string
          execution_rate_input?: number | null
          id?: string
          phase_score_input?: number | null
          probability_score?: number | null
          probability_status?: string
          project_id?: string
          revenue_momentum_input?: number | null
          trigger_source?: string
          validation_strength_input?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_probability_history_engine_version_fkey"
            columns: ["engine_version"]
            isOneToOne: false
            referencedRelation: "engine_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_probability_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_probability_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_probability_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_probability_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_probability_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_protocols: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          link_or_doc_id: string | null
          project_id: string
          protocol_type: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          link_or_doc_id?: string | null
          project_id: string
          protocol_type: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          link_or_doc_id?: string | null
          project_id?: string
          protocol_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_protocols_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_protocols_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_protocols_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_protocols_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_protocols_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_risk_score: {
        Row: {
          bottleneck_severity_input: number | null
          data_completeness_score: number
          engine_version: string
          execution_drop_input: number | null
          inputs_available: number
          inputs_sources: Json | null
          last_calculated_at: string
          org_capacity_input: number | null
          project_id: string
          revenue_concentration_input: number | null
          risk_level: string
          risk_score: number | null
          risk_status: string
          runway_factor_input: number | null
          validation_weakness_input: number | null
        }
        Insert: {
          bottleneck_severity_input?: number | null
          data_completeness_score?: number
          engine_version: string
          execution_drop_input?: number | null
          inputs_available?: number
          inputs_sources?: Json | null
          last_calculated_at?: string
          org_capacity_input?: number | null
          project_id: string
          revenue_concentration_input?: number | null
          risk_level?: string
          risk_score?: number | null
          risk_status?: string
          runway_factor_input?: number | null
          validation_weakness_input?: number | null
        }
        Update: {
          bottleneck_severity_input?: number | null
          data_completeness_score?: number
          engine_version?: string
          execution_drop_input?: number | null
          inputs_available?: number
          inputs_sources?: Json | null
          last_calculated_at?: string
          org_capacity_input?: number | null
          project_id?: string
          revenue_concentration_input?: number | null
          risk_level?: string
          risk_score?: number | null
          risk_status?: string
          runway_factor_input?: number | null
          validation_weakness_input?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_risk_score_engine_version_fkey"
            columns: ["engine_version"]
            isOneToOne: false
            referencedRelation: "engine_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_risk_score_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_risk_score_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_risk_score_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_risk_score_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_risk_score_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_risk_score_history: {
        Row: {
          bottleneck_severity_input: number | null
          calculated_at: string
          data_completeness_score: number
          engine_version: string
          execution_drop_input: number | null
          id: string
          inputs_available: number
          org_capacity_input: number | null
          project_id: string
          revenue_concentration_input: number | null
          risk_level: string
          risk_score: number | null
          risk_status: string
          runway_factor_input: number | null
          trigger_source: string
          validation_weakness_input: number | null
        }
        Insert: {
          bottleneck_severity_input?: number | null
          calculated_at?: string
          data_completeness_score?: number
          engine_version: string
          execution_drop_input?: number | null
          id?: string
          inputs_available?: number
          org_capacity_input?: number | null
          project_id: string
          revenue_concentration_input?: number | null
          risk_level: string
          risk_score?: number | null
          risk_status: string
          runway_factor_input?: number | null
          trigger_source: string
          validation_weakness_input?: number | null
        }
        Update: {
          bottleneck_severity_input?: number | null
          calculated_at?: string
          data_completeness_score?: number
          engine_version?: string
          execution_drop_input?: number | null
          id?: string
          inputs_available?: number
          org_capacity_input?: number | null
          project_id?: string
          revenue_concentration_input?: number | null
          risk_level?: string
          risk_score?: number | null
          risk_status?: string
          runway_factor_input?: number | null
          trigger_source?: string
          validation_weakness_input?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_risk_score_history_engine_version_fkey"
            columns: ["engine_version"]
            isOneToOne: false
            referencedRelation: "engine_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_risk_score_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_risk_score_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_risk_score_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_risk_score_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_risk_score_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_source_preferences: {
        Row: {
          enabled: boolean
          excluded_fields: string[]
          id: string
          project_id: string
          source: string
          updated_at: string
          weight_override: number | null
        }
        Insert: {
          enabled?: boolean
          excluded_fields?: string[]
          id?: string
          project_id: string
          source: string
          updated_at?: string
          weight_override?: number | null
        }
        Update: {
          enabled?: boolean
          excluded_fields?: string[]
          id?: string
          project_id?: string
          source?: string
          updated_at?: string
          weight_override?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_source_preferences_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_source_preferences_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_source_preferences_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_source_preferences_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_source_preferences_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_strategy_current: {
        Row: {
          last_updated_at: string
          problem_text: string | null
          project_id: string
          segment_text: string | null
          updated_by: string | null
          value_prop_text: string | null
          version_number: number
        }
        Insert: {
          last_updated_at?: string
          problem_text?: string | null
          project_id: string
          segment_text?: string | null
          updated_by?: string | null
          value_prop_text?: string | null
          version_number?: number
        }
        Update: {
          last_updated_at?: string
          problem_text?: string | null
          project_id?: string
          segment_text?: string | null
          updated_by?: string | null
          value_prop_text?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_strategy_current_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_strategy_current_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_strategy_current_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_strategy_current_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_strategy_current_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_user_state: {
        Row: {
          last_seen_at: string | null
          project_id: string
          user_id: string
        }
        Insert: {
          last_seen_at?: string | null
          project_id: string
          user_id: string
        }
        Update: {
          last_seen_at?: string | null
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_user_state_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_user_state_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_user_state_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_user_state_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_user_state_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_viability_state: {
        Row: {
          active_trigger_count: number
          engine_version: string
          inputs_sources: Json | null
          last_evaluated_at: string
          project_id: string
          t2_cash_flow_active: boolean
          top_trigger_consecutive: number
          top_trigger_type: string | null
          trigger_consecutive_max: number
          viability_status: string
        }
        Insert: {
          active_trigger_count?: number
          engine_version: string
          inputs_sources?: Json | null
          last_evaluated_at?: string
          project_id: string
          t2_cash_flow_active?: boolean
          top_trigger_consecutive?: number
          top_trigger_type?: string | null
          trigger_consecutive_max?: number
          viability_status?: string
        }
        Update: {
          active_trigger_count?: number
          engine_version?: string
          inputs_sources?: Json | null
          last_evaluated_at?: string
          project_id?: string
          t2_cash_flow_active?: boolean
          top_trigger_consecutive?: number
          top_trigger_type?: string | null
          trigger_consecutive_max?: number
          viability_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_viability_state_engine_version_fkey"
            columns: ["engine_version"]
            isOneToOne: false
            referencedRelation: "engine_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_viability_state_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_viability_state_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_viability_state_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_viability_state_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_viability_state_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          archived_at: string | null
          cluster: string | null
          color: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          descripcion: string | null
          fase: Database["public"]["Enums"]["project_phase"] | null
          icon: string | null
          id: string
          market_scope: string | null
          nombre: string
          onboarding_completed: boolean | null
          onboarding_data: Json | null
          paused_at: string | null
          tipo: Database["public"]["Enums"]["project_type"] | null
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          cluster?: string | null
          color?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          descripcion?: string | null
          fase?: Database["public"]["Enums"]["project_phase"] | null
          icon?: string | null
          id?: string
          market_scope?: string | null
          nombre: string
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          paused_at?: string | null
          tipo?: Database["public"]["Enums"]["project_type"] | null
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          cluster?: string | null
          color?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          descripcion?: string | null
          fase?: Database["public"]["Enums"]["project_phase"] | null
          icon?: string | null
          id?: string
          market_scope?: string | null
          nombre?: string
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          paused_at?: string | null
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
          {
            foreignKeyName: "projects_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "projects_deleted_by_fkey"
            columns: ["deleted_by"]
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
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_rankings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_rotation_requests_requester_project_id_fkey"
            columns: ["requester_project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
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
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_rotation_requests_target_project_id_fkey"
            columns: ["target_project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
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
      slack_webhooks: {
        Row: {
          created_at: string | null
          created_by: string | null
          enabled: boolean | null
          id: string
          last_used_at: string | null
          notification_types: string[] | null
          project_id: string | null
          webhook_type: string | null
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          enabled?: boolean | null
          id?: string
          last_used_at?: string | null
          notification_types?: string[] | null
          project_id?: string | null
          webhook_type?: string | null
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          enabled?: boolean | null
          id?: string
          last_used_at?: string | null
          notification_types?: string[] | null
          project_id?: string | null
          webhook_type?: string | null
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "slack_webhooks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slack_webhooks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slack_webhooks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "slack_webhooks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slack_webhooks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      strategic_bet_invalidations: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          decision_event_id: string | null
          decision_made_at: string
          decision_summary: string
          evidence: Json
          id: string
          invalidation_reason: string
          project_id: string
          strategic_block_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          decision_event_id?: string | null
          decision_made_at: string
          decision_summary: string
          evidence?: Json
          id?: string
          invalidation_reason: string
          project_id: string
          strategic_block_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          decision_event_id?: string | null
          decision_made_at?: string
          decision_summary?: string
          evidence?: Json
          id?: string
          invalidation_reason?: string
          project_id?: string
          strategic_block_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "strategic_bet_invalidations_decision_event_id_fkey"
            columns: ["decision_event_id"]
            isOneToOne: false
            referencedRelation: "decision_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_bet_invalidations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_bet_invalidations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_bet_invalidations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "strategic_bet_invalidations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_bet_invalidations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_bet_invalidations_strategic_block_id_fkey"
            columns: ["strategic_block_id"]
            isOneToOne: false
            referencedRelation: "strategic_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      strategic_blocks: {
        Row: {
          behavioral_block_candidate: boolean
          block_type: string
          blocker_area: string | null
          created_by: string | null
          description: string | null
          engine_version: string | null
          first_detected_at: string
          function_id: string | null
          id: string
          impact_weight: number
          last_evaluated_at: string
          last_updated_at: string
          origin: string
          project_id: string
          reopen_count: number
          resolved_at: string | null
          source: string | null
          status: string
          task_id: string | null
          weeks_active: number
        }
        Insert: {
          behavioral_block_candidate?: boolean
          block_type: string
          blocker_area?: string | null
          created_by?: string | null
          description?: string | null
          engine_version?: string | null
          first_detected_at?: string
          function_id?: string | null
          id?: string
          impact_weight?: number
          last_evaluated_at?: string
          last_updated_at?: string
          origin: string
          project_id: string
          reopen_count?: number
          resolved_at?: string | null
          source?: string | null
          status?: string
          task_id?: string | null
          weeks_active?: number
        }
        Update: {
          behavioral_block_candidate?: boolean
          block_type?: string
          blocker_area?: string | null
          created_by?: string | null
          description?: string | null
          engine_version?: string | null
          first_detected_at?: string
          function_id?: string | null
          id?: string
          impact_weight?: number
          last_evaluated_at?: string
          last_updated_at?: string
          origin?: string
          project_id?: string
          reopen_count?: number
          resolved_at?: string | null
          source?: string | null
          status?: string
          task_id?: string | null
          weeks_active?: number
        }
        Relationships: [
          {
            foreignKeyName: "strategic_blocks_engine_version_fkey"
            columns: ["engine_version"]
            isOneToOne: false
            referencedRelation: "engine_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_blocks_function_id_fkey"
            columns: ["function_id"]
            isOneToOne: false
            referencedRelation: "project_functions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_blocks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_blocks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_blocks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "strategic_blocks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_blocks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_blocks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      strategic_cycles: {
        Row: {
          close_reason: string | null
          closed_at: string | null
          completed_at: string | null
          cycle_evaluation: string | null
          cycle_index: number
          cycle_score: number | null
          decision_event_id: string | null
          description: string | null
          end_date: string
          engine_snapshot: Json
          generation_context: Json | null
          id: string
          objectives: Json | null
          previous_cycle_id: string | null
          project_id: string
          ritual_responses: Json | null
          start_date: string
          status: string
          title: string | null
          urgent_reset_requested: boolean
        }
        Insert: {
          close_reason?: string | null
          closed_at?: string | null
          completed_at?: string | null
          cycle_evaluation?: string | null
          cycle_index: number
          cycle_score?: number | null
          decision_event_id?: string | null
          description?: string | null
          end_date: string
          engine_snapshot?: Json
          generation_context?: Json | null
          id?: string
          objectives?: Json | null
          previous_cycle_id?: string | null
          project_id: string
          ritual_responses?: Json | null
          start_date: string
          status?: string
          title?: string | null
          urgent_reset_requested?: boolean
        }
        Update: {
          close_reason?: string | null
          closed_at?: string | null
          completed_at?: string | null
          cycle_evaluation?: string | null
          cycle_index?: number
          cycle_score?: number | null
          decision_event_id?: string | null
          description?: string | null
          end_date?: string
          engine_snapshot?: Json
          generation_context?: Json | null
          id?: string
          objectives?: Json | null
          previous_cycle_id?: string | null
          project_id?: string
          ritual_responses?: Json | null
          start_date?: string
          status?: string
          title?: string | null
          urgent_reset_requested?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "strategic_cycles_decision_event_id_fkey"
            columns: ["decision_event_id"]
            isOneToOne: false
            referencedRelation: "decision_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_cycles_previous_cycle_id_fkey"
            columns: ["previous_cycle_id"]
            isOneToOne: false
            referencedRelation: "strategic_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_cycles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_cycles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_cycles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "strategic_cycles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_cycles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      strategic_model_versions: {
        Row: {
          changed_fields: Json
          created_at: string
          created_by: string | null
          id: string
          problem_text: string | null
          project_id: string
          segment_text: string | null
          value_prop_text: string | null
          version_number: number
        }
        Insert: {
          changed_fields?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          problem_text?: string | null
          project_id: string
          segment_text?: string | null
          value_prop_text?: string | null
          version_number: number
        }
        Update: {
          changed_fields?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          problem_text?: string | null
          project_id?: string
          segment_text?: string | null
          value_prop_text?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "strategic_model_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_model_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_model_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "strategic_model_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_model_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
          external_id: string | null
          external_provider: string | null
          external_synced_at: string | null
          fecha_limite: string | null
          function_type: string | null
          id: string
          leader_id: string | null
          meeting_id: string | null
          metadata: Json | null
          playbook: Json | null
          prioridad: number | null
          project_id: string | null
          relacionada_con_leads: string[] | null
          source: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          tiempo_estimado_horas: number | null
          tipo_tarea: string | null
          titulo: string
        }
        Insert: {
          ai_generated?: boolean | null
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          descripcion?: string | null
          external_id?: string | null
          external_provider?: string | null
          external_synced_at?: string | null
          fecha_limite?: string | null
          function_type?: string | null
          id?: string
          leader_id?: string | null
          meeting_id?: string | null
          metadata?: Json | null
          playbook?: Json | null
          prioridad?: number | null
          project_id?: string | null
          relacionada_con_leads?: string[] | null
          source?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          tiempo_estimado_horas?: number | null
          tipo_tarea?: string | null
          titulo: string
        }
        Update: {
          ai_generated?: boolean | null
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          descripcion?: string | null
          external_id?: string | null
          external_provider?: string | null
          external_synced_at?: string | null
          fecha_limite?: string | null
          function_type?: string | null
          id?: string
          leader_id?: string | null
          meeting_id?: string | null
          metadata?: Json | null
          playbook?: Json | null
          prioridad?: number | null
          project_id?: string | null
          relacionada_con_leads?: string[] | null
          source?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          tiempo_estimado_horas?: number | null
          tipo_tarea?: string | null
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
            foreignKeyName: "tasks_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "tasks_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
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
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
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
      user_source_policies: {
        Row: {
          allowed_domains: string[] | null
          blocked_domains: string[] | null
          created_at: string | null
          evidence_mode: string | null
          id: string
          max_source_age_days: number | null
          min_reliability_score: number | null
          project_id: string
          require_https: boolean | null
          tier_1_enabled: boolean | null
          tier_2_enabled: boolean | null
          tier_3_enabled: boolean | null
          tier_4_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allowed_domains?: string[] | null
          blocked_domains?: string[] | null
          created_at?: string | null
          evidence_mode?: string | null
          id?: string
          max_source_age_days?: number | null
          min_reliability_score?: number | null
          project_id: string
          require_https?: boolean | null
          tier_1_enabled?: boolean | null
          tier_2_enabled?: boolean | null
          tier_3_enabled?: boolean | null
          tier_4_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allowed_domains?: string[] | null
          blocked_domains?: string[] | null
          created_at?: string | null
          evidence_mode?: string | null
          id?: string
          max_source_age_days?: number | null
          min_reliability_score?: number | null
          project_id?: string
          require_https?: boolean | null
          tier_1_enabled?: boolean | null
          tier_2_enabled?: boolean | null
          tier_3_enabled?: boolean | null
          tier_4_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_source_policies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_source_policies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_source_policies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "user_source_policies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_source_policies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      validation_order: {
        Row: {
          created_at: string | null
          id: string
          month_year: string
          position: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          month_year?: string
          position: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          month_year?: string
          position?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "validation_order_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validation_order_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "validation_order_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      validation_roadmaps: {
        Row: {
          completed_experiments: string[] | null
          experiments: Json | null
          generated_at: string | null
          hypotheses: Json | null
          id: string
          milestones: Json | null
          project_id: string
          updated_at: string | null
        }
        Insert: {
          completed_experiments?: string[] | null
          experiments?: Json | null
          generated_at?: string | null
          hypotheses?: Json | null
          id?: string
          milestones?: Json | null
          project_id: string
          updated_at?: string | null
        }
        Update: {
          completed_experiments?: string[] | null
          experiments?: Json | null
          generated_at?: string | null
          hypotheses?: Json | null
          id?: string
          milestones?: Json | null
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "validation_roadmaps_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validation_roadmaps_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validation_roadmaps_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "validation_roadmaps_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validation_roadmaps_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      validator_stats: {
        Row: {
          blocked_until: string | null
          id: string
          is_blocked: boolean | null
          late_validations: number | null
          missed_validations: number | null
          on_time_validations: number | null
          total_validations: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          blocked_until?: string | null
          id?: string
          is_blocked?: boolean | null
          late_validations?: number | null
          missed_validations?: number | null
          on_time_validations?: number | null
          total_validations?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          blocked_until?: string | null
          id?: string
          is_blocked?: boolean | null
          late_validations?: number | null
          missed_validations?: number | null
          on_time_validations?: number | null
          total_validations?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "validator_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validator_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "validator_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      viability_events: {
        Row: {
          confidence_level: string
          consecutive_count: number
          decision_event_id: string | null
          engine_version: string
          first_triggered_at: string
          hidden_until: string | null
          last_evaluated_at: string
          project_id: string
          resolved_at: string | null
          trigger_type: string
        }
        Insert: {
          confidence_level?: string
          consecutive_count?: number
          decision_event_id?: string | null
          engine_version: string
          first_triggered_at?: string
          hidden_until?: string | null
          last_evaluated_at?: string
          project_id: string
          resolved_at?: string | null
          trigger_type: string
        }
        Update: {
          confidence_level?: string
          consecutive_count?: number
          decision_event_id?: string | null
          engine_version?: string
          first_triggered_at?: string
          hidden_until?: string | null
          last_evaluated_at?: string
          project_id?: string
          resolved_at?: string | null
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "viability_events_decision_event_id_fkey"
            columns: ["decision_event_id"]
            isOneToOne: false
            referencedRelation: "decision_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viability_events_engine_version_fkey"
            columns: ["engine_version"]
            isOneToOne: false
            referencedRelation: "engine_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viability_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viability_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viability_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "viability_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viability_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_onboarding_transcripts: {
        Row: {
          audio_url: string
          created_at: string | null
          duration_seconds: number | null
          extracted_answers: Json | null
          id: string
          processed_at: string | null
          project_id: string
          reviewed: boolean | null
          transcript: string | null
          user_edits: Json | null
        }
        Insert: {
          audio_url: string
          created_at?: string | null
          duration_seconds?: number | null
          extracted_answers?: Json | null
          id?: string
          processed_at?: string | null
          project_id: string
          reviewed?: boolean | null
          transcript?: string | null
          user_edits?: Json | null
        }
        Update: {
          audio_url?: string
          created_at?: string | null
          duration_seconds?: number | null
          extracted_answers?: Json | null
          id?: string
          processed_at?: string | null
          project_id?: string
          reviewed?: boolean | null
          transcript?: string | null
          user_edits?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_onboarding_transcripts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_onboarding_transcripts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_onboarding_transcripts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "voice_onboarding_transcripts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_onboarding_transcripts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_insights: {
        Row: {
          competitor_changes: Json | null
          concerns: Json | null
          created_at: string
          highlights: Json | null
          id: string
          next_week_priorities: Json | null
          project_id: string
          recommendations: Json | null
          sent_at: string | null
          summary: string
          week_end: string
          week_start: string
        }
        Insert: {
          competitor_changes?: Json | null
          concerns?: Json | null
          created_at?: string
          highlights?: Json | null
          id?: string
          next_week_priorities?: Json | null
          project_id: string
          recommendations?: Json | null
          sent_at?: string | null
          summary: string
          week_end: string
          week_start: string
        }
        Update: {
          competitor_changes?: Json | null
          concerns?: Json | null
          created_at?: string
          highlights?: Json | null
          id?: string
          next_week_priorities?: Json | null
          project_id?: string
          recommendations?: Json | null
          sent_at?: string | null
          summary?: string
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "weekly_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reviews: {
        Row: {
          commitments_fulfilled: number
          commitments_generated: number
          created_at: string | null
          has_regression: boolean | null
          has_transition: boolean | null
          id: string
          meetings_count: number
          mrr: number | null
          obvs_count: number | null
          phase: number | null
          phase_score: number | null
          phase_status: string | null
          project_id: string
          read_at: string | null
          runway_months: number | null
          sales_count: number | null
          summary_json: Json
          tasks_completed: number | null
          week_end_date: string
          week_start_date: string
        }
        Insert: {
          commitments_fulfilled?: number
          commitments_generated?: number
          created_at?: string | null
          has_regression?: boolean | null
          has_transition?: boolean | null
          id?: string
          meetings_count?: number
          mrr?: number | null
          obvs_count?: number | null
          phase?: number | null
          phase_score?: number | null
          phase_status?: string | null
          project_id: string
          read_at?: string | null
          runway_months?: number | null
          sales_count?: number | null
          summary_json?: Json
          tasks_completed?: number | null
          week_end_date: string
          week_start_date: string
        }
        Update: {
          commitments_fulfilled?: number
          commitments_generated?: number
          created_at?: string | null
          has_regression?: boolean | null
          has_transition?: boolean | null
          id?: string
          meetings_count?: number
          mrr?: number | null
          obvs_count?: number | null
          phase?: number | null
          phase_score?: number | null
          phase_status?: string | null
          project_id?: string
          read_at?: string | null
          runway_months?: number | null
          sales_count?: number | null
          summary_json?: Json
          tasks_completed?: number | null
          week_end_date?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "weekly_reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_projects: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          descripcion: string | null
          fase: Database["public"]["Enums"]["project_phase"] | null
          icon: string | null
          id: string | null
          nombre: string | null
          onboarding_completed: boolean | null
          onboarding_data: Json | null
          tipo: Database["public"]["Enums"]["project_type"] | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          descripcion?: string | null
          fase?: Database["public"]["Enums"]["project_phase"] | null
          icon?: string | null
          id?: string | null
          nombre?: string | null
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          tipo?: Database["public"]["Enums"]["project_type"] | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          descripcion?: string | null
          fase?: Database["public"]["Enums"]["project_phase"] | null
          icon?: string | null
          id?: string | null
          nombre?: string | null
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
          {
            foreignKeyName: "projects_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "projects_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deleted_projects: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_email: string | null
          deleted_by_name: string | null
          deletion_reason: string | null
          descripcion: string | null
          fase: Database["public"]["Enums"]["project_phase"] | null
          icon: string | null
          id: string | null
          nombre: string | null
          onboarding_completed: boolean | null
          onboarding_data: Json | null
          tipo: Database["public"]["Enums"]["project_type"] | null
          updated_at: string | null
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
          {
            foreignKeyName: "projects_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "projects_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      founder_tool_feedback: {
        Row: {
          completion_rate: number | null
          last_task_at: string | null
          project_id: string | null
          tasks_completed: number | null
          tasks_created: number | null
          tasks_ignored: number | null
          tool_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "founder_tool_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "founder_tool_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "founder_tool_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "founder_tool_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "founder_tool_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_sync_quality: {
        Row: {
          connection_id: string | null
          entities_processed: number | null
          entities_rejected: number | null
          entities_skipped: number | null
          entities_written: number | null
          has_quality_warning: boolean | null
          last_sync_at: string | null
          last_sync_status: string | null
          project_id: string | null
          provider: string | null
          quality_pct: number | null
        }
        Insert: {
          connection_id?: string | null
          entities_processed?: number | null
          entities_rejected?: number | null
          entities_skipped?: number | null
          entities_written?: number | null
          has_quality_warning?: never
          last_sync_at?: string | null
          last_sync_status?: string | null
          project_id?: string | null
          provider?: string | null
          quality_pct?: never
        }
        Update: {
          connection_id?: string | null
          entities_processed?: number | null
          entities_rejected?: number | null
          entities_skipped?: number | null
          entities_written?: number | null
          has_quality_warning?: never
          last_sync_at?: string | null
          last_sync_status?: string | null
          project_id?: string | null
          provider?: string | null
          quality_pct?: never
        }
        Relationships: [
          {
            foreignKeyName: "integration_sync_runs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "integration_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_sync_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_sync_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_sync_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "financial_metrics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "integration_sync_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_sync_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
          cobro_estado: string | null
          cobro_fecha_esperada: string | null
          dias_vencido: number | null
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
          cantidad: number | null
          cobrado: boolean | null
          cobrado_parcial: number | null
          cobro_dias_retraso: number | null
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
          estado_cobro: string | null
          evidence_url: string | null
          facturacion: number | null
          fecha: string | null
          forma_pago: string | null
          id: string | null
          importe_cobrado: number | null
          iva_importe: number | null
          iva_porcentaje: number | null
          margen: number | null
          nombre_contacto: string | null
          notas: string | null
          numero_factura: string | null
          numero_presupuesto: string | null
          owner_id: string | null
          pipeline_status: Database["public"]["Enums"]["lead_status"] | null
          precio_unitario: number | null
          producto: string | null
          project_id: string | null
          proxima_accion: string | null
          proxima_accion_fecha: string | null
          proyecto_color: string | null
          proyecto_nombre: string | null
          responsable_id: string | null
          responsable_nombre: string | null
          status: Database["public"]["Enums"]["kpi_status"] | null
          telefono_contacto: string | null
          tipo: Database["public"]["Enums"]["obv_type"] | null
          titulo: string | null
          total_factura: number | null
          updated_at: string | null
          validated_at: string | null
          valor_potencial: number | null
        }
        Relationships: [
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
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
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
          {
            foreignKeyName: "obvs_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "obvs_responsable_id_fkey"
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
          margen: number | null
          nombre: string | null
          num_members: number | null
          obvs_validados: number | null
          onboarding_completed: boolean | null
          tipo: Database["public"]["Enums"]["project_type"] | null
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
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
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
      v_engine_input_audit: {
        Row: {
          computed_at: string | null
          engine: string | null
          input_mrr: string | null
          input_mrr_source: string | null
          input_mrr_ts: string | null
          input_obvs_count: string | null
          input_obvs_count_source: string | null
          input_obvs_count_ts: string | null
          input_validation_rate: string | null
          input_validation_rate_source: string | null
          input_validation_rate_ts: string | null
          output_value: string | null
          project_id: string | null
          raw_sources: Json | null
        }
        Relationships: []
      }
      v_notif_health_critical: {
        Row: {
          email_ratio: number | null
          read_count: number | null
          read_ratio: number | null
          total: number | null
          type: string | null
          unread_emailed: number | null
          unread_not_emailed: number | null
        }
        Relationships: []
      }
      v_notif_health_per_entity: {
        Row: {
          critical_count: number | null
          project_id: string | null
          project_name: string | null
          total: number | null
          user_id: string | null
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
      v_notif_health_volume: {
        Row: {
          day: string | null
          priority: string | null
          total: number | null
          type: string | null
        }
        Relationships: []
      }
      v_obvs_canonical: {
        Row: {
          cantidad: number | null
          cobrado: boolean | null
          cobrado_parcial: number | null
          cobro_dias_retraso: number | null
          cobro_estado: string | null
          cobro_fecha_esperada: string | null
          cobro_fecha_real: string | null
          cobro_metodo: string | null
          costes: number | null
          costes_detalle: Json | null
          created_at: string | null
          descripcion: string | null
          dispute_flag: boolean | null
          email_contacto: string | null
          empresa: string | null
          es_venta: boolean | null
          estado_cobro: string | null
          evidence_url: string | null
          facturacion: number | null
          fecha: string | null
          forma_pago: string | null
          id: string | null
          importe_cobrado: number | null
          iva_importe: number | null
          iva_porcentaje: number | null
          margen: number | null
          nombre_contacto: string | null
          notas: string | null
          numero_factura: string | null
          numero_presupuesto: string | null
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
          tipo: Database["public"]["Enums"]["obv_type"] | null
          tipo_canonical: string | null
          titulo: string | null
          total_factura: number | null
          type_auto_update_reason: string | null
          type_auto_updated: boolean | null
          type_declared_original: Database["public"]["Enums"]["obv_type"] | null
          updated_at: string | null
          validated_at: string | null
          valor_potencial: number | null
          verification_multiplier: number | null
        }
        Insert: {
          cantidad?: number | null
          cobrado?: boolean | null
          cobrado_parcial?: number | null
          cobro_dias_retraso?: number | null
          cobro_estado?: string | null
          cobro_fecha_esperada?: string | null
          cobro_fecha_real?: string | null
          cobro_metodo?: string | null
          costes?: number | null
          costes_detalle?: Json | null
          created_at?: string | null
          descripcion?: string | null
          dispute_flag?: boolean | null
          email_contacto?: string | null
          empresa?: string | null
          es_venta?: boolean | null
          estado_cobro?: string | null
          evidence_url?: string | null
          facturacion?: number | null
          fecha?: string | null
          forma_pago?: string | null
          id?: string | null
          importe_cobrado?: number | null
          iva_importe?: number | null
          iva_porcentaje?: number | null
          margen?: number | null
          nombre_contacto?: string | null
          notas?: string | null
          numero_factura?: string | null
          numero_presupuesto?: string | null
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
          tipo?: Database["public"]["Enums"]["obv_type"] | null
          tipo_canonical?: never
          titulo?: string | null
          total_factura?: number | null
          type_auto_update_reason?: string | null
          type_auto_updated?: boolean | null
          type_declared_original?:
            | Database["public"]["Enums"]["obv_type"]
            | null
          updated_at?: string | null
          validated_at?: string | null
          valor_potencial?: number | null
          verification_multiplier?: never
        }
        Update: {
          cantidad?: number | null
          cobrado?: boolean | null
          cobrado_parcial?: number | null
          cobro_dias_retraso?: number | null
          cobro_estado?: string | null
          cobro_fecha_esperada?: string | null
          cobro_fecha_real?: string | null
          cobro_metodo?: string | null
          costes?: number | null
          costes_detalle?: Json | null
          created_at?: string | null
          descripcion?: string | null
          dispute_flag?: boolean | null
          email_contacto?: string | null
          empresa?: string | null
          es_venta?: boolean | null
          estado_cobro?: string | null
          evidence_url?: string | null
          facturacion?: number | null
          fecha?: string | null
          forma_pago?: string | null
          id?: string | null
          importe_cobrado?: number | null
          iva_importe?: number | null
          iva_porcentaje?: number | null
          margen?: number | null
          nombre_contacto?: string | null
          notas?: string | null
          numero_factura?: string | null
          numero_presupuesto?: string | null
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
          tipo?: Database["public"]["Enums"]["obv_type"] | null
          tipo_canonical?: never
          titulo?: string | null
          total_factura?: number | null
          type_auto_update_reason?: string | null
          type_auto_updated?: boolean | null
          type_declared_original?:
            | Database["public"]["Enums"]["obv_type"]
            | null
          updated_at?: string | null
          validated_at?: string | null
          valor_potencial?: number | null
          verification_multiplier?: never
        }
        Relationships: [
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
            referencedRelation: "active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "deleted_projects"
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
          {
            foreignKeyName: "obvs_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obvs_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["responsable_id"]
          },
          {
            foreignKeyName: "obvs_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _integration_write_economic_profile: {
        Args: {
          p_confidence: number
          p_payload: Json
          p_project_id: string
          p_provider: string
          p_source_timestamp: string
        }
        Returns: {
          ok: boolean
          reason: string
        }[]
      }
      _integration_write_financial_projections: {
        Args: {
          p_confidence: number
          p_logical_period: string
          p_payload: Json
          p_project_id: string
          p_provider: string
          p_source_timestamp: string
        }
        Returns: {
          ok: boolean
          reason: string
        }[]
      }
      _integration_write_key_metrics: {
        Args: {
          p_confidence: number
          p_payload: Json
          p_project_id: string
          p_provider: string
          p_source_timestamp: string
        }
        Returns: {
          ok: boolean
          reason: string
        }[]
      }
      _integration_write_obv: {
        Args: {
          p_confidence: number
          p_payload: Json
          p_project_id: string
          p_provider: string
          p_source_timestamp: string
        }
        Returns: {
          ok: boolean
          reason: string
        }[]
      }
      _integration_write_task: {
        Args: {
          p_confidence: number
          p_payload: Json
          p_project_id: string
          p_provider: string
          p_source_timestamp: string
        }
        Returns: {
          ok: boolean
          reason: string
        }[]
      }
      _upsert_viability_trigger: {
        Args: {
          p_active: boolean
          p_confidence?: string
          p_engine_ver?: string
          p_project_id: string
          p_trigger_type: string
        }
        Returns: undefined
      }
      accept_invitation: { Args: { p_token: string }; Returns: Json }
      activate_challenge: {
        Args: { p_activated_by: string; p_challenge_id: string }
        Returns: undefined
      }
      apply_viability_decision: {
        Args: {
          p_decided_by: string
          p_decision_type: string
          p_notes?: string
          p_project_id: string
          p_trigger_type: string
        }
        Returns: string
      }
      archive_notification: {
        Args: { p_notification_id: string }
        Returns: undefined
      }
      archive_project: { Args: { p_project_id: string }; Returns: undefined }
      auth_is_project_member: {
        Args: { p_project_id: string }
        Returns: boolean
      }
      auth_is_project_owner: {
        Args: { p_project_id: string }
        Returns: boolean
      }
      auth_is_project_writer: {
        Args: { p_project_id: string }
        Returns: boolean
      }
      calculate_role_performance_score:
        | {
            Args: { p_member_id: string; p_project_id: string }
            Returns: number
          }
        | {
            Args: { p_project_id: string; p_role: string; p_user_id: string }
            Returns: number
          }
      capture_notification_health_snapshot: {
        Args: { p_environment?: string }
        Returns: undefined
      }
      check_bet_invalidations: {
        Args: { p_project_id: string }
        Returns: number
      }
      check_notification_cap: {
        Args: { p_priority: string; p_user_id: string }
        Returns: boolean
      }
      close_cycle_for_pivot: { Args: { p_project_id: string }; Returns: string }
      close_strategic_cycle: {
        Args: { p_close_reason?: string; p_project_id: string }
        Returns: string
      }
      compute_bottleneck_severity: {
        Args: { p_project_id: string }
        Returns: number
      }
      compute_capacity_health: {
        Args: { p_project_id: string }
        Returns: number
      }
      compute_cycle_score: { Args: { p_cycle_id: string }; Returns: number }
      compute_data_completeness: {
        Args: { p_project_id: string }
        Returns: number
      }
      compute_econ_incoherence_penalty: {
        Args: { p_project_id: string }
        Returns: number
      }
      compute_execution_drop: {
        Args: { p_project_id: string }
        Returns: number
      }
      compute_execution_rate: {
        Args: { p_project_id: string }
        Returns: number
      }
      compute_iteration_velocity: {
        Args: { p_project_id: string }
        Returns: number
      }
      compute_optimus_profile: {
        Args: { p_project_id: string; p_user_id: string }
        Returns: undefined
      }
      compute_org_capacity_risk: {
        Args: { p_project_id: string }
        Returns: number
      }
      compute_phase0_score: { Args: { p_project_id: string }; Returns: number }
      compute_phase2_o21: { Args: { p_project_id: string }; Returns: number }
      compute_phase2_o22: { Args: { p_project_id: string }; Returns: number }
      compute_phase2_o23: { Args: { p_project_id: string }; Returns: number }
      compute_phase2_score: { Args: { p_project_id: string }; Returns: number }
      compute_phase3_o31: { Args: { p_project_id: string }; Returns: number }
      compute_phase3_o32: { Args: { p_project_id: string }; Returns: number }
      compute_phase3_o33: { Args: { p_project_id: string }; Returns: number }
      compute_phase3_score: { Args: { p_project_id: string }; Returns: number }
      compute_phase4_o41: { Args: { p_project_id: string }; Returns: number }
      compute_phase4_o42: { Args: { p_project_id: string }; Returns: number }
      compute_phase4_o43: { Args: { p_project_id: string }; Returns: number }
      compute_primary_block: { Args: { p_project_id: string }; Returns: string }
      compute_revenue_concentration: {
        Args: { p_project_id: string }
        Returns: number
      }
      compute_revenue_momentum: {
        Args: { p_project_id: string }
        Returns: number
      }
      compute_role_execution_health: {
        Args: { p_project_id: string }
        Returns: number
      }
      compute_runway_factor: { Args: { p_project_id: string }; Returns: number }
      compute_task_completion_rate: {
        Args: { p_project_id: string }
        Returns: number
      }
      compute_validation_strength: {
        Args: { p_project_id: string }
        Returns: number
      }
      compute_validation_weakness: {
        Args: { p_project_id: string }
        Returns: number
      }
      count_stable_revenue_months: {
        Args: { p_project_id: string }
        Returns: number
      }
      create_notification: {
        Args: {
          p_action_label?: string
          p_action_url?: string
          p_message: string
          p_metadata?: Json
          p_priority: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      decrypt_integration_credential: {
        Args: {
          p_app_secret: string
          p_connection_id: string
          p_credential_key: string
        }
        Returns: string
      }
      detect_meeting_patterns: { Args: { p_project_id: string }; Returns: Json }
      detect_meeting_triggers: { Args: { p_project_id: string }; Returns: Json }
      generate_all_weekly_reviews: { Args: never; Returns: undefined }
      generate_invitation_token: { Args: never; Returns: string }
      generate_weekly_review_for_project: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      get_active_engine_version: { Args: { p_motor: string }; Returns: string }
      get_engine_snapshot: { Args: { p_project_id: string }; Returns: Json }
      get_evidence_audit: { Args: { p_project_id: string }; Returns: Json }
      get_invitation_by_token: { Args: { p_token: string }; Returns: Json }
      get_meeting_fulfillment: { Args: { p_meeting_id: string }; Returns: Json }
      get_optimus_context: {
        Args: { p_project_id: string; p_user_id?: string }
        Returns: Json
      }
      get_optimus_context_with_profile: {
        Args: { p_project_id: string; p_user_id?: string }
        Returns: Json
      }
      get_profile_id: { Args: { _auth_id: string }; Returns: string }
      get_project_owner: { Args: { p_project_id: string }; Returns: string }
      get_project_task_stats: { Args: { p_project_id: string }; Returns: Json }
      get_ritual_optimus_context: {
        Args: { p_next_action?: string; p_project_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_project_active: { Args: { p_project_id: string }; Returns: boolean }
      mark_all_notifications_read: {
        Args: { p_user_id: string }
        Returns: number
      }
      notify_all_project_members: {
        Args: {
          p_action_label?: string
          p_action_url?: string
          p_dedup_days?: number
          p_message: string
          p_metadata?: Json
          p_priority: string
          p_project_id: string
          p_title: string
          p_type: string
        }
        Returns: number
      }
      notify_bottlenecks: { Args: { p_project_id: string }; Returns: undefined }
      notify_expiring_validations: { Args: never; Returns: number }
      notify_inactive_leads: { Args: never; Returns: number }
      notify_inactive_projects: { Args: never; Returns: number }
      notify_overdue_meeting_commitments: { Args: never; Returns: undefined }
      notify_overdue_tasks: { Args: never; Returns: number }
      notify_overdue_tasks_warning: {
        Args: { p_project_id: string; p_user_id: string }
        Returns: undefined
      }
      notify_phase_changes: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      notify_probability_changes: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      notify_risk_changes: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      notify_viability_changes: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      pause_project: { Args: { p_project_id: string }; Returns: undefined }
      refresh_behavioral_block_candidates: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      refresh_bet_invalidations: { Args: never; Returns: undefined }
      remove_project_member: {
        Args: {
          p_member_id: string
          p_project_id: string
          p_reassign_to?: string
        }
        Returns: Json
      }
      restore_project: {
        Args: { p_project_id: string; p_restored_by: string }
        Returns: undefined
      }
      run_coverage_engine: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      run_economic_profile_engine: {
        Args: { p_project_id: string; p_trigger_source?: string }
        Returns: undefined
      }
      run_notification_batch: { Args: never; Returns: undefined }
      run_org_capacity_engine: {
        Args: { p_project_id: string; p_trigger_source?: string }
        Returns: undefined
      }
      run_phase_engine: {
        Args: { p_project_id: string; p_trigger_source?: string }
        Returns: undefined
      }
      run_probability_engine: {
        Args: { p_project_id: string; p_trigger_source?: string }
        Returns: undefined
      }
      run_risk_engine: {
        Args: { p_project_id: string; p_trigger_source?: string }
        Returns: undefined
      }
      run_strategic_cycle_checks: { Args: never; Returns: undefined }
      run_viability_engine: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      search_project_documents: {
        Args: { p_limit?: number; p_project_id: string; p_query: string }
        Returns: {
          document_id: string
          document_name: string
          file_type: string
          matched_content: string
          page_number: number
          relevance_rank: number
          upload_date: string
        }[]
      }
      seed_simulation_data: { Args: { p_owner_id: string }; Returns: Json }
      soft_delete_project: {
        Args: { p_deleted_by: string; p_project_id: string; p_reason?: string }
        Returns: undefined
      }
      submit_strategic_reset: {
        Args: { p_project_id: string; p_ritual_responses: Json }
        Returns: string
      }
      suggest_bottleneck_challenge: {
        Args: { p_project_id: string }
        Returns: Json
      }
      unpause_project: { Args: { p_project_id: string }; Returns: undefined }
      update_all_optimus_profiles: { Args: never; Returns: undefined }
      update_member_performance_scores: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      upsert_integration_credential: {
        Args: {
          p_app_secret: string
          p_connection_id: string
          p_credential_key: string
          p_credential_plaintext: string
          p_project_id: string
          p_provider: string
        }
        Returns: undefined
      }
      upsert_obv_participants: {
        Args: { p_obv_id: string; p_participants: Json }
        Returns: undefined
      }
      upsert_recurring_blocker_as_strategic_block: {
        Args: {
          p_description: string
          p_first_seen_at: string
          p_project_id: string
        }
        Returns: string
      }
      write_integration_to_engine_table: {
        Args: {
          p_agent_type: string
          p_confidence: number
          p_entity_ids: string[]
          p_insight_id: string
          p_logical_period: string
          p_operation: string
          p_payload: Json
          p_payload_hash: string
          p_project_id: string
          p_source_timestamp: string
          p_sync_run_id: string
          p_target: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "tlt" | "member"
      founder_tool_type:
        | "buyer_persona"
        | "lead_scoring"
        | "sales_playbook"
        | "brand_kit"
        | "comms_guide"
        | "customer_journey"
      kpi_status: "pending" | "validated" | "rejected"
      lead_status:
        | "frio"
        | "tibio"
        | "hot"
        | "propuesta"
        | "negociacion"
        | "cerrado_ganado"
        | "cerrado_perdido"
      obv_type:
        | "exploracion"
        | "validacion"
        | "venta"
        | "product_validation"
        | "operational_system"
        | "customer_discovery"
        | "revenue_validation"
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
      task_status: "todo" | "doing" | "done" | "blocked" | "done_historical"
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
      founder_tool_type: [
        "buyer_persona",
        "lead_scoring",
        "sales_playbook",
        "brand_kit",
        "comms_guide",
        "customer_journey",
      ],
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
      obv_type: [
        "exploracion",
        "validacion",
        "venta",
        "product_validation",
        "operational_system",
        "customer_discovery",
        "revenue_validation",
      ],
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
      task_status: ["todo", "doing", "done", "blocked", "done_historical"],
    },
  },
} as const
