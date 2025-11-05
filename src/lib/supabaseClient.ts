import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

console.log('URL:', JSON.stringify(supabaseUrl));
console.log('KEY start:', JSON.stringify(supabaseAnonKey?.slice(0, 10)));

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
