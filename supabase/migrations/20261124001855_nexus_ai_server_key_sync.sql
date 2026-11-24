CREATE OR REPLACE FUNCTION public.nexus_ai_sync_server_key(p_server_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_hash bytea;
BEGIN
  IF p_server_key IS NULL OR length(btrim(p_server_key)) < 32 THEN
    RAISE EXCEPTION 'Invalid AI ledger credential.' USING errcode = '22023';
  END IF;

  v_hash := extensions.digest(convert_to(btrim(p_server_key), 'UTF8'), 'sha256');

  IF EXISTS (
    SELECT 1
    FROM private.nexus_ai_server_keys
    WHERE key_hash = v_hash
      AND revoked_at IS NULL
  ) THEN
    RETURN jsonb_build_object('success', true, 'synchronized', false);
  END IF;

  UPDATE private.nexus_ai_server_keys
  SET revoked_at = pg_catalog.now()
  WHERE revoked_at IS NULL
    AND key_hash <> v_hash;

  INSERT INTO private.nexus_ai_server_keys (key_hash)
  VALUES (v_hash)
  ON CONFLICT (key_hash)
  DO UPDATE SET revoked_at = NULL;

  RETURN jsonb_build_object('success', true, 'synchronized', true);
END;
$function$;

REVOKE ALL ON FUNCTION public.nexus_ai_sync_server_key(text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.nexus_ai_sync_server_key(text)
TO service_role;
