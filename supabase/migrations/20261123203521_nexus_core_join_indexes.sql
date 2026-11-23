-- DVNM Nexus: targeted multi-tenant join and FK lookup indexes.
-- Additive only; no records or existing indexes are modified or removed.

CREATE INDEX IF NOT EXISTS client_account_memberships_org_user_idx
  ON public.client_account_memberships (organization_id, user_id);

CREATE INDEX IF NOT EXISTS company_key_results_org_objective_idx
  ON public.company_key_results (organization_id, objective_id);

CREATE INDEX IF NOT EXISTS company_objectives_org_owner_idx
  ON public.company_objectives (organization_id, owner_user_id)
  WHERE owner_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS member_invitations_org_client_idx
  ON public.member_invitations (organization_id, client_account_id)
  WHERE client_account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS member_invitations_org_department_idx
  ON public.member_invitations (organization_id, department_id)
  WHERE department_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS member_invitations_org_team_department_idx
  ON public.member_invitations (organization_id, team_id, department_id)
  WHERE team_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS nexus_channel_members_org_channel_idx
  ON public.nexus_channel_members (organization_id, channel_id);

CREATE INDEX IF NOT EXISTS nexus_channel_members_org_user_idx
  ON public.nexus_channel_members (organization_id, user_id);

CREATE INDEX IF NOT EXISTS nexus_direct_conversations_org_participant_high_idx
  ON public.nexus_direct_conversations (organization_id, participant_high);

CREATE INDEX IF NOT EXISTS nexus_direct_messages_org_conversation_idx
  ON public.nexus_direct_messages (organization_id, conversation_id);

CREATE INDEX IF NOT EXISTS nexus_notifications_org_recipient_idx
  ON public.nexus_notifications (organization_id, recipient_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS organization_team_members_org_team_idx
  ON public.organization_team_members (organization_id, team_id);

CREATE INDEX IF NOT EXISTS organization_team_members_org_user_idx
  ON public.organization_team_members (organization_id, user_id);

CREATE INDEX IF NOT EXISTS product_metric_ingestion_runs_org_product_integration_idx
  ON public.product_metric_ingestion_runs (organization_id, product_id, integration_id);

CREATE INDEX IF NOT EXISTS product_metric_sync_events_org_product_run_idx
  ON public.product_metric_sync_events (organization_id, product_id, run_id);

CREATE INDEX IF NOT EXISTS product_metrics_org_product_idx
  ON public.product_metrics (organization_id, product_id);

CREATE INDEX IF NOT EXISTS product_releases_org_product_idx
  ON public.product_releases (organization_id, product_id, released_at DESC);

CREATE INDEX IF NOT EXISTS project_decisions_org_project_idx
  ON public.project_decisions (organization_id, project_id, decided_at DESC);

CREATE INDEX IF NOT EXISTS project_documents_org_project_idx
  ON public.project_documents (organization_id, project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS project_members_org_user_idx
  ON public.project_members (organization_id, user_id);

CREATE INDEX IF NOT EXISTS project_members_org_project_idx
  ON public.project_members (organization_id, project_id);

CREATE INDEX IF NOT EXISTS project_milestones_org_project_idx
  ON public.project_milestones (organization_id, project_id, sort_order, due_date);

CREATE INDEX IF NOT EXISTS projects_org_client_idx
  ON public.projects (organization_id, client_account_id)
  WHERE client_account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS service_incidents_org_component_idx
  ON public.service_incidents (organization_id, component_id)
  WHERE component_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS tasks_org_assignee_due_idx
  ON public.tasks (organization_id, assigned_to, due_at)
  WHERE assigned_to IS NOT NULL;
