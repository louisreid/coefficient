import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Server-side Supabase client with service role (uploads, signed URLs).
 * Use only in API routes or server actions; never expose to client.
 */
export function getSupabaseServerClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for field capture storage."
    );
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

export const FIELD_CAPTURES_BUCKET = "field-captures";
