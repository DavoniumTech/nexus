# Davonium Nexus — Company Operating System

A responsive, static web application for the existing Davonium Technologies Supabase project. It brings the company's delivery, people, clients, products, governance, documents, communication, security, and read-only intelligence workflows into one authenticated interface.

## What is included

- Nexus Overview: live executive signals for delivery, project progress, products, strategy, services, incidents, integrations, and notifications.
- Execution: projects, tasks, project members, milestones, task discussions, project decision records, and deadlines.
- Company operations: client accounts, members, invitations, role and membership administration, teams, departments, and permission overrides.
- Product operations: product catalogue, metric definitions, verified metrics, manual-metric review, metric history, integration records, ingestion history, and release notes.
- Governance: objectives, key results, decision ledger, weekly company reviews, investor updates, and investor access.
- Secure collaboration: private document upload/download, controlled client visibility, channels, direct messages, membership administration, moderation, announcements, and personal inbox/preferences.
- DVNM Intelligence: persistent **General Assistant** and **Company Intelligence** conversations. General Assistant does not query company records; Company Intelligence uses permission-scoped, read-only Nexus data tools. Both use server-side request, input, output-token and monthly-cost safeguards. Owner controls expose capacity settings.
- Control: service telemetry, recorded service components, incidents, session assurance, audit history, effective permission catalogue, and secure connection settings.
- Role-scoped client and investor portal pages.

## Run requirements

This is a static HTML/CSS/JavaScript app. No package installation, Node build, Docker, CLI, or server-side application runtime is required. Serve the repository root as static files.

On first open, select **Connection settings** and enter:

- Project URL: `https://cmkroryimxskgqlaiiym.supabase.co`
- Key: the Supabase **publishable** key (or legacy anon key) from the project's API settings.

Then sign in with an existing, active Davonium Nexus account. The app resolves the Davonium Technologies organisation using its signed-in session and the `davonium-technologies` slug. The Supabase project URL is already configured; the browser key is intentionally not included in the repository.

## Backend integration

The frontend calls the existing 17 deployed Supabase Edge Functions. See [`backend-reference/EDGE-FUNCTION-ACTION-MAP.md`](backend-reference/EDGE-FUNCTION-ACTION-MAP.md) for the URL slugs, user-facing actions, and server-only operations deliberately not exposed to the browser.

All Nexus writes are sent through the existing Edge Functions and their database permission/RLS checks. The app does not directly write to company tables from the browser. The private document workflow uses a signed upload request followed by metadata registration; downloads use short-lived signed URLs. The private bucket is `nexus-private-documents`; the frontend enforces the backend's 25 MB upload limit and supported MIME types.

## Security boundaries

- Never paste a Supabase `service_role` key into the browser. The app rejects a decoded service-role JWT and only accepts a publishable/anon project key.
- Gemini API keys and `NEXUS_AI_LEDGER_KEY` remain in Supabase Edge Function Secrets. They are never referenced as browser configuration values.
- Authentication is handled by Supabase Auth. Every Edge Function call carries the publishable API key and the current signed-in user's access token.
- The database and Edge Functions are authoritative. Hiding a button is not a security boundary.
- The frontend does not expose trusted monitor execution, integration provider tests, notification provider tests, or trusted-server notification creation.
- General Assistant and Company Intelligence are separate conversation modes. General Assistant does not access private company records. Company Intelligence can only read the signed-in user's permitted Nexus records. Both modes require an enabled service policy, server-side provider and ledger secrets, and usage reservation. Google AI Studio Free Tier content-use terms must be reviewed and explicitly accepted before company data is sent to the provider.

## Design direction

Davonium's dark navy, cyan and blue identity, subtle star field, soft glow, and rounded surfaces are retained. The interaction system combines focused Nexus navigation, a keyboard-driven command palette, consistent data-table and status treatments, role-aware operational views, and clear service-state/empty/error messaging. The interface draws on published product patterns from Linear, Raycast, Attio, Stripe dashboard design work, Vercel observability, and Notion database views; it is an original Davonium interface, not a copy of another product.

See [`DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md) for the design principles and tokens.

## Verification note

The frontend JavaScript is checked by the repository's GitHub Actions workflow, including the `backend-*` development branch. Chromium smoke tests cover the sign-in shell, official Davonium logo asset, theme preferences, reflow from 320 CSS pixels and the authenticated overview fixture. The live authenticated account must still be tested separately. The app has not been authenticated against the owner's live Nexus in this build environment, so account-specific permissions, real data, and every write path still require a signed-in browser verification after the correct publishable key is entered. The deployed Supabase functions and database were not changed by this frontend build.


## Appearance and readability

Nexus supports **Dark**, **Light** and **System** appearance. System mode follows the operating-system or browser colour preference, while explicit choices are persisted in the current browser. The interface uses responsive typography and adaptive layouts for desktop, tablet and mobile screens.

The executive overview combines live command-centre, organisation, analytics, project, notification, monitoring, product, objective and integration data. It displays unavailable values as unavailable rather than converting failed or missing data into zero.

The official Davonium D-mark is loaded from the corporate asset at `https://www.davoniumtech.com/assets/images/davonium-d-icon.webp`.


## Frontend validation

GitHub Actions runs the JavaScript syntax and static asset checks, followed by a Chromium/Playwright browser smoke test. The browser test exercises the unauthenticated sign-in shell in Dark, Light and System appearance at 320, 360, 390, 768, 1024, 1280 and 1440 CSS pixels. It checks that the official Davonium mark loads, readable body and input text remain at least 16px, visible copy contains no legacy organisation terminology, and layouts do not develop horizontal overflow. Representative desktop and mobile screenshots are uploaded as the `nexus-visual-smoke` workflow artifact.

The browser smoke test uses an isolated stub Supabase client because it verifies the static, signed-out shell only. It does **not** authenticate against the owner's project, invoke company data actions, or test Gemini. Those live checks must be performed using an authorised account in the deployed environment.
