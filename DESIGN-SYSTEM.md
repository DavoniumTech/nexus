# Davonium Nexus — Interface System

## Product principles

1. **Operational clarity first.** Put the next useful action, current state, and owner-facing context before decoration.
2. **One navigation grammar.** Persistent workspace sidebar, clear section headings, familiar page actions, consistent tabs, and reusable panels.
3. **Dense data, calm presentation.** Tables are scannable, labels are restrained, statuses use a small semantic palette, and empty/loading/error states explain what happened.
4. **Keyboard is a first-class path.** `Ctrl/⌘ + K` opens global search; arrow keys move through results; Enter opens the selected item; Escape closes overlays.
5. **Permission-aware by design.** Role-scoped navigation and privileged controls reflect known access, while every server action remains independently authorised by the existing backend.
6. **AI has visible limits.** DVNM Intelligence is a read-only company-data experience with surfaced usage and consent controls, not a floating unrestricted bot.
7. **Mobile is a real workspace.** Tables and navigation adapt to narrow screens; controls remain touch-sized and overlays stay contained.

## Visual language

- **Canvas:** deep navy (`#07111f`) with a secondary navy surface (`#091727`).
- **Surfaces:** layered blue-black cards (`#0d1b2c`, `#102238`, `#142a40`) with subtle blue-grey strokes.
- **Primary accent:** electric cyan (`#47d9f3`, secondary `#16b8db`).
- **Supporting accents:** blue (`#5c8fff`) and violet (`#9c83ff`).
- **Semantic states:** green for healthy/success, amber for pending/degraded, and red for errors/outages/denials. Unknown states are not styled as healthy.
- **Typography:** DM Sans for interface text and Manrope for titles and compact emphasis.
- **Shape:** rounded cards, pills, dialogs and controls; avoid sharp, heavy dashboard panels.
- **Atmosphere:** subtle starfield and restrained cyan/violet bloom kept behind the work surface.

## Interaction patterns

- Reusable page headers, actions, metric cards, panels, status pills, table shells, activity rows, property grids, and modal forms.
- Command palette supports keyboard selection and direct navigation to workspace sections and actions.
- Data-heavy areas separate portfolio, metrics, definitions, integrations, history, releases and review into tabs instead of one overloaded grid.
- Destructive operations are confirmed; private downloads use short-lived signed URLs; archive actions preserve backend history.
- `:focus-visible` provides keyboard focus, and reduced-motion preferences disable non-essential motion.

## Reference research

The patterns were reviewed from current product documentation and interface examples. The implementation adapts ideas rather than copying screen layouts:

- [Linear issue selection and keyboard actions](https://linear.app/docs/creating-issues) and [display options](https://linear.app/docs/display-options): keyboard movement, consistent list/board controls, and focused context.
- [Raycast navigation](https://manual.raycast.com/navigation) and [UI components](https://developers.raycast.com/api-reference/user-interface): grouped commands, fast keyboard navigation, and purposeful list/detail/form surfaces.
- [Attio navigation](https://attio.com/help/reference/attio-101/introduction-to-navigating-attio) and [workflows](https://attio.com/help/academy/introduction/workflows): clear sidebar zones, search, records and context-oriented workflows.
- [Stripe dashboard design case study](https://www.tylerberg.co/dashboard-page-templates): consistent data patterns and responsive table presentation.
- [Vercel dashboard tour](https://blog.vercel.com/academy/optimize-your-vercel-account/tour-the-dashboard) and [logs](https://vercel.com/docs/logs): separated team controls, operational signals, filters and incident investigation.
- [Notion table views](https://www.notion.com/help/tables): structured records with sortable/filterable views and row-level actions as a useful database mental model.
