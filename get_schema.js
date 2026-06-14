import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ycykvkhpyxxhgroqchhd.supabase.co';
const supabaseKey = 'sb_publishable_XA60ktzSBk5nY6F2xRrjnw_ZijqZgsJ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    try {
        const { data, error } = await supabase.from('categories').select('*');
        if (error) {
            console.error("Error:", error);
        } else {
            console.log("Categories raw data:", data);
        }
    } catch (e) {
        console.error("Exception:", e);
    }
}

checkSchema();
