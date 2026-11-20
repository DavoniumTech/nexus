# Davonium Nexus — Beta UI V2

**Branch:** `beta/nexus-ui-v2-chat-experience`  
**Scope:** Frontend shell, readability, brand mark, mobile navigation, and DVNM Intelligence presentation.

## What changed

- Replaced the text-based placeholder D/star brand tile with the original Davonium D logo sourced from the corporate website repository. The corporate website itself was not modified.
- Added a dedicated V2 style layer so the original frontend remains available for comparison and rollback.
- Increased navigation, page headings, table, form, button, prompt, and supporting text sizes across the workspace.
- Reworked DVNM Intelligence presentation into a focused AI workspace: compact Nexus module rail, separate conversation history, spacious message area, larger readable assistant responses, and a prominent composer.
- Kept the existing conversation, policy, usage, capability, and chat Edge Function calls; no AI limits or backend security controls were changed.
- Fixed the desktop sidebar collapse class mismatch.
- Improved mobile menu state feedback and drawer stacking/visibility.
- Added reduced-motion handling for the new interface layer.

## Not changed

- No corporate website source files were changed.
- No Supabase tables, policies, Edge Functions, secrets, or settings were modified.
- No service-role key, Gemini key, or ledger key was added to the frontend.
- No claims are made that live authenticated data/write flows have passed end-to-end tests.

## QA status

- Source-level change review completed.
- Automated browser/device visual QA and authenticated Supabase smoke testing remain pending.
- This is a beta candidate for owner review, not a claim of production certification.
