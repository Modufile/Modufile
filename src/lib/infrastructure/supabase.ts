/**
 * Supabase Client (Layer 4: Infrastructure)
 * 
 * This is the ONLY file that imports @supabase/supabase-js directly.
 * All other code must use service adapters.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found. Auth features will be disabled.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
