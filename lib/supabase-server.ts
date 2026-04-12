import type { SupabaseClient } from "@supabase/supabase-js";

type SupabaseServerConfig = {
  url: string | null;
  serviceRoleKey: string | null;
  enabled: boolean;
  missingEnvVars: string[];
};

export function getSupabaseServerConfig(): SupabaseServerConfig {
  const url = process.env.SUPABASE_URL?.trim() || null;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
  const missingEnvVars = [];

  if (!url) {
    missingEnvVars.push("SUPABASE_URL");
  }

  if (!serviceRoleKey) {
    missingEnvVars.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  return {
    url,
    serviceRoleKey,
    enabled: missingEnvVars.length === 0,
    missingEnvVars,
  };
}

export async function getSupabaseAdminClient(): Promise<SupabaseClient | null> {
  const config = getSupabaseServerConfig();

  if (!config.enabled || !config.url || !config.serviceRoleKey) {
    return null;
  }

  const { createClient } = await import("@supabase/supabase-js");

  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
