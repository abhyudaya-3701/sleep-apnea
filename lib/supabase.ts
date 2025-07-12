import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project-id.supabase.co'; // Replace with your Supabase project URL
const supabaseAnonKey = 'your-anon-key'; // Replace with your Supabase anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);