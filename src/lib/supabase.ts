import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Keep the public editor preview bootable without credentials. Real authentication
// is enabled automatically when both deployment variables are configured.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = createClient(
  supabaseUrl || 'https://preview-not-configured.supabase.co',
  supabaseAnonKey || 'lumina-preview-anon-key',
)
