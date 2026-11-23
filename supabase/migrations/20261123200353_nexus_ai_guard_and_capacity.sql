-- Davonium Nexus: secure the AI reservation RPC and raise safe Free Tier capacity.
-- This migration is additive: it preserves existing data and the 3-argument
-- implementation as an internal routine, while requiring a server ledger key
-- for any application-level reservation.

CREATE OR REPLACE FUNCTION public.nexus_ai_reserve_request(
  p_organization_id uuid,
  p_conversation_id uuid,
  p_request_id uuid,
  p_server_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required.'
      USING errcode = '28000';
  END IF;

  IF p_server_key IS NULL
     OR length(p_server_key) < 32
     OR NOT EXISTS (
       SELECT 1
       FROM private.nexus_ai_server_keys k
       WHERE k.key_hash = extensions.digest(
         convert_to(p_server_key, 'UTF8'),
         'sha256'
       )
       AND k.revoked_at IS NULL
     ) THEN
    RAISE EXCEPTION 'Invalid AI ledger credential.'
      USING errcode = '42501';
  END IF;

  -- The original three-argument routine continues to enforce membership,
  -- permission, provider-consent, request, token and monthly budget rules.
  RETURN public.nexus_ai_reserve_request(
    p_organization_id,
    p_conversation_id,
    p_request_id
  );
END;
$function$;

-- Do not let browser clients bypass the ledger-key wrapper.
REVOKE EXECUTE ON FUNCTION public.nexus_ai_reserve_request(uuid, uuid, uuid)
  FROM PUBLIC, anon, authenticated;

-- The authenticated Edge Function may call the guarded four-argument overload.
REVOKE EXECUTE ON FUNCTION public.nexus_ai_reserve_request(uuid, uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexus_ai_reserve_request(uuid, uuid, uuid, text)
  TO authenticated;

-- Higher application-level limits, bounded by the existing database constraints.
-- The $1 monthly estimated-cost ceiling remains unchanged as a fail-safe.
UPDATE public.nexus_ai_settings
SET
  daily_request_limit = 100,
  requests_per_five_minutes = 10,
  max_input_characters = 8000,
  max_history_messages = 12,
  max_input_tokens_per_request = 16000,
  max_output_tokens_per_request = 2000,
  daily_output_token_limit = 100000,
  max_response_characters = 12000,
  updated_at = now()
WHERE organization_id = (
  SELECT id
  FROM public.organizations
  WHERE slug = 'davonium-technologies'
);
