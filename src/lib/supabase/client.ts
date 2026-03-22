import { createBrowserClient } from '@supabase/ssr'

// Trim to remove any trailing whitespace/newlines that may have been
// introduced when environment variables were set via Windows CLI tools
const supabaseUrl  = (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '').trim()
const supabaseAnon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnon)
}
