import { createClient } from '@supabase/supabase-js'

// Asegúrate de tener estas variables en un archivo .env local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)