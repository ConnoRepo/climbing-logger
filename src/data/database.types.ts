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
  main: {
    Tables: {
      journal: {
        Row: {
          created_at: string
          date: string
          synced_at: string
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at: string
          date: string
          synced_at?: string
          text?: string
          updated_at: string
          user_id?: string
        }
        Update: {
          created_at?: string
          date?: string
          synced_at?: string
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          category: string
          completed_at: string | null
          created_at: string
          date: string | null
          deleted_at: string | null
          id: string
          name: string
          notes: string
          position: number
          prescription: Json
          running_since: string | null
          sets: Json
          synced_at: string
          template_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          completed_at?: string | null
          created_at: string
          date?: string | null
          deleted_at?: string | null
          id: string
          name: string
          notes?: string
          position: number
          prescription: Json
          running_since?: string | null
          sets?: Json
          synced_at?: string
          template_id: string
          updated_at: string
          user_id?: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          created_at?: string
          date?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          notes?: string
          position?: number
          prescription?: Json
          running_since?: string | null
          sets?: Json
          synced_at?: string
          template_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_template_id_fkey"
            columns: ["user_id", "template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      templates: {
        Row: {
          category: string
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          prescription: Json
          synced_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at: string
          deleted_at?: string | null
          id: string
          name: string
          prescription: Json
          synced_at?: string
          updated_at: string
          user_id?: string
        }
        Update: {
          category?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          prescription?: Json
          synced_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
