import { createClient } from "@supabase/supabase-js";

export const handler = async (event: any) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const rawUrl = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ""
  ).trim();
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");

  const anonKey = (
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ""
  ).trim().replace(/^["']|["']$/g, "");

  const serviceRoleKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  ).trim().replace(/^["']|["']$/g, "");

  const isConfigured = Boolean(
    supabaseUrl &&
    (serviceRoleKey || anonKey) &&
    !supabaseUrl.includes("placeholder")
  );

  let isOnline = false;
  if (isConfigured) {
    try {
      const client = createClient(supabaseUrl, serviceRoleKey || anonKey);
      const { error } = await client.from("listings").select("id").limit(1);
      isOnline = !error || error.code === "PGRST116" || error.message?.includes("does not exist");
    } catch {
      isOnline = false;
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      status: "ok",
      platform: "netlify",
      supabaseConfigured: isConfigured,
      supabaseReachable: isOnline,
      hasServiceRoleKey: Boolean(serviceRoleKey),
      hasAnonKey: Boolean(anonKey),
      storageMode: isOnline ? "supabase" : "local",
      timestamp: new Date().toISOString(),
    }),
  };
};
