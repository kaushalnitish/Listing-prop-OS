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
    anonKey &&
    !supabaseUrl.includes("placeholder")
  );

  let isOnline = false;
  let hasBucket = false;

  if (isConfigured) {
    try {
      const client = createClient(supabaseUrl, serviceRoleKey || anonKey);
      // Fast ping check on listings or system
      const { error } = await client.from("listings").select("id").limit(1);
      isOnline = !error || error.code === "PGRST116" || error.message?.includes("does not exist");
      
      // Check storage bucket
      try {
        const { data: buckets } = await client.storage.listBuckets();
        if (Array.isArray(buckets)) {
          hasBucket = buckets.some((b: any) => b.name === "property-images");
        }
      } catch {
        // bucket check optional
      }
    } catch {
      isOnline = false;
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      supabaseUrl: isConfigured ? supabaseUrl : null,
      supabaseAnonKey: isConfigured ? anonKey : null,
      isConfigured,
      isOnline,
      hasServiceRoleKey: Boolean(serviceRoleKey),
      hasAnonKey: Boolean(anonKey),
      hasBucket,
      storageMode: isOnline ? "supabase" : "local",
      platform: "netlify",
    }),
  };
};
