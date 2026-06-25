// This file mirrors the output of:
//   supabase gen types typescript --project-id <ref> > utils/supabase/database.types.ts
//
// It was authored from the known schema because the CLI could not authenticate
// in this environment (no SUPABASE_ACCESS_TOKEN). Re-run the command after
// `supabase login` to refresh it from the live database — that will also fill
// in the `products` table and confirm exact nullability / FK constraint names.
//
// Nullability below assumes Postgres defaults (columns nullable unless NOT NULL).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)";
  };
  public: {
    Tables: {
      articles: {
        Row: {
          author_id: string | null;
          category: string | null;
          content: string | null;
          created_at: string;
          id: string;
          image_url: string | null;
          slug: string | null;
          title: string | null;
        };
        Insert: {
          author_id?: string | null;
          category?: string | null;
          content?: string | null;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          slug?: string | null;
          title?: string | null;
        };
        Update: {
          author_id?: string | null;
          category?: string | null;
          content?: string | null;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          slug?: string | null;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      matches: {
        Row: {
          api_id: number | null;
          away_score: number | null;
          competition: string | null;
          home_score: number | null;
          id: string;
          match_date: string | null;
          opponent: string | null;
          opponent_logo_url: string | null;
          status: string | null;
          venue: string | null;
        };
        Insert: {
          api_id?: number | null;
          away_score?: number | null;
          competition?: string | null;
          home_score?: number | null;
          id?: string;
          match_date?: string | null;
          opponent?: string | null;
          opponent_logo_url?: string | null;
          status?: string | null;
          venue?: string | null;
        };
        Update: {
          api_id?: number | null;
          away_score?: number | null;
          competition?: string | null;
          home_score?: number | null;
          id?: string;
          match_date?: string | null;
          opponent?: string | null;
          opponent_logo_url?: string | null;
          status?: string | null;
          venue?: string | null;
        };
        Relationships: [];
      };
      players: {
        Row: {
          api_id: number | null;
          id: string;
          image_url: string | null;
          kit_number: number | null;
          name: string | null;
          position: string | null;
        };
        Insert: {
          api_id?: number | null;
          id?: string;
          image_url?: string | null;
          kit_number?: number | null;
          name?: string | null;
          position?: string | null;
        };
        Update: {
          api_id?: number | null;
          id?: string;
          image_url?: string | null;
          kit_number?: number | null;
          name?: string | null;
          position?: string | null;
        };
        Relationships: [];
      };
      predictions: {
        // `user_id` references auth.users(id) (the same identity as
        // profiles.id). That FK lives outside the public schema, so — like
        // profiles.id above — it is omitted from Relationships below.
        Row: {
          id: string;
          match_id: string;
          points_awarded: number | null;
          predicted_away_score: number | null;
          predicted_home_score: number | null;
          predicted_scorer_id: string | null;
          user_id: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          points_awarded?: number | null;
          predicted_away_score?: number | null;
          predicted_home_score?: number | null;
          predicted_scorer_id?: string | null;
          user_id: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          points_awarded?: number | null;
          predicted_away_score?: number | null;
          predicted_home_score?: number | null;
          predicted_scorer_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "predictions_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "predictions_predicted_scorer_id_fkey";
            columns: ["predicted_scorer_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          full_name: string | null;
          id: string;
          points: number | null;
          role: string | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          full_name?: string | null;
          id: string;
          points?: number | null;
          role?: string | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          full_name?: string | null;
          id?: string;
          points?: number | null;
          role?: string | null;
          updated_at?: string | null;
        };
        // `id` references auth.users(id); that FK lives outside the public
        // schema, so it is omitted here.
        Relationships: [];
      };
      product_reviews: {
        Row: {
          comment: string | null;
          created_at: string;
          id: string;
          product_id: string;
          rating: number;
          user_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          product_id: string;
          rating: number;
          user_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          product_id?: string;
          rating?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_reviews_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          category: string;
          created_at: string;
          description: string | null;
          id: string;
          images: string[];
          in_stock: boolean;
          is_active: boolean;
          name: string;
          price: number;
          sizes: string[];
        };
        Insert: {
          category?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          images?: string[];
          in_stock?: boolean;
          is_active?: boolean;
          name: string;
          price?: number;
          sizes?: string[];
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          images?: string[];
          in_stock?: boolean;
          is_active?: boolean;
          name?: string;
          price?: number;
          sizes?: string[];
        };
        Relationships: [];
      };
      site_testimonials: {
        Row: {
          content: string | null;
          created_at: string;
          handle: string | null;
          id: string;
          rating: number | null;
          user_name: string | null;
        };
        Insert: {
          content?: string | null;
          created_at?: string;
          handle?: string | null;
          id?: string;
          rating?: number | null;
          user_name?: string | null;
        };
        Update: {
          content?: string | null;
          created_at?: string;
          handle?: string | null;
          id?: string;
          rating?: number | null;
          user_name?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// --- Convenience helpers (simplified form of the CLI-generated helpers) ---

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
