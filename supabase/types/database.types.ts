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
      analytics_events: {
        Row: {
          actor_user_id: string
          client_event_id: string
          created_at: string
          event_key: string
          id: string
          occurred_at: string
          organization_id: string
          page_key: string | null
        }
        Insert: {
          actor_user_id: string
          client_event_id: string
          created_at?: string
          event_key: string
          id?: string
          occurred_at?: string
          organization_id: string
          page_key?: string | null
        }
        Update: {
          actor_user_id?: string
          client_event_id?: string
          created_at?: string
          event_key?: string
          id?: string
          occurred_at?: string
          organization_id?: string
          page_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          published_at: string | null
          status: Database["public"]["Enums"]["nexus_content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["nexus_content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["nexus_content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string
          id: number
          organization_id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type: string
          id?: never
          organization_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string
          id?: never
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_account_memberships: {
        Row: {
          added_at: string
          client_account_id: string
          contact_type: string
          is_active: boolean
          job_title: string | null
          organization_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          client_account_id: string
          contact_type?: string
          is_active?: boolean
          job_title?: string | null
          organization_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          client_account_id?: string
          contact_type?: string
          is_active?: boolean
          job_title?: string | null
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_account_memberships_organization_id_client_account__fkey"
            columns: ["organization_id", "client_account_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "client_account_memberships_organization_id_user_id_fkey"
            columns: ["organization_id", "user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
        ]
      }
      client_accounts: {
        Row: {
          account_name: string
          client_code: string
          created_at: string
          created_by: string | null
          id: string
          notes: string
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          account_name: string
          client_code: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          account_name?: string
          client_code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      company_decisions: {
        Row: {
          context: string
          created_at: string
          created_by: string
          decided_at: string
          decision_status: string
          decision_text: string
          department_id: string | null
          id: string
          organization_id: string
          rationale: string
          title: string
        }
        Insert: {
          context?: string
          created_at?: string
          created_by: string
          decided_at?: string
          decision_status?: string
          decision_text: string
          department_id?: string | null
          id?: string
          organization_id: string
          rationale?: string
          title: string
        }
        Update: {
          context?: string
          created_at?: string
          created_by?: string
          decided_at?: string
          decision_status?: string
          decision_text?: string
          department_id?: string | null
          id?: string
          organization_id?: string
          rationale?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_decisions_organization_id_department_id_fkey"
            columns: ["organization_id", "department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "company_decisions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      company_key_results: {
        Row: {
          confidence_percent: number
          created_at: string
          created_by: string
          current_value: number
          id: string
          measurement_source: string
          objective_id: string
          organization_id: string
          source_metric_key: string | null
          target_value: number
          title: string
          unit: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          confidence_percent?: number
          created_at?: string
          created_by: string
          current_value?: number
          id?: string
          measurement_source?: string
          objective_id: string
          organization_id: string
          source_metric_key?: string | null
          target_value: number
          title: string
          unit?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          confidence_percent?: number
          created_at?: string
          created_by?: string
          current_value?: number
          id?: string
          measurement_source?: string
          objective_id?: string
          organization_id?: string
          source_metric_key?: string | null
          target_value?: number
          title?: string
          unit?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_key_results_organization_id_objective_id_fkey"
            columns: ["organization_id", "objective_id"]
            isOneToOne: false
            referencedRelation: "company_objectives"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "company_key_results_organization_id_objective_id_fkey"
            columns: ["organization_id", "objective_id"]
            isOneToOne: false
            referencedRelation: "nexus_command_center_objectives"
            referencedColumns: ["organization_id", "objective_id"]
          },
        ]
      }
      company_objectives: {
        Row: {
          created_at: string
          created_by: string
          description: string
          id: string
          objective_status: string
          organization_id: string
          owner_user_id: string | null
          period_end: string
          period_start: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string
          id?: string
          objective_status?: string
          organization_id: string
          owner_user_id?: string | null
          period_end: string
          period_start: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          objective_status?: string
          organization_id?: string
          owner_user_id?: string | null
          period_end?: string
          period_start?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_objectives_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_objectives_organization_id_owner_user_id_fkey"
            columns: ["organization_id", "owner_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          name: string
          organization_id: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          name: string
          organization_id: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_accounts: {
        Row: {
          account_code: string
          account_type: string
          created_at: string
          created_by: string | null
          currency_code: string
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          normal_balance: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          account_code: string
          account_type: string
          created_at?: string
          created_by?: string | null
          currency_code?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          normal_balance: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          account_code?: string
          account_type?: string
          created_at?: string
          created_by?: string | null
          currency_code?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          normal_balance?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_budgets: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          created_by: string
          currency_code: string
          id: string
          name: string
          notes: string | null
          organization_id: string
          period_end: string
          period_start: string
          status: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string
          created_by: string
          currency_code?: string
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          period_end: string
          period_start: string
          status?: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string
          created_by?: string
          currency_code?: string
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          period_end?: string
          period_start?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_budgets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budgets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "nexus_finance_account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budgets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_journal_entries: {
        Row: {
          created_at: string
          created_by: string
          currency_code: string
          description: string
          entry_date: string
          id: string
          organization_id: string
          posted_at: string | null
          posted_by: string | null
          reference: string | null
          source: string
          status: string
          updated_at: string
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          currency_code?: string
          description: string
          entry_date: string
          id?: string
          organization_id: string
          posted_at?: string | null
          posted_by?: string | null
          reference?: string | null
          source?: string
          status?: string
          updated_at?: string
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          currency_code?: string
          description?: string
          entry_date?: string
          id?: string
          organization_id?: string
          posted_at?: string | null
          posted_by?: string | null
          reference?: string | null
          source?: string
          status?: string
          updated_at?: string
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_journal_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_journal_lines: {
        Row: {
          account_id: string
          created_at: string
          credit: number
          debit: number
          id: string
          journal_entry_id: string
          line_number: number
          memo: string | null
          organization_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          credit?: number
          debit?: number
          id?: string
          journal_entry_id: string
          line_number: number
          memo?: string | null
          organization_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          credit?: number
          debit?: number
          id?: string
          journal_entry_id?: string
          line_number?: number
          memo?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "nexus_finance_account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_journal_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "finance_journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_journal_lines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_access: {
        Row: {
          granted_at: string
          granted_by: string | null
          organization_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          organization_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          organization_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_access_organization_id_user_id_fkey"
            columns: ["organization_id", "user_id"]
            isOneToOne: true
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
        ]
      }
      investor_updates: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          published_at: string | null
          status: Database["public"]["Enums"]["nexus_content_status"]
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["nexus_content_status"]
          summary?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["nexus_content_status"]
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_updates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      member_invitations: {
        Row: {
          accepted_at: string | null
          accepted_user_id: string | null
          cancelled_at: string | null
          client_account_id: string | null
          contact_type: string
          created_at: string
          created_by: string
          department_id: string | null
          email: string
          expires_at: string
          failure_code: string | null
          full_name: string | null
          id: string
          invited_auth_user_id: string | null
          job_title: string | null
          organization_id: string
          role: Database["public"]["Enums"]["workspace_role"]
          sent_at: string | null
          status: string
          team_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          cancelled_at?: string | null
          client_account_id?: string | null
          contact_type?: string
          created_at?: string
          created_by: string
          department_id?: string | null
          email: string
          expires_at?: string
          failure_code?: string | null
          full_name?: string | null
          id?: string
          invited_auth_user_id?: string | null
          job_title?: string | null
          organization_id: string
          role: Database["public"]["Enums"]["workspace_role"]
          sent_at?: string | null
          status?: string
          team_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          cancelled_at?: string | null
          client_account_id?: string | null
          contact_type?: string
          created_at?: string
          created_by?: string
          department_id?: string | null
          email?: string
          expires_at?: string
          failure_code?: string | null
          full_name?: string | null
          id?: string
          invited_auth_user_id?: string | null
          job_title?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          sent_at?: string | null
          status?: string
          team_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_invitations_organization_id_client_account_id_fkey"
            columns: ["organization_id", "client_account_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "member_invitations_organization_id_department_id_fkey"
            columns: ["organization_id", "department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "member_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_invitations_organization_id_team_id_department_id_fkey"
            columns: ["organization_id", "team_id", "department_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["organization_id", "id", "department_id"]
          },
        ]
      }
      nexus_ai_conversations: {
        Row: {
          assistant_mode: string
          created_at: string
          id: string
          last_message_at: string | null
          organization_id: string
          owner_user_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assistant_mode?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          organization_id: string
          owner_user_id: string
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          assistant_mode?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          organization_id?: string
          owner_user_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexus_ai_conversations_membership_fk"
            columns: ["organization_id", "owner_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
        ]
      }
      nexus_ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          input_tokens: number
          model: string | null
          organization_id: string
          output_tokens: number
          owner_user_id: string
          role: string
          tool_names: string[]
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          input_tokens?: number
          model?: string | null
          organization_id: string
          output_tokens?: number
          owner_user_id: string
          role: string
          tool_names?: string[]
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          input_tokens?: number
          model?: string | null
          organization_id?: string
          output_tokens?: number
          owner_user_id?: string
          role?: string
          tool_names?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "nexus_ai_messages_conversation_fk"
            columns: ["conversation_id", "organization_id", "owner_user_id"]
            isOneToOne: false
            referencedRelation: "nexus_ai_conversations"
            referencedColumns: ["id", "organization_id", "owner_user_id"]
          },
        ]
      }
      nexus_ai_settings: {
        Row: {
          created_at: string
          daily_output_token_limit: number
          daily_request_limit: number
          input_cost_per_million_usd: number
          is_enabled: boolean
          max_history_messages: number
          max_input_characters: number
          max_input_tokens_per_request: number
          max_output_tokens_per_request: number
          max_response_characters: number
          monthly_budget_usd: number
          organization_id: string
          output_cost_per_million_usd: number
          provider_free_tier_consent: boolean
          provider_model: string
          provider_paid_tier_confirmed: boolean
          provider_privacy_confirmed_at: string | null
          requests_per_five_minutes: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          daily_output_token_limit?: number
          daily_request_limit?: number
          input_cost_per_million_usd?: number
          is_enabled?: boolean
          max_history_messages?: number
          max_input_characters?: number
          max_input_tokens_per_request?: number
          max_output_tokens_per_request?: number
          max_response_characters?: number
          monthly_budget_usd?: number
          organization_id: string
          output_cost_per_million_usd?: number
          provider_free_tier_consent?: boolean
          provider_model?: string
          provider_paid_tier_confirmed?: boolean
          provider_privacy_confirmed_at?: string | null
          requests_per_five_minutes?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          daily_output_token_limit?: number
          daily_request_limit?: number
          input_cost_per_million_usd?: number
          is_enabled?: boolean
          max_history_messages?: number
          max_input_characters?: number
          max_input_tokens_per_request?: number
          max_output_tokens_per_request?: number
          max_response_characters?: number
          monthly_budget_usd?: number
          organization_id?: string
          output_cost_per_million_usd?: number
          provider_free_tier_consent?: boolean
          provider_model?: string
          provider_paid_tier_confirmed?: boolean
          provider_privacy_confirmed_at?: string | null
          requests_per_five_minutes?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nexus_ai_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      nexus_ai_usage_events: {
        Row: {
          actual_cost_usd: number
          completed_at: string | null
          conversation_id: string | null
          created_at: string
          failure_code: string | null
          id: string
          input_tokens: number
          model: string
          organization_id: string
          output_tokens: number
          request_id: string
          reserved_cost_usd: number
          reserved_input_tokens: number
          reserved_output_tokens: number
          reserved_until: string | null
          status: string
          user_id: string
        }
        Insert: {
          actual_cost_usd?: number
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          failure_code?: string | null
          id?: string
          input_tokens?: number
          model: string
          organization_id: string
          output_tokens?: number
          request_id: string
          reserved_cost_usd?: number
          reserved_input_tokens?: number
          reserved_output_tokens?: number
          reserved_until?: string | null
          status: string
          user_id: string
        }
        Update: {
          actual_cost_usd?: number
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          failure_code?: string | null
          id?: string
          input_tokens?: number
          model?: string
          organization_id?: string
          output_tokens?: number
          request_id?: string
          reserved_cost_usd?: number
          reserved_input_tokens?: number
          reserved_output_tokens?: number
          reserved_until?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexus_ai_usage_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "nexus_ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexus_ai_usage_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      nexus_channel_members: {
        Row: {
          added_at: string
          added_by: string | null
          channel_id: string
          member_role: string
          organization_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          channel_id: string
          member_role?: string
          organization_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          channel_id?: string
          member_role?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexus_channel_members_organization_id_channel_id_fkey"
            columns: ["organization_id", "channel_id"]
            isOneToOne: false
            referencedRelation: "nexus_channels"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "nexus_channel_members_organization_id_user_id_fkey"
            columns: ["organization_id", "user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
        ]
      }
      nexus_channel_messages: {
        Row: {
          body: string
          channel_id: string
          created_at: string
          hidden_at: string | null
          hidden_by: string | null
          id: string
          is_hidden: boolean
          moderation_reason: string | null
          organization_id: string
          sender_user_id: string
        }
        Insert: {
          body: string
          channel_id: string
          created_at?: string
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          is_hidden?: boolean
          moderation_reason?: string | null
          organization_id: string
          sender_user_id: string
        }
        Update: {
          body?: string
          channel_id?: string
          created_at?: string
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          is_hidden?: boolean
          moderation_reason?: string | null
          organization_id?: string
          sender_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexus_channel_messages_organization_id_channel_id_fkey"
            columns: ["organization_id", "channel_id"]
            isOneToOne: false
            referencedRelation: "nexus_channels"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      nexus_channels: {
        Row: {
          channel_scope: string
          created_at: string
          created_by: string
          description: string
          id: string
          is_private: boolean
          name: string
          organization_id: string
          project_id: string | null
          slug: string
          team_id: string | null
          updated_at: string
        }
        Insert: {
          channel_scope: string
          created_at?: string
          created_by: string
          description?: string
          id?: string
          is_private?: boolean
          name: string
          organization_id: string
          project_id?: string | null
          slug: string
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          channel_scope?: string
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          is_private?: boolean
          name?: string
          organization_id?: string
          project_id?: string | null
          slug?: string
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexus_channels_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexus_channels_organization_id_project_id_fkey"
            columns: ["organization_id", "project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "nexus_channels_organization_id_team_id_fkey"
            columns: ["organization_id", "team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      nexus_direct_conversations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          organization_id: string
          participant_high: string
          participant_low: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          organization_id: string
          participant_high: string
          participant_low: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string
          participant_high?: string
          participant_low?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexus_direct_conversations_organization_id_participant_hig_fkey"
            columns: ["organization_id", "participant_high"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
          {
            foreignKeyName: "nexus_direct_conversations_organization_id_participant_low_fkey"
            columns: ["organization_id", "participant_low"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
        ]
      }
      nexus_direct_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          organization_id: string
          sender_user_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          organization_id: string
          sender_user_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          sender_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexus_direct_messages_organization_id_conversation_id_fkey"
            columns: ["organization_id", "conversation_id"]
            isOneToOne: false
            referencedRelation: "nexus_direct_conversations"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      nexus_notification_delivery_settings: {
        Row: {
          created_at: string
          is_enabled: boolean
          last_test_status: string | null
          last_tested_at: string | null
          organization_id: string
          provider: string
          sender_email: string | null
          sender_name: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          is_enabled?: boolean
          last_test_status?: string | null
          last_tested_at?: string | null
          organization_id: string
          provider?: string
          sender_email?: string | null
          sender_name?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          is_enabled?: boolean
          last_test_status?: string | null
          last_tested_at?: string | null
          organization_id?: string
          provider?: string
          sender_email?: string | null
          sender_name?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nexus_notification_delivery_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      nexus_notification_preferences: {
        Row: {
          digest_frequency: string
          email_enabled: boolean
          in_app_enabled: boolean
          organization_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          digest_frequency?: string
          email_enabled?: boolean
          in_app_enabled?: boolean
          organization_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          digest_frequency?: string
          email_enabled?: boolean
          in_app_enabled?: boolean
          organization_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexus_notification_preferences_organization_id_user_id_fkey"
            columns: ["organization_id", "user_id"]
            isOneToOne: true
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
        ]
      }
      nexus_notifications: {
        Row: {
          body: string
          created_at: string
          destination_path: string | null
          id: string
          notification_type: string
          organization_id: string
          read_at: string | null
          recipient_user_id: string
          source_entity_id: string | null
          source_entity_type: string | null
          title: string
        }
        Insert: {
          body?: string
          created_at?: string
          destination_path?: string | null
          id?: string
          notification_type: string
          organization_id: string
          read_at?: string | null
          recipient_user_id: string
          source_entity_id?: string | null
          source_entity_type?: string | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          destination_path?: string | null
          id?: string
          notification_type?: string
          organization_id?: string
          read_at?: string | null
          recipient_user_id?: string
          source_entity_id?: string | null
          source_entity_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexus_notifications_organization_id_recipient_user_id_fkey"
            columns: ["organization_id", "recipient_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
        ]
      }
      organization_member_details: {
        Row: {
          bio: string
          created_at: string
          created_by: string | null
          department_id: string | null
          employment_status: string
          employment_type: string
          job_title: string | null
          organization_id: string
          start_date: string | null
          team_id: string | null
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          bio?: string
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          employment_status?: string
          employment_type?: string
          job_title?: string | null
          organization_id: string
          start_date?: string | null
          team_id?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          bio?: string
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          employment_status?: string
          employment_type?: string
          job_title?: string | null
          organization_id?: string
          start_date?: string | null
          team_id?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_member_details_organization_id_department_id_fkey"
            columns: ["organization_id", "department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "organization_member_details_organization_id_team_id_depart_fkey"
            columns: ["organization_id", "team_id", "department_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["organization_id", "id", "department_id"]
          },
          {
            foreignKeyName: "organization_member_details_organization_id_user_id_fkey"
            columns: ["organization_id", "user_id"]
            isOneToOne: true
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
        ]
      }
      organization_memberships: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          organization_id: string
          role: Database["public"]["Enums"]["workspace_role"]
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["workspace_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_team_members: {
        Row: {
          added_at: string
          added_by: string | null
          organization_id: string
          team_id: string
          team_role: string
          user_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          organization_id: string
          team_id: string
          team_role?: string
          user_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          organization_id?: string
          team_id?: string
          team_role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_team_members_organization_id_team_id_fkey"
            columns: ["organization_id", "team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "organization_team_members_organization_id_user_id_fkey"
            columns: ["organization_id", "user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string
          description: string
          label: string
          permission_key: string
          section: string
        }
        Insert: {
          created_at?: string
          description: string
          label: string
          permission_key: string
          section: string
        }
        Update: {
          created_at?: string
          description?: string
          label?: string
          permission_key?: string
          section?: string
        }
        Relationships: []
      }
      product_integrations: {
        Row: {
          created_at: string
          created_by: string | null
          credential_location: string
          display_name: string
          id: string
          integration_key: string
          last_error_code: string | null
          last_successful_sync_at: string | null
          last_test_status: string
          last_tested_at: string | null
          organization_id: string
          platform: string
          product_id: string
          state: Database["public"]["Enums"]["nexus_integration_state"]
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          credential_location?: string
          display_name: string
          id?: string
          integration_key: string
          last_error_code?: string | null
          last_successful_sync_at?: string | null
          last_test_status?: string
          last_tested_at?: string | null
          organization_id: string
          platform: string
          product_id: string
          state?: Database["public"]["Enums"]["nexus_integration_state"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          credential_location?: string
          display_name?: string
          id?: string
          integration_key?: string
          last_error_code?: string | null
          last_successful_sync_at?: string | null
          last_test_status?: string
          last_tested_at?: string | null
          organization_id?: string
          platform?: string
          product_id?: string
          state?: Database["public"]["Enums"]["nexus_integration_state"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_integrations_organization_id_product_id_fkey"
            columns: ["organization_id", "product_id"]
            isOneToOne: false
            referencedRelation: "nexus_command_center_products"
            referencedColumns: ["organization_id", "product_id"]
          },
          {
            foreignKeyName: "product_integrations_organization_id_product_id_fkey"
            columns: ["organization_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      product_metric_definitions: {
        Row: {
          aggregation: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          metric_key: string
          metric_label: string
          organization_id: string
          privacy_class: string
          product_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          aggregation?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          metric_key: string
          metric_label: string
          organization_id: string
          privacy_class?: string
          product_id: string
          unit?: string
          updated_at?: string
        }
        Update: {
          aggregation?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          metric_key?: string
          metric_label?: string
          organization_id?: string
          privacy_class?: string
          product_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_metric_definitions_organization_id_product_id_fkey"
            columns: ["organization_id", "product_id"]
            isOneToOne: false
            referencedRelation: "nexus_command_center_products"
            referencedColumns: ["organization_id", "product_id"]
          },
          {
            foreignKeyName: "product_metric_definitions_organization_id_product_id_fkey"
            columns: ["organization_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      product_metric_ingestion_runs: {
        Row: {
          error_code: string | null
          finished_at: string | null
          id: string
          idempotency_key: string
          integration_id: string
          metrics_accepted: number
          metrics_received: number
          metrics_rejected: number
          organization_id: string
          payload_sha256: string | null
          product_id: string
          run_status: string
          started_at: string
        }
        Insert: {
          error_code?: string | null
          finished_at?: string | null
          id?: string
          idempotency_key: string
          integration_id: string
          metrics_accepted?: number
          metrics_received?: number
          metrics_rejected?: number
          organization_id: string
          payload_sha256?: string | null
          product_id: string
          run_status?: string
          started_at?: string
        }
        Update: {
          error_code?: string | null
          finished_at?: string | null
          id?: string
          idempotency_key?: string
          integration_id?: string
          metrics_accepted?: number
          metrics_received?: number
          metrics_rejected?: number
          organization_id?: string
          payload_sha256?: string | null
          product_id?: string
          run_status?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_metric_ingestion_runs_organization_id_product_id_i_fkey"
            columns: ["organization_id", "product_id", "integration_id"]
            isOneToOne: false
            referencedRelation: "product_integrations"
            referencedColumns: ["organization_id", "product_id", "id"]
          },
        ]
      }
      product_metric_sync_events: {
        Row: {
          created_at: string
          event_code: string
          id: number
          organization_id: string
          product_id: string
          run_id: string
          safe_message: string
        }
        Insert: {
          created_at?: string
          event_code: string
          id?: never
          organization_id: string
          product_id: string
          run_id: string
          safe_message?: string
        }
        Update: {
          created_at?: string
          event_code?: string
          id?: never
          organization_id?: string
          product_id?: string
          run_id?: string
          safe_message?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_metric_sync_events_organization_id_product_id_run__fkey"
            columns: ["organization_id", "product_id", "run_id"]
            isOneToOne: false
            referencedRelation: "product_metric_ingestion_runs"
            referencedColumns: ["organization_id", "product_id", "id"]
          },
        ]
      }
      product_metrics: {
        Row: {
          created_at: string
          id: string
          metric_key: string
          metric_label: string
          metric_value: number
          observed_at: string
          organization_id: string
          period_end: string | null
          period_start: string | null
          product_id: string
          recorded_by: string | null
          source: Database["public"]["Enums"]["nexus_metric_source"]
          source_reference: string | null
          unit: string
          verification: Database["public"]["Enums"]["nexus_metric_verification"]
        }
        Insert: {
          created_at?: string
          id?: string
          metric_key: string
          metric_label: string
          metric_value: number
          observed_at?: string
          organization_id: string
          period_end?: string | null
          period_start?: string | null
          product_id: string
          recorded_by?: string | null
          source: Database["public"]["Enums"]["nexus_metric_source"]
          source_reference?: string | null
          unit?: string
          verification?: Database["public"]["Enums"]["nexus_metric_verification"]
        }
        Update: {
          created_at?: string
          id?: string
          metric_key?: string
          metric_label?: string
          metric_value?: number
          observed_at?: string
          organization_id?: string
          period_end?: string | null
          period_start?: string | null
          product_id?: string
          recorded_by?: string | null
          source?: Database["public"]["Enums"]["nexus_metric_source"]
          source_reference?: string | null
          unit?: string
          verification?: Database["public"]["Enums"]["nexus_metric_verification"]
        }
        Relationships: [
          {
            foreignKeyName: "product_metrics_org_product_fk"
            columns: ["organization_id", "product_id"]
            isOneToOne: false
            referencedRelation: "nexus_command_center_products"
            referencedColumns: ["organization_id", "product_id"]
          },
          {
            foreignKeyName: "product_metrics_org_product_fk"
            columns: ["organization_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "product_metrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "nexus_command_center_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_metrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_releases: {
        Row: {
          created_at: string
          created_by: string
          id: string
          organization_id: string
          product_id: string
          release_notes: string
          release_status: string
          released_at: string | null
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          organization_id: string
          product_id: string
          release_notes?: string
          release_status?: string
          released_at?: string | null
          title: string
          updated_at?: string
          version: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string
          product_id?: string
          release_notes?: string
          release_status?: string
          released_at?: string | null
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_releases_organization_id_product_id_fkey"
            columns: ["organization_id", "product_id"]
            isOneToOne: false
            referencedRelation: "nexus_command_center_products"
            referencedColumns: ["organization_id", "product_id"]
          },
          {
            foreignKeyName: "product_releases_organization_id_product_id_fkey"
            columns: ["organization_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          created_by: string | null
          current_version: string | null
          id: string
          name: string
          organization_id: string
          roadmap_summary: string | null
          slug: string
          status: Database["public"]["Enums"]["nexus_product_status"]
          summary: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_version?: string | null
          id?: string
          name: string
          organization_id: string
          roadmap_summary?: string | null
          slug: string
          status?: Database["public"]["Enums"]["nexus_product_status"]
          summary?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_version?: string | null
          id?: string
          name?: string
          organization_id?: string
          roadmap_summary?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["nexus_product_status"]
          summary?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_decisions: {
        Row: {
          context: string
          created_at: string
          created_by: string
          decided_at: string
          decision_status: string
          decision_text: string
          id: string
          organization_id: string
          project_id: string
          rationale: string
          title: string
        }
        Insert: {
          context?: string
          created_at?: string
          created_by: string
          decided_at?: string
          decision_status?: string
          decision_text: string
          id?: string
          organization_id: string
          project_id: string
          rationale?: string
          title: string
        }
        Update: {
          context?: string
          created_at?: string
          created_by?: string
          decided_at?: string
          decision_status?: string
          decision_text?: string
          id?: string
          organization_id?: string
          project_id?: string
          rationale?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_decisions_organization_id_project_id_fkey"
            columns: ["organization_id", "project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      project_documents: {
        Row: {
          checksum_sha256: string | null
          client_visible: boolean
          content_type: string
          created_at: string
          document_status: string
          file_name: string
          file_size_bytes: number | null
          id: string
          organization_id: string
          project_id: string
          storage_bucket: string
          storage_key: string
          storage_provider: string
          uploaded_by: string
        }
        Insert: {
          checksum_sha256?: string | null
          client_visible?: boolean
          content_type?: string
          created_at?: string
          document_status?: string
          file_name: string
          file_size_bytes?: number | null
          id?: string
          organization_id: string
          project_id: string
          storage_bucket: string
          storage_key: string
          storage_provider: string
          uploaded_by: string
        }
        Update: {
          checksum_sha256?: string | null
          client_visible?: boolean
          content_type?: string
          created_at?: string
          document_status?: string
          file_name?: string
          file_size_bytes?: number | null
          id?: string
          organization_id?: string
          project_id?: string
          storage_bucket?: string
          storage_key?: string
          storage_provider?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_organization_id_project_id_fkey"
            columns: ["organization_id", "project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      project_members: {
        Row: {
          added_at: string
          added_by: string | null
          organization_id: string
          project_id: string
          project_role: string
          user_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          organization_id: string
          project_id: string
          project_role?: string
          user_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          organization_id?: string
          project_id?: string
          project_role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_organization_id_project_id_fkey"
            columns: ["organization_id", "project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "project_members_organization_id_user_id_fkey"
            columns: ["organization_id", "user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string
          due_date: string | null
          id: string
          organization_id: string
          project_id: string
          sort_order: number
          status: Database["public"]["Enums"]["nexus_milestone_status"]
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string | null
          id?: string
          organization_id: string
          project_id: string
          sort_order?: number
          status?: Database["public"]["Enums"]["nexus_milestone_status"]
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string | null
          id?: string
          organization_id?: string
          project_id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["nexus_milestone_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_organization_id_project_id_fkey"
            columns: ["organization_id", "project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_task_comments: {
        Row: {
          body: string
          created_at: string
          created_by: string
          id: string
          organization_id: string
          project_id: string
          task_id: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by: string
          id?: string
          organization_id: string
          project_id: string
          task_id: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string
          project_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_task_comments_organization_id_project_id_fkey"
            columns: ["organization_id", "project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "project_task_comments_organization_id_project_id_task_id_fkey"
            columns: ["organization_id", "project_id", "task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["organization_id", "project_id", "id"]
          },
        ]
      }
      projects: {
        Row: {
          client_account_id: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          name: string
          organization_id: string
          progress_percent: number
          slug: string
          start_date: string | null
          status: Database["public"]["Enums"]["nexus_project_status"]
          target_date: string | null
          updated_at: string
        }
        Insert: {
          client_account_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          name: string
          organization_id: string
          progress_percent?: number
          slug: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["nexus_project_status"]
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          client_account_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          name?: string
          organization_id?: string
          progress_percent?: number
          slug?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["nexus_project_status"]
          target_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_client_account_id_fkey"
            columns: ["organization_id", "client_account_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          is_allowed: boolean
          permission_key: string
          role: Database["public"]["Enums"]["workspace_role"]
          updated_at: string
        }
        Insert: {
          is_allowed?: boolean
          permission_key: string
          role: Database["public"]["Enums"]["workspace_role"]
          updated_at?: string
        }
        Update: {
          is_allowed?: boolean
          permission_key?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["permission_key"]
          },
        ]
      }
      service_components: {
        Row: {
          component_key: string
          component_status: string
          created_at: string
          description: string
          display_name: string
          id: string
          last_checked_at: string | null
          monitoring_source: string | null
          organization_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          component_key: string
          component_status?: string
          created_at?: string
          description?: string
          display_name: string
          id?: string
          last_checked_at?: string | null
          monitoring_source?: string | null
          organization_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          component_key?: string
          component_status?: string
          created_at?: string
          description?: string
          display_name?: string
          id?: string
          last_checked_at?: string | null
          monitoring_source?: string | null
          organization_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_components_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_health_checks: {
        Row: {
          check_status: string
          checked_at: string
          component_id: string
          id: string
          latency_ms: number | null
          monitoring_source: string
          organization_id: string
          safe_detail: string
        }
        Insert: {
          check_status: string
          checked_at?: string
          component_id: string
          id?: string
          latency_ms?: number | null
          monitoring_source: string
          organization_id: string
          safe_detail?: string
        }
        Update: {
          check_status?: string
          checked_at?: string
          component_id?: string
          id?: string
          latency_ms?: number | null
          monitoring_source?: string
          organization_id?: string
          safe_detail?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_health_checks_organization_id_component_id_fkey"
            columns: ["organization_id", "component_id"]
            isOneToOne: false
            referencedRelation: "service_components"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      service_incidents: {
        Row: {
          component_id: string | null
          created_at: string
          created_by: string
          id: string
          impact: string
          incident_status: string
          organization_id: string
          resolved_at: string | null
          started_at: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          component_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          impact?: string
          incident_status?: string
          organization_id: string
          resolved_at?: string | null
          started_at?: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          component_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          impact?: string
          incident_status?: string
          organization_id?: string
          resolved_at?: string | null
          started_at?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_incidents_organization_id_component_id_fkey"
            columns: ["organization_id", "component_id"]
            isOneToOne: false
            referencedRelation: "service_components"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "service_incidents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      task_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: number
          new_status: Database["public"]["Enums"]["nexus_task_status"]
          old_status: Database["public"]["Enums"]["nexus_task_status"] | null
          organization_id: string
          project_id: string
          task_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: never
          new_status: Database["public"]["Enums"]["nexus_task_status"]
          old_status?: Database["public"]["Enums"]["nexus_task_status"] | null
          organization_id: string
          project_id: string
          task_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: never
          new_status?: Database["public"]["Enums"]["nexus_task_status"]
          old_status?: Database["public"]["Enums"]["nexus_task_status"] | null
          organization_id?: string
          project_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_status_history_organization_id_project_id_fkey"
            columns: ["organization_id", "project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "task_status_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string
          due_at: string | null
          id: string
          organization_id: string
          priority: Database["public"]["Enums"]["nexus_task_priority"]
          project_id: string
          sort_order: number
          status: Database["public"]["Enums"]["nexus_task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          due_at?: string | null
          id?: string
          organization_id: string
          priority?: Database["public"]["Enums"]["nexus_task_priority"]
          project_id: string
          sort_order?: number
          status?: Database["public"]["Enums"]["nexus_task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          due_at?: string | null
          id?: string
          organization_id?: string
          priority?: Database["public"]["Enums"]["nexus_task_priority"]
          project_id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["nexus_task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_organization_id_project_id_fkey"
            columns: ["organization_id", "project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["organization_id", "id"]
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
      teams: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          department_id: string
          description: string
          id: string
          name: string
          organization_id: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          department_id: string
          description?: string
          id?: string
          name: string
          organization_id: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          department_id?: string
          description?: string
          id?: string
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_department_id_fkey"
            columns: ["organization_id", "department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_allowed: boolean
          organization_id: string
          permission_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_allowed: boolean
          organization_id: string
          permission_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_allowed?: boolean
          organization_id?: string
          permission_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_membership_fk"
            columns: ["organization_id", "user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
          {
            foreignKeyName: "user_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["permission_key"]
          },
        ]
      }
      weekly_company_summaries: {
        Row: {
          blockers: Json
          created_at: string
          created_by: string
          highlights: Json
          id: string
          organization_id: string
          published_at: string | null
          published_by: string | null
          summary_markdown: string
          summary_status: string
          updated_at: string
          week_end: string
          week_start: string
        }
        Insert: {
          blockers?: Json
          created_at?: string
          created_by: string
          highlights?: Json
          id?: string
          organization_id: string
          published_at?: string | null
          published_by?: string | null
          summary_markdown?: string
          summary_status?: string
          updated_at?: string
          week_end: string
          week_start: string
        }
        Update: {
          blockers?: Json
          created_at?: string
          created_by?: string
          highlights?: Json
          id?: string
          organization_id?: string
          published_at?: string | null
          published_by?: string | null
          summary_markdown?: string
          summary_status?: string
          updated_at?: string
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_company_summaries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      nexus_command_center_objectives: {
        Row: {
          calculated_progress_percent: number | null
          key_result_count: number | null
          objective_id: string | null
          objective_status: string | null
          organization_id: string | null
          period_end: string | null
          period_start: string | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_objectives_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      nexus_command_center_products: {
        Row: {
          current_version: string | null
          metric_key: string | null
          metric_label: string | null
          metric_observed_at: string | null
          metric_value: number | null
          name: string | null
          organization_id: string | null
          product_id: string | null
          slug: string | null
          status: Database["public"]["Enums"]["nexus_product_status"] | null
          unit: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      nexus_command_center_project_summary: {
        Row: {
          average_progress_percent: number | null
          organization_id: string | null
          project_count: number | null
          status: Database["public"]["Enums"]["nexus_project_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      nexus_command_center_service_status: {
        Row: {
          component_key: string | null
          component_status: string | null
          display_name: string | null
          last_checked_at: string | null
          latest_latency_ms: number | null
          latest_monitoring_source: string | null
          open_incident_count: number | null
          organization_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_components_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      nexus_command_center_task_summary: {
        Row: {
          organization_id: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["nexus_task_status"] | null
          task_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_organization_id_project_id_fkey"
            columns: ["organization_id", "project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["organization_id", "id"]
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
      nexus_finance_account_balances: {
        Row: {
          account_code: string | null
          account_type: string | null
          currency_code: string | null
          current_balance: number | null
          id: string | null
          is_active: boolean | null
          is_system: boolean | null
          name: string | null
          normal_balance: string | null
          organization_id: string | null
          total_credits: number | null
          total_debits: number | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      nexus_product_metric_latest: {
        Row: {
          metric_key: string | null
          metric_label: string | null
          metric_value: number | null
          observed_at: string | null
          organization_id: string | null
          period_end: string | null
          period_start: string | null
          product_id: string | null
          product_name: string | null
          source: Database["public"]["Enums"]["nexus_metric_source"] | null
          unit: string | null
          verification:
            | Database["public"]["Enums"]["nexus_metric_verification"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "product_metrics_org_product_fk"
            columns: ["organization_id", "product_id"]
            isOneToOne: false
            referencedRelation: "nexus_command_center_products"
            referencedColumns: ["organization_id", "product_id"]
          },
          {
            foreignKeyName: "product_metrics_org_product_fk"
            columns: ["organization_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "product_metrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "nexus_command_center_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_metrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      nexus_accept_invitation: {
        Args: { p_invitation_id: string }
        Returns: Json
      }
      nexus_ai_complete_request: {
        Args: {
          p_answer: string
          p_failure_code: string
          p_input_tokens: number
          p_model: string
          p_output_tokens: number
          p_request_id: string
          p_server_key: string
          p_success: boolean
          p_tool_names: string[]
        }
        Returns: Json
      }
      nexus_ai_reserve_request:
        | {
            Args: {
              p_conversation_id: string
              p_organization_id: string
              p_request_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_conversation_id: string
              p_organization_id: string
              p_request_id: string
              p_server_key: string
            }
            Returns: Json
          }
      nexus_ai_set_policy: {
        Args: {
          p_confirm_free_tier_no_billing?: boolean
          p_confirm_provider_privacy?: boolean
          p_enabled?: boolean
          p_organization_id?: string
        }
        Returns: Json
      }
      nexus_ai_update_settings: {
        Args: {
          p_daily_output_token_limit: number
          p_daily_request_limit: number
          p_max_history_messages: number
          p_max_input_characters: number
          p_max_input_tokens_per_request: number
          p_max_output_tokens_per_request: number
          p_max_response_characters: number
          p_monthly_budget_usd: number
          p_organization_id: string
          p_requests_per_five_minutes: number
        }
        Returns: Json
      }
      nexus_cancel_invitation: {
        Args: { p_invitation_id: string }
        Returns: undefined
      }
      nexus_clear_user_permission: {
        Args: {
          p_organization_id: string
          p_permission_key: string
          p_user_id: string
        }
        Returns: undefined
      }
      nexus_finance_create_entry: {
        Args: {
          p_currency_code: string
          p_description: string
          p_entry_date: string
          p_lines: Json
          p_organization_id: string
          p_reference: string
        }
        Returns: Json
      }
      nexus_ingest_product_metric: {
        Args: {
          p_idempotency_key: string
          p_integration_id: string
          p_metric_key: string
          p_metric_value: number
          p_observed_at?: string
          p_payload_sha256?: string
          p_period_end?: string
          p_period_start?: string
          p_source_reference?: string
        }
        Returns: Json
      }
      nexus_moderate_channel_message: {
        Args: { p_hide: boolean; p_message_id: string; p_reason?: string }
        Returns: undefined
      }
      nexus_record_notification_delivery_test: {
        Args: { p_organization_id: string; p_test_passed: boolean }
        Returns: undefined
      }
      nexus_record_product_integration_test: {
        Args: {
          p_error_code?: string
          p_integration_id: string
          p_test_passed: boolean
        }
        Returns: undefined
      }
      nexus_record_service_health: {
        Args: {
          p_checked_at?: string
          p_component_key: string
          p_latency_ms?: number
          p_monitoring_source: string
          p_organization_id: string
          p_safe_detail?: string
          p_status: string
        }
        Returns: string
      }
      nexus_remove_project_member: {
        Args: {
          p_organization_id: string
          p_project_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      nexus_set_channel_member: {
        Args: {
          p_add: boolean
          p_channel_id: string
          p_member_role?: string
          p_user_id: string
        }
        Returns: undefined
      }
      nexus_set_investor_access: {
        Args: {
          p_is_active: boolean
          p_organization_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      nexus_set_member_details: {
        Args: {
          p_bio?: string
          p_department_id?: string
          p_employment_status?: string
          p_employment_type?: string
          p_job_title?: string
          p_organization_id: string
          p_start_date?: string
          p_team_id?: string
          p_user_id: string
        }
        Returns: undefined
      }
      nexus_set_member_role: {
        Args: {
          p_new_role: Database["public"]["Enums"]["workspace_role"]
          p_organization_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      nexus_set_member_status: {
        Args: {
          p_new_status: Database["public"]["Enums"]["membership_status"]
          p_organization_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      nexus_set_product_integration_state: {
        Args: {
          p_error_code?: string
          p_integration_id: string
          p_new_state: Database["public"]["Enums"]["nexus_integration_state"]
        }
        Returns: undefined
      }
      nexus_set_project_member: {
        Args: {
          p_organization_id: string
          p_project_id: string
          p_project_role: string
          p_user_id: string
        }
        Returns: undefined
      }
      nexus_set_team_member: {
        Args: {
          p_is_member: boolean
          p_organization_id: string
          p_team_id: string
          p_team_role?: string
          p_user_id: string
        }
        Returns: undefined
      }
      nexus_set_user_permission: {
        Args: {
          p_is_allowed: boolean
          p_organization_id: string
          p_permission_key: string
          p_user_id: string
        }
        Returns: undefined
      }
      nexus_start_direct_conversation: {
        Args: { p_organization_id: string; p_other_user_id: string }
        Returns: string
      }
      nexus_verify_manual_product_metric: {
        Args: { p_metric_id: string }
        Returns: undefined
      }
    }
    Enums: {
      membership_status: "active" | "suspended" | "revoked"
      nexus_content_status: "draft" | "published" | "archived"
      nexus_integration_state:
        | "pending"
        | "active"
        | "paused"
        | "revoked"
        | "error"
      nexus_metric_source: "integration" | "manual" | "sample"
      nexus_metric_verification: "pending" | "verified" | "sample" | "rejected"
      nexus_milestone_status:
        | "planned"
        | "in_progress"
        | "completed"
        | "blocked"
      nexus_product_status:
        | "planning"
        | "development"
        | "beta"
        | "live"
        | "maintenance"
        | "retired"
      nexus_project_status:
        | "planned"
        | "active"
        | "on_hold"
        | "completed"
        | "archived"
      nexus_task_priority: "low" | "normal" | "high" | "urgent"
      nexus_task_status: "todo" | "doing" | "done"
      workspace_role:
        | "owner"
        | "admin"
        | "manager"
        | "team"
        | "designer"
        | "developer"
        | "investor"
        | "client"
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
      membership_status: ["active", "suspended", "revoked"],
      nexus_content_status: ["draft", "published", "archived"],
      nexus_integration_state: [
        "pending",
        "active",
        "paused",
        "revoked",
        "error",
      ],
      nexus_metric_source: ["integration", "manual", "sample"],
      nexus_metric_verification: ["pending", "verified", "sample", "rejected"],
      nexus_milestone_status: [
        "planned",
        "in_progress",
        "completed",
        "blocked",
      ],
      nexus_product_status: [
        "planning",
        "development",
        "beta",
        "live",
        "maintenance",
        "retired",
      ],
      nexus_project_status: [
        "planned",
        "active",
        "on_hold",
        "completed",
        "archived",
      ],
      nexus_task_priority: ["low", "normal", "high", "urgent"],
      nexus_task_status: ["todo", "doing", "done"],
      workspace_role: [
        "owner",
        "admin",
        "manager",
        "team",
        "designer",
        "developer",
        "investor",
        "client",
      ],
    },
  },
} as const
