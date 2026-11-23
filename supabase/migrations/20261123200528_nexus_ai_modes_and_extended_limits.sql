-- DVNM Intelligence: distinct general/company conversation modes and larger bounded limits.
ALTER TABLE public.nexus_ai_conversations
  ADD COLUMN IF NOT EXISTS assistant_mode text NOT NULL DEFAULT 'company';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.nexus_ai_conversations'::regclass
      AND conname = 'nexus_ai_conversations_assistant_mode_check'
  ) THEN
    ALTER TABLE public.nexus_ai_conversations
      ADD CONSTRAINT nexus_ai_conversations_assistant_mode_check
      CHECK (assistant_mode IN ('general','company'));
  END IF;
END $$;

ALTER TABLE public.nexus_ai_settings
  DROP CONSTRAINT IF EXISTS nexus_ai_settings_max_output_tokens_per_request_check;
ALTER TABLE public.nexus_ai_settings
  ADD CONSTRAINT nexus_ai_settings_max_output_tokens_per_request_check
  CHECK (max_output_tokens_per_request BETWEEN 100 AND 8192);

ALTER TABLE public.nexus_ai_settings
  DROP CONSTRAINT IF EXISTS nexus_ai_settings_max_response_characters_check;
ALTER TABLE public.nexus_ai_settings
  ADD CONSTRAINT nexus_ai_settings_max_response_characters_check
  CHECK (max_response_characters BETWEEN 500 AND 40000);

CREATE OR REPLACE FUNCTION public.nexus_ai_update_settings(
  p_organization_id uuid,
  p_daily_request_limit integer,
  p_requests_per_five_minutes integer,
  p_max_input_characters integer,
  p_max_history_messages integer,
  p_max_input_tokens_per_request integer,
  p_max_output_tokens_per_request integer,
  p_daily_output_token_limit integer,
  p_max_response_characters integer,
  p_monthly_budget_usd numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_role public.workspace_role;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING errcode = '28000';
  END IF;

  SELECT m.role INTO v_role
  FROM public.organization_memberships m
  WHERE m.organization_id = p_organization_id
    AND m.user_id = v_user_id
    AND m.status = 'active'::public.membership_status;

  IF v_role IS NULL
     OR v_role NOT IN ('owner'::public.workspace_role, 'admin'::public.workspace_role)
     OR NOT private.has_permission(p_organization_id, 'intelligence.manage') THEN
    RAISE EXCEPTION 'Owner/admin intelligence management permission required.'
      USING errcode = '42501';
  END IF;

  IF p_daily_request_limit NOT BETWEEN 1 AND 200
     OR p_requests_per_five_minutes NOT BETWEEN 1 AND 30
     OR p_max_input_characters NOT BETWEEN 100 AND 10000
     OR p_max_history_messages NOT BETWEEN 0 AND 20
     OR p_max_input_tokens_per_request NOT BETWEEN 100 AND 30000
     OR p_max_output_tokens_per_request NOT BETWEEN 100 AND 8192
     OR p_daily_output_token_limit NOT BETWEEN 100 AND 200000
     OR p_max_response_characters NOT BETWEEN 500 AND 40000
     OR p_monthly_budget_usd NOT BETWEEN 0 AND 1 THEN
    RAISE EXCEPTION 'One or more values are outside the approved Nexus limits.'
      USING errcode = '22023';
  END IF;

  UPDATE public.nexus_ai_settings s
  SET daily_request_limit = p_daily_request_limit,
      requests_per_five_minutes = p_requests_per_five_minutes,
      max_input_characters = p_max_input_characters,
      max_history_messages = p_max_history_messages,
      max_input_tokens_per_request = p_max_input_tokens_per_request,
      max_output_tokens_per_request = p_max_output_tokens_per_request,
      daily_output_token_limit = p_daily_output_token_limit,
      max_response_characters = p_max_response_characters,
      monthly_budget_usd = p_monthly_budget_usd,
      updated_by = v_user_id,
      updated_at = now()
  WHERE s.organization_id = p_organization_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'DVNM Intelligence settings were not found.'
      USING errcode = 'P0002';
  END IF;

  RETURN jsonb_build_object('success',true,'updated',true);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.nexus_ai_update_settings(
  uuid, integer, integer, integer, integer, integer, integer, integer, integer, numeric
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexus_ai_update_settings(
  uuid, integer, integer, integer, integer, integer, integer, integer, integer, numeric
) TO authenticated;

UPDATE public.nexus_ai_settings
SET
  daily_request_limit = 100,
  requests_per_five_minutes = 10,
  max_input_characters = 10000,
  max_history_messages = 16,
  max_input_tokens_per_request = 30000,
  max_output_tokens_per_request = 8192,
  daily_output_token_limit = 200000,
  max_response_characters = 40000,
  updated_at = now()
WHERE organization_id = (
  SELECT id FROM public.organizations WHERE slug = 'davonium-technologies'
);
