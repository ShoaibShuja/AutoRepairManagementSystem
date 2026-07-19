import { createClient } from "@supabase/supabase-js";

import { getPublicEnv, getServiceRoleKey } from "@/lib/env";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const env = getPublicEnv();
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, getServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
