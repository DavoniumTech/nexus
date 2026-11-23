-- DVNM Nexus RLS performance pass.
-- Preserve the same visibility rules while evaluating auth.uid() once per statement
-- and consolidating overlapping SELECT policies.

DROP POLICY IF EXISTS nexus_ai_conversations_owner ON public.nexus_ai_conversations;
CREATE POLICY nexus_ai_conversations_owner
ON public.nexus_ai_conversations
FOR ALL
TO authenticated
USING (
  owner_user_id = (SELECT auth.uid())
  AND private.has_permission(organization_id, 'intelligence.use')
  AND EXISTS (
    SELECT 1
    FROM public.organization_memberships m
    WHERE m.organization_id = nexus_ai_conversations.organization_id
      AND m.user_id = (SELECT auth.uid())
      AND m.status = 'active'::public.membership_status
      AND m.role IN (
        'owner'::public.workspace_role,
        'admin'::public.workspace_role,
        'manager'::public.workspace_role,
        'team'::public.workspace_role,
        'designer'::public.workspace_role,
        'developer'::public.workspace_role
      )
  )
)
WITH CHECK (
  owner_user_id = (SELECT auth.uid())
  AND private.has_permission(organization_id, 'intelligence.use')
  AND EXISTS (
    SELECT 1
    FROM public.organization_memberships m
    WHERE m.organization_id = nexus_ai_conversations.organization_id
      AND m.user_id = (SELECT auth.uid())
      AND m.status = 'active'::public.membership_status
      AND m.role IN (
        'owner'::public.workspace_role,
        'admin'::public.workspace_role,
        'manager'::public.workspace_role,
        'team'::public.workspace_role,
        'designer'::public.workspace_role,
        'developer'::public.workspace_role
      )
  )
);

DROP POLICY IF EXISTS nexus_ai_messages_insert_user ON public.nexus_ai_messages;
CREATE POLICY nexus_ai_messages_insert_user
ON public.nexus_ai_messages
FOR INSERT
TO authenticated
WITH CHECK (
  owner_user_id = (SELECT auth.uid())
  AND role = 'user'
  AND private.has_permission(organization_id, 'intelligence.use')
  AND EXISTS (
    SELECT 1
    FROM public.nexus_ai_conversations c
    WHERE c.id = nexus_ai_messages.conversation_id
      AND c.organization_id = nexus_ai_messages.organization_id
      AND c.owner_user_id = (SELECT auth.uid())
      AND c.status = 'active'
  )
);

DROP POLICY IF EXISTS nexus_ai_messages_read_owner ON public.nexus_ai_messages;
CREATE POLICY nexus_ai_messages_read_owner
ON public.nexus_ai_messages
FOR SELECT
TO authenticated
USING (
  owner_user_id = (SELECT auth.uid())
  AND private.has_permission(organization_id, 'intelligence.use')
  AND EXISTS (
    SELECT 1
    FROM public.organization_memberships m
    WHERE m.organization_id = nexus_ai_messages.organization_id
      AND m.user_id = (SELECT auth.uid())
      AND m.status = 'active'::public.membership_status
      AND m.role IN (
        'owner'::public.workspace_role,
        'admin'::public.workspace_role,
        'manager'::public.workspace_role,
        'team'::public.workspace_role,
        'designer'::public.workspace_role,
        'developer'::public.workspace_role
      )
  )
);

DROP POLICY IF EXISTS nexus_ai_settings_manage ON public.nexus_ai_settings;
CREATE POLICY nexus_ai_settings_manage
ON public.nexus_ai_settings
FOR ALL
TO authenticated
USING (
  private.has_permission(organization_id, 'intelligence.manage')
  AND EXISTS (
    SELECT 1
    FROM public.organization_memberships m
    WHERE m.organization_id = nexus_ai_settings.organization_id
      AND m.user_id = (SELECT auth.uid())
      AND m.status = 'active'::public.membership_status
      AND m.role IN ('owner'::public.workspace_role, 'admin'::public.workspace_role)
  )
)
WITH CHECK (
  private.has_permission(organization_id, 'intelligence.manage')
  AND EXISTS (
    SELECT 1
    FROM public.organization_memberships m
    WHERE m.organization_id = nexus_ai_settings.organization_id
      AND m.user_id = (SELECT auth.uid())
      AND m.status = 'active'::public.membership_status
      AND m.role IN ('owner'::public.workspace_role, 'admin'::public.workspace_role)
  )
);

DROP POLICY IF EXISTS nexus_ai_usage_read_scope ON public.nexus_ai_usage_events;
CREATE POLICY nexus_ai_usage_read_scope
ON public.nexus_ai_usage_events
FOR SELECT
TO authenticated
USING (
  (
    user_id = (SELECT auth.uid())
    AND private.has_permission(organization_id, 'intelligence.use')
  )
  OR (
    private.has_permission(organization_id, 'intelligence.usage.view')
    AND EXISTS (
      SELECT 1
      FROM public.organization_memberships m
      WHERE m.organization_id = nexus_ai_usage_events.organization_id
        AND m.user_id = (SELECT auth.uid())
        AND m.status = 'active'::public.membership_status
        AND m.role IN ('owner'::public.workspace_role, 'admin'::public.workspace_role)
    )
  )
);

DROP POLICY IF EXISTS memberships_read_authorized ON public.organization_memberships;
DROP POLICY IF EXISTS memberships_read_self ON public.organization_memberships;
CREATE POLICY memberships_read_authorized_or_self
ON public.organization_memberships
FOR SELECT
TO authenticated
USING (
  (SELECT private.has_permission(organization_id, 'members.view'))
  OR (
    user_id = (SELECT auth.uid())
    AND status = 'active'::public.membership_status
  )
);

DROP POLICY IF EXISTS profiles_read_authorized_directory ON public.profiles;
DROP POLICY IF EXISTS profiles_read_self ON public.profiles;
CREATE POLICY profiles_read_self_or_authorized_directory
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.organization_memberships m
    WHERE m.user_id = profiles.id
      AND m.status = 'active'::public.membership_status
      AND (
        (SELECT private.has_permission(m.organization_id, 'people.directory.view'))
        OR (SELECT private.has_permission(m.organization_id, 'members.view'))
      )
  )
);
