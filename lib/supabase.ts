import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      brands: {
        Row: {
          id: string
          name: string
          icon: string
          background_image: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          icon: string
          background_image?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string
          background_image?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          images: string[]
          price: number
          brand_id: string
          description: string | null
          category: string
          type: string
          colors: string[]
          sizes: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          images: string[]
          price: number
          brand_id: string
          description?: string | null
          category: string
          type: string
          colors: string[]
          sizes: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          images?: string[]
          price?: number
          brand_id?: string
          description?: string | null
          category?: string
          type?: string
          colors?: string[]
          sizes?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          created_at?: string
        }
      }
    }
  }
}
