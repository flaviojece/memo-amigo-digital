import { createClient, type SupabaseClient, type User } from 'jsr:@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/**
 * Identifica o usuário que está chamando a função a partir do JWT
 * enviado no header Authorization. Nunca confie em IDs vindos do body.
 */
export async function getCallerUser(req: Request, admin: SupabaseClient): Promise<User | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length);
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

/** Verifica se `guardianId` é anjo ativo de `patientId`. */
export async function isGuardianOf(admin: SupabaseClient, guardianId: string, patientId: string) {
  const { data, error } = await admin.rpc('is_guardian_of', {
    _guardian_id: guardianId,
    _patient_id: patientId,
  });
  return !error && !!data;
}
