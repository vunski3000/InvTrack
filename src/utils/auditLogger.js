import { supabase } from '../supabaseClient';

export const logAudit = async (userName, action, details) => {
    try {
        const { error } = await supabase.from('audit_logs').insert([{
            user_name: userName,
            action,
            details
        }]);
        if (error) throw error;
    } catch (err) {
        console.error("Error logging audit:", err.message);
    }
};