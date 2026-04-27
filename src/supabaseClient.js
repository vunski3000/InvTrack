import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key Check:", supabaseKey ? "Key exists!" : "Key is missing!");

export const supabase = createClient(supabaseUrl, supabaseKey);
