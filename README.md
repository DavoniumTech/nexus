# Davonium Nexus — Company Operating System

A responsive, static web application for the existing Davonium Technologies Supabase Nexus. It brings the company's delivery, people, clients, products, governance, documents, communication, security, and read-only intelligence workflows into one authenticated interface.

## What is included

- Command centre: live Nexus overview, delivery signals, project status, service status, incidents, and notifications.
- Execution: projects, tasks, project members, milestones, task discussions, project decision records, and deadlines.
- Company operations: client accounts, members, invitations, role and membership administration, teams, departments, and permission overrides.
- Product operations: product catalogue, metric definitions, verified metrics, manual-metric review, metric history, integration records, ingestion history, and release notes.
- Governance: objectives, key results, decision ledger, weekly company reviews, investor updates, and investor access.
- Secure collaboration: private document upload/download, controlled client visibility, channels, direct messages, membership administration, moderation, announcements, and personal inbox/preferences.
- DVNM Intelligence: persistent company conversations, service/policy/usage information, and read-only data analysis under existing server-side quotas and consent checks.
- Control: service telemetry, recorded service components, incidents, session assurance, audit history, effective permission catalogue, and secure connection settings.
- Role-scoped client and investor portal pages.

## Run requirements

This is a static HTML/CSS/JavaScript app. No package installation, Node build, Docker, CLI, or server-side application runtime is required. Serve the repository root as static files.

On first open, select **Connection settings** and enter:

- Project URL: `https://cmkroryimxskgqlaiiym.supabase.co`
- Key: the Supabase **publishable** key (or legacy anon key) from the project's API settings.

Then sign in with an existing, active Davonium Nexus account. The app resolves the Nexus using its signed-in session and the `davonium-technologies` slug. The default Nexus URL is already configured; the browser key is intentionally not included in the repository.

## Backend integration

The frontend calls the existing 17 deployed Supabase Edge Functions. See [`backend-reference/EDGE-FUNCTION-ACTION-MAP.md`](backend-reference/EDGE-FUNCTION-ACTION-MAP.md) for the URL slugs, user-facing actions, and server-only operations deliberately not exposed to the browser.

All Nexus writes are sent through the existing Edge Functions and their database permission/RLS checks. The app does not directly write to company tables from the browser. The private document workflow uses a signed upload request followed by metadata registration; downloads use short-lived signed URLs. The private bucket is `nexus-private-documents`; the frontend enforces the backend's 25 MB upload limit and supported MIME types.

## Security boundaries

- Never paste a Supabase `service_role` key into the browser. The app rejects a decoded service-role JWT and only accepts a publishable/anon project key.
- Gemini API keys and `NEXUS_AI_LEDGER_KEY` remain in Supabase Edge Function Secrets. They are never referenced as browser configuration values.
- Authentication is handled by Supabase Auth. Every Edge Function call carries the publishable API key and the current signed-in user's access token.
- The database and Edge Functions are authoritative. Hiding a button is not a security boundary.
- The frontend does not expose trusted monitor execution, integration provider tests, notification provider tests, or trusted-server notification creation.
- DVNM Intelligence is not presented as an unrestricted general-purpose agent. It remains read-only and does not bypass the deployed budget, rate, output-token, or permission policies. The enable flow requires explicit Nexus consent confirmation.

## Design direction

Davonium's dark navy, cyan and blue identity, subtle star field, soft glow, and rounded surfaces are retained. The interaction system combines focused Nexus navigation, a keyboard-driven command palette, consistent data-table and status treatments, role-aware operational views, and clear service-state/empty/error messaging. The interface draws on published product patterns from Linear, Raycast, Attio, Stripe dashboard design work, Vercel observability, and Notion database views; it is an original Davonium interface, not a copy of another product.

See [`DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md) for the design principles and tokens.

## Verification note

The frontend source was syntax-checked and the static shell was served locally during preparation. The app has not been authenticated against the owner's live Nexus in this build environment, so account-specific permissions, real data, and every write path still require a signed-in browser verification after the correct publishable key is entered. The deployed Supabase functions and database were not changed by this frontend build.


## Appearance and readability

Nexus supports **Dark**, **Light** and **System** appearance. System mode follows the operating-system or browser colour preference, while explicit choices are persisted in the current browser. The interface uses responsive typography and adaptive layouts for desktop, tablet and mobile screens.

The executive overview combines live command-centre, organisation, analytics, project, notification, monitoring, product, objective and integration data. It displays unavailable values as unavailable rather than converting failed or missing data into zero.

The official Davonium D-mark is loaded from the corporate asset at `https://www.davoniumtech.com/assets/images/davonium-d-icon.webp`.
