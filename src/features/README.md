# Spacia Feature Architecture Conventions

This directory is the designated home for domain-specific feature modules.

To keep the application scalable and prevent `components/` from accumulating hundreds of unstructured files, domain logic is colocated within feature slices.

---

## 1. Feature Structure Convention

When implementing a vertical slice (e.g. `leads`, `calls`, `appointments`), organize the feature module using the following pattern:

```text
features/<feature-name>/
├── components/        # Feature-specific UI components (e.g., LeadCard, CallAudioPlayer)
├── hooks/             # Feature-specific React hooks (e.g., useLeads, useCallRecording)
├── services/          # Feature API clients and query definitions (e.g., leadsService)
├── types/             # Feature-specific TypeScript models and payloads
└── index.ts           # Explicit public exports for consumers outside this feature
```

---

## 2. Planned PRD Feature Domains

As defined in the Spacia Product Requirements Document (PRD V1), future vertical slices include:

- `leads`: Intake, qualification scoring (Hot/Warm/Cold), timeline, budget, and assignment.
- `conversations`: AI conversational qualification logs, message streams, transcript review.
- `calls`: AI voice calls, outcomes, audio recordings, structured summaries, and next actions.
- `appointments`: Connected calendar viewing slots, confirmations, and reminders.
- `analytics`: Funnel metrics (leads → contacted → qualified → booked → won).
- `agent-config`: AI sales personality, voice tone, escalation rules, and knowledge bounds.
- `integrations`: External CRM webhooks, calendar sync, and client system adapters.
- `team`: Sales agent routing, availability schedules, and territory/specialty mapping.

---

## 3. Co-location Rules

1. **Feature-private by default**: If a component or helper is only used within a feature, keep it inside `features/<feature-name>/components/`.
2. **Promotion to Shared UI**: If a component is genuinely generic and reused across multiple unrelated domains (e.g. standard modals, tables, badge filters), place it in `src/components/shared/` or `src/components/ui/`.
3. **App Router Integration**: Route handlers in `src/app/(app)/<route>/page.tsx` should remain thin orchestrators that compose feature components.
