// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export default {
  fetch: withSupabase({ auth: ["publishable", "secret"] }, async (req, ctx) => {
    // Handle CORS preflight request
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    try {
      // 1. Verify caller has 'sysadmin' role
      const { data: { user }, error: userError } = await ctx.supabase.auth.getUser();
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized access" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (user.user_metadata?.role !== "sysadmin") {
        return new Response(
          JSON.stringify({ error: "Forbidden: Only sysadmins can manage users" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 2. Parse request body
      const body = await req.json();
      const { action } = body;

      // 3. Handle operations using supabaseAdmin
      if (action === "list") {
        const { data: { users }, error: listError } = await ctx.supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;

        const mappedUsers = users.map((u) => ({
          id: u.id,
          email: u.email,
          role: u.user_metadata?.role || "staff",
          created_at: u.created_at,
        }));

        return new Response(
          JSON.stringify({ users: mappedUsers }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "update_role") {
        const { userId, newRole } = body;
        if (!userId || !newRole) {
          return new Response(
            JSON.stringify({ error: "Missing userId or newRole" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error: updateError } = await ctx.supabaseAdmin.auth.admin.updateUserById(
          userId,
          { user_metadata: { role: newRole } }
        );
        if (updateError) throw updateError;

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "update_password") {
        const { userId, newPassword } = body;
        if (!userId || !newPassword) {
          return new Response(
            JSON.stringify({ error: "Missing userId or newPassword" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error: passwordError } = await ctx.supabaseAdmin.auth.admin.updateUserById(
          userId,
          { password: newPassword }
        );
        if (passwordError) throw passwordError;

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "delete_user") {
        const { userId } = body;
        if (!userId) {
          return new Response(
            JSON.stringify({ error: "Missing userId" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error: deleteError } = await ctx.supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteError) throw deleteError;

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message || "An unexpected error occurred" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }),
};
