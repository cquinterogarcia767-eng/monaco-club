import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan variables de entorno de Supabase. Revisa .env.local')
}

// Aseguramos que la URL no tenga slash al final
const cleanUrl = supabaseUrl.replace(/\/$/, '')

export const supabase = createClient(cleanUrl, supabaseKey)