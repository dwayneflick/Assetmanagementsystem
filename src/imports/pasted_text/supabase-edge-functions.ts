import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // ─── AUTH: Get current user from JWT ──────────────
    const authHeader = req.headers.get("Authorization");
    let currentUser = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        currentUser = profile;
      }
    }

    // ─── ROUTES ───────────────────────────────────────

    // Health check
    if (path === "/health") {
      return json({ status: "ok" });
    }

    // Get all assets
    if (path === "/assets" && req.method === "GET") {
      const status = url.searchParams.get("status");
      const department = url.searchParams.get("department");
      const search = url.searchParams.get("search");
      const page = parseInt(url.searchParams.get("page") ?? "0");
      const pageSize = parseInt(url.searchParams.get("pageSize") ?? "20");

      let query = supabase
        .from("assets")
        .select("*, assigned_to:profiles(id, full_name, email)", { count: "exact" })
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order("created_at", { ascending: false });

      if (status) query = query.eq("status", status);
      if (department) query = query.eq("department", department);
      if (search) query = query.ilike("name", `%${search}%`);

      const { data, error, count } = await query;
      if (error) return jsonError(error.message);
      return json({ data, total: count });
    }

    // Create asset
    if (path === "/assets" && req.method === "POST") {
      const body = await req.json();
      const { data, error } = await supabase
        .from("assets")
        .insert({ ...body, created_by: currentUser?.id })
        .select()
        .single();
      if (error) return jsonError(error.message);
      return json(data);
    }

    // Update asset
    if (path.startsWith("/assets/") && req.method === "PATCH") {
      const id = path.split("/")[2];
      const body = await req.json();
      const { data, error } = await supabase
        .from("assets")
        .update(body)
        .eq("id", id)
        .select()
        .single();
      if (error) return jsonError(error.message);
      return json(data);
    }

    // Delete asset
    if (path.startsWith("/assets/") && req.method === "DELETE") {
      const id = path.split("/")[2];
      const { error } = await supabase.from("assets").delete().eq("id", id);
      if (error) return jsonError(error.message);
      return json({ success: true });
    }

    // Dashboard stats
    if (path === "/dashboard/stats" && req.method === "GET") {
      const today = new Date().toISOString().split("T")[0];
      const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const [total, active, faulty, incidents, warranties] = await Promise.all([
        supabase.from("assets").select("*", { count: "exact", head: true }),
        supabase.from("assets").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("assets").select("*", { count: "exact", head: true }).eq("status", "faulty"),
        supabase.from("incident_reports").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("assets").select("id, name, asset_tag, warranty_expiry")
          .gte("warranty_expiry", today)
          .lte("warranty_expiry", in30Days),
      ]);

      return json({
        totalAssets: total.count ?? 0,
        activeAssets: active.count ?? 0,
        faultyAssets: faulty.count ?? 0,
        openIncidents: incidents.count ?? 0,
        expiringWarranties: warranties.data ?? [],
      });
    }

    // Incidents
    if (path === "/incidents" && req.method === "GET") {
      const status = url.searchParams.get("status");
      let query = supabase
        .from("incident_reports")
        .select("*, asset:assets(id, name, asset_tag), reported_by:profiles(id, full_name)")
        .order("created_at", { ascending: false });
      if (status) query = query.eq("status", status);
      const { data, error } = await query;
      if (error) return jsonError(error.message);
      return json(data);
    }

    // Maintenance logs
    if (path === "/maintenance" && req.method === "GET") {
      const assetId = url.searchParams.get("asset_id");
      let query = supabase
        .from("maintenance_logs")
        .select("*, asset:assets(id, name, asset_tag), performed_by:profiles(id, full_name)")
        .order("scheduled_date", { ascending: true });
      if (assetId) query = query.eq("asset_id", assetId);
      const { data, error } = await query;
      if (error) return jsonError(error.message);
      return json(data);
    }

    // Purchase orders
    if (path === "/purchase-orders" && req.method === "GET") {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*, created_by:profiles(id, full_name), line_items:po_line_items(*)")
        .order("created_at", { ascending: false });
      if (error) return jsonError(error.message);
      return json(data);
    }

    // Notifications
    if (path === "/notifications" && req.method === "GET") {
      if (!currentUser) return jsonError("Unauthorized", 401);
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) return jsonError(error.message);
      return json(data);
    }

    // Mark notification read
    if (path.startsWith("/notifications/") && req.method === "PATCH") {
      const id = path.split("/")[2];
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);
      if (error) return jsonError(error.message);
      return json({ success: true });
    }

    // Audit logs
    if (path === "/audit-logs" && req.method === "GET") {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*, user:profiles(id, full_name, email)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) return jsonError(error.message);
      return json(data);
    }

    // Profiles
    if (path === "/profiles" && req.method === "GET") {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, department")
        .order("full_name");
      if (error) return jsonError(error.message);
      return json(data);
    }

    // Software
    if (path === "/software" && req.method === "GET") {
      const { data, error } = await supabase
        .from("software")
        .select("*, installations:software_installations(asset:assets(id, name, asset_tag))")
        .order("name");
      if (error) return jsonError(error.message);
      return json(data);
    }

    // IT Issues
    if (path === "/it-issues" && req.method === "GET") {
      const { data, error } = await supabase
        .from("it_issue_logs")
        .select("*, asset:assets(id, name, asset_tag), reported_by:profiles(id, full_name)")
        .order("created_at", { ascending: false });
      if (error) return jsonError(error.message);
      return json(data);
    }

    // Knowledge base
    if (path === "/knowledge-base" && req.method === "GET") {
      const { data, error } = await supabase
        .from("knowledge_base")
        .select("*, author:profiles(id, full_name)")
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (error) return jsonError(error.message);
      return json(data);
    }

    // 404
    return json({ error: "Not found" }, 404);

  } catch (err) {
    console.error("Server error:", err);
    return jsonError("Internal server error", 500);
  }
});

// ─── Helpers ──────────────────────────────────────────────
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}