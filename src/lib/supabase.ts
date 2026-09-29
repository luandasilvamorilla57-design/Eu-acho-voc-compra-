import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
const url = import.meta.env.VITE_SUPABASE_URL || 'https://nnkwjqscmwfxxmpasvqq.supabase.co'
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_MgsmB3fO-C-9bm58YuQH7Q_Np7MZU2J'
export const supabase = createClient<Database>(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})
