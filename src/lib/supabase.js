import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && key ? createClient(url, key) : null

// Flag global usada pelo PrivateRoute para modo sem Supabase
if (typeof window !== 'undefined') {
  window.__SUPABASE_CONFIGURED__ = !!(url && key)
}
