# Spacia (SpaciaOS) — AI Sales Command Center

> **Spacia** is a high-performance, managed AI sales orchestration platform purpose-built for modern real-estate brokerages and development firms. It autonomously captures inbound property inquiries, engages prospects via natural voice and chat, qualifies buyers against stringent underwriting criteria, evaluates purchasing power and timeline, and seamlessly books qualified viewings directly onto connected sales agents' calendars.

This repository houses the **production frontend implementation for Days 1 through 9** of the Spacia MVP.

---

## 1. Project Overview & Product Summary

Spacia acts as an automated sales acceleration layer positioned between inbound marketing channels (Meta Ads, Google, PropertyPortals, WhatsApp, Direct Calls) and real-estate sales teams:

- **Autonomous Intake**: Immediate sub-second contact with new leads across voice calls, WhatsApp, and web inquiries.
- **Intelligent Qualification**: Structured scoring against budget, timeline, location preference, financing readiness, and decision-maker status (BANT+ criteria).
- **Human-in-the-Loop Supervision**: Real-time observability over AI calls, transcript inspections, and single-click broker takeover protocols.
- **Zero-Friction Conversion**: Automated scheduling of in-person property inspections on agent calendars with automatic confirmation and reminder sequences.

---

## 2. Current Implementation Status

| Milestone | Status | Description |
| :--- | :---: | :--- |
| **Day 1: Foundation** | **COMPLETE** | Next.js 16 (Turbopack) App Router architecture, TypeScript strict mode, Tailwind CSS v4, shadcn/ui component library, design token taxonomy, responsive shell, routing foundation, and global error/loading boundaries. |
| **Day 2: Visual / Dashboard Pass** | **COMPLETE** | Refined light-mode-first aesthetic with Pacia Green (`#0d4a36`), warm off-white canvas (`#fbfbf9`), live AI activity feed, lead intake table, resizable Lead Dossier side-panel with simulated audio player & qualification matrix, pipeline funnel, appointments drawer, calls module, analytics date filtering, team roster, settings, command palette, notifications, and CSV export. |
| **Day 3: Authentication & Workspace** | **COMPLETE & APPROVED** | Full production Clerk authentication integration, responsive 50/50 split auth shell with typewriter animation, interactive password requirements validation, forgot password reset modal, Google sign-up detection & guidance, protected application routes via proxy middleware, authenticated user context (`AuthProvider`), multi-tenant workspace/organization context (`WorkspaceProvider` & header switcher), unauthorized/no-workspace guard state, and interactive sidebar user account menu with sign-out. *(Frontend integration complete; establishes auth contract for future backend services).* |
| **Day 4: Core Domain Database UI Primitives** | **COMPLETE** | Production-ready suite of reusable command-center UI primitives: strongly-typed generic `DataTable` (sorting, pagination, search filter, skeleton/empty states), domain-aware `StatusBadge` (HOT/WARM/COLD, lifecycle stages, call outcomes, pulsing live dots), multi-variant `ScoreIndicator` (badge, gauge, 5-point BANT breakdown), resilient edge states (`EmptyState` presets, `ErrorState` with technical details accordion, `TableSkeleton`, `Skeleton`), modal & drawer patterns (`ConfirmDialog`, `DetailDrawer`), basic form suite (`SearchInput`, `CurrencyInput` with Nigerian Naira ₦ formatting, `Textarea`, `Checkbox`, `Switch`, `FormField`), and an interactive showcase testbench (`/primitives`). |
| **Day 5: Lead-Management Foundation** | **COMPLETE** | Production-ready dedicated Lead Management foundation: modular `features/leads` domain module, strongly-typed `Lead` models, decoupled `leadsService` with mock API contract fallback, operational `LeadTable` built on `DataTable<Lead>` (Prospect, Property / Interest, Budget, Score, Status, Next Action), foundational `LeadFiltersBar` (text search, score category chips, domain status dropdown, filter reset), explainable `ScoreIndicator` presentation, and the `LeadDetailShell` establishing the dossier information architecture in a slide-over `DetailDrawer`. |
| **Day 6: Complete Lead Workflow UI** | **COMPLETE** | Complete, operational Lead Workflow System: interactive `LeadStatusSelect` with live domain lifecycle transitions, high-priority `LeadNextActionCard` with actionable protocol directives, real-estate `LeadPropertyCard` (property specs, bedrooms/bathrooms, floor area, asking price vs declared budget alignment), 5-point BANT+ `LeadQualificationCard` (Budget, Authority, Need, Timeline, Property Fit with simulated AI underwriting notes), chronological `LeadActivityTimeline` (multi-channel event stream tracking inbound capture, voice calls, WhatsApp brochures, viewing appointments, and broker memo additions), column sorting on `LeadTable`, and client-side CSV export. |
| **Day 7: Usable Property Information in Lead Workflows** | **COMPLETE** | Production-ready real-estate property domain (`features/properties`) integrated into lead workflows: strongly-typed `Property` entity, BANT commercial specs, legal title deed verification details, `PropertiesService` with mock API contract fallback, domain `PropertyAvailabilityBadge` (`Available`, `Under Offer`, `Sold`, `Reserved`, `Unavailable`, `Unknown`), `PropertyVerificationBadge` (`Verified`, `Pending Verification`, `Unverified`), operational `PropertyCard` (Price, Location, Beds, Baths, Floor Area, Verified Features chips, Availability & Verification badges, and full specs inspection trigger), deep-dive `PropertyDetailPresentation` modal (high-res photo gallery, thumbnail strip, legal title underwriting audit, HOA service charges, minimum deposits, payment milestones), resilient `PropertyUnknownState` for general inquiries lacking linked inventory with criteria match trigger, and proactive `PropertyUnavailableState` for off-market/sold inventory with alternative recommendations. |
| **Day 8: Event System & Automation Foundation** | **COMPLETE & VERIFIED** | Production-ready asynchronous event and automation architecture (`features/events`): strongly-typed workflow lifecycle statuses (`queued`, `in_progress`, `completed`, `failed`, `retrying`, `blocked`), polymorphic `ActivityEventCard`, resilient `WorkflowRetryState` with backoff countdown timer, retry triggers, and diagnostic logs, distinct `AIActivityIndicator` vs `HumanActivityIndicator` actor attribution, live `AutomationEventFeed` with actor filtering and event simulation, upgraded `LeadActivityTimeline`, and interactive testbench at `/primitives`. |
| **Day 9: AI Sales Agent Interface** | **COMPLETE & VERIFIED** | Production-ready autonomous AI Sales Agent command center (`features/ai-agent`): strongly-typed agent engine status and live telemetry (`AIAgentStatusCard`), interactive dialer pause/resume toggle with in-memory persistence, comprehensive configuration presentation (`AIAgentConfigPresentation`) detailing Neural Executive voice persona, 5-point BANT qualification gates, and legal safety guardrails (3-call max attempt cap, quiet hours, DNC policy), live active call radar (`AIAgentActivityState`) with real-time waveform equalizer, duration timer, and speech transcript stream, recent agent execution feed, and standardized AI confidence & buyer intent UI primitives (`IntentConfidenceGauge`, `BuyerIntentBadge`, `IntentSignalPill`, `BuyerIntentCard`). Integrated into `/ai-agent` and testbench at `/primitives` (Section 8). |

---

## 3. Technology Stack

- **Framework**: [Next.js 16.3.4](https://nextjs.org/) (App Router, Turbopack, React Server Components by default)
- **UI Library**: [React 19.2.8](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/) (Strict mode enabled, zero loose any types)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with CSS variables and PostCSS
- **Component Primitives**: [shadcn/ui](https://ui.shadcn.com/) backed by [@radix-ui](https://www.radix-ui.com/)
- **Iconography**: [Lucide React](https://lucide.dev/) & [Hugeicons React](https://hugeicons.com/)
- **Data Visualization**: [Recharts](https://recharts.org/) with responsive chart containers
- **Panels & Drawers**: [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels) and [Vaul](https://vaul.emilkowal.ski/)
- **Notifications & Toasts**: [Sonner](https://sonner.emilkowal.ski/)
- **Validation**: [Zod](https://zod.dev/)

---

## 4. Visual Design Direction

Spacia adheres to an editorial, high-trust luxury financial and real-estate design language:

- **Light-Mode-First Canvas**: The primary application background uses a warm, softened stone off-white (`#fbfbf9` / `bg-[#fbfbf9]`) paired with pure white cards (`#ffffff`) and crisp borders (`#e7e5e4`).
- **Signature Pacia Green**: Primary accents, brand marks, and high-priority call-to-actions utilize deep evergreen Pacia Green (`#0d4a36`), with subtle emerald highlights (`emerald-600`, `emerald-50`).
- **Qualification Accents**:
  - **Hot Leads**: Deep crimson/rose badges (`#be123c`, `bg-rose-50`) indicating 85%+ qualification score.
  - **Warm Leads**: Amber/golden badges (`#b45309`, `bg-amber-50`) indicating 60–84% qualification score.
  - **Cold / Unqualified**: Neutral slate (`#64748b`, `bg-slate-100`).
- **Typography & Rhythm**: High-legibility sans stack (`Plus Jakarta Sans` / system UI) with tabular monospace numerals (`font-mono font-semibold tabular-nums`) for currency and percentages. High information density without visual clutter.

---

## 5. Application Architecture & Folder Structure

```text
src/
├── app/                                 # Next.js App Router
│   ├── (app)/                           # Authenticated workspace shell
│   │   ├── layout.tsx                   # Shell layout with AppSidebar & Header
│   │   ├── dashboard/page.tsx           # Overview / Executive Command Center
│   │   ├── leads/page.tsx               # Leads Intake & Qualification Management
│   │   ├── calls/page.tsx               # AI Voice Call Logs & Audio Playback
│   │   ├── appointments/page.tsx        # Inspection Bookings & Scheduling Drawer
│   │   ├── analytics/page.tsx           # Conversion Funnels & Date Range Selector
│   │   ├── conversations/page.tsx       # Multi-channel Chat & Messaging
│   │   ├── team/page.tsx                # Sales Broker Roster & Routing Rules
│   │   ├── ai-agent/page.tsx            # Voice Persona & Prompt Tuning
│   │   ├── integrations/page.tsx        # CRM & Telephony Connectors
│   │   └── settings/page.tsx            # Workspace Profile & System Config
│   ├── globals.css                      # Design tokens, variables & typography
│   ├── layout.tsx                       # Root HTML document & metadata
│   ├── loading.tsx                      # Root loading spinner
│   ├── error.tsx                        # Root route error boundary
│   └── not-found.tsx                    # 404 handler
│
├── components/
│   ├── layout/                          # App Shell components
│   │   ├── app-shell.tsx                # Dynamic sidebar + header layout
│   │   ├── app-sidebar.tsx              # PRD-aligned navigation & workspace switcher
│   │   ├── app-header.tsx               # Search trigger, breadcrumbs & notifications
│   │   ├── container.tsx                # Responsive max-width container
│   │   ├── page-header.tsx              # Standardized page title & actions
│   │   └── notification-menu.tsx        # Live notification dropdown
│   ├── ui/                              # shadcn/ui primitives
│   │   ├── button.tsx                   # Button with variant & size presets
│   │   ├── badge.tsx                    # Hot, warm, status badges
│   │   ├── card.tsx                     # Content containers
│   │   ├── table.tsx                    # Accessible data tables
│   │   ├── drawer.tsx                   # Vaul mobile/desktop drawer
│   │   ├── select.tsx                   # Accessible dropdown select
│   │   ├── popover.tsx                  # Radix popover container
│   │   ├── calendar.tsx                 # Datepicker calendar grid
│   │   ├── command-search.tsx           # Cmd+K quick launcher
│   │   └── ...                          # Dialog, Tooltip, Avatar, Input, etc.
│   └── shared/                          # Common display states
│       ├── empty-state.tsx
│       ├── error-state.tsx
│       └── loading-spinner.tsx
│
├── features/                            # Domain-driven feature slices
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── stat-metric-card.tsx     # Executive KPI cards with trend indicators
│   │   │   ├── lead-intake-table.tsx    # Interactive leads data table
│   │   │   ├── lead-dossier-panel.tsx   # Resizable dossier with playback & BANT
│   │   │   ├── ai-agent-live-feed.tsx   # Real-time event activity ticker
│   │   │   ├── pipeline-funnel.tsx      # Multi-stage conversion chart
│   │   │   └── upcoming-viewings-list.tsx# Scheduled calendar viewings
│   │   ├── data/
│   │   │   └── mock-data.ts             # Deterministic mock datasets
│   │   └── types/
│   │       └── index.ts                 # Domain models (Leads, Calls, Viewings)
│   │
│   └── leads/                           # Day 5 & 6 Complete Lead Workflow domain
│       ├── components/
│       │   ├── lead-table.tsx           # Operational table with client-side sorting
│       │   ├── lead-filters-bar.tsx     # Foundational filters (Search, Score, Status)
│       │   ├── lead-detail-shell.tsx    # Complete broker command center in DetailDrawer
│       │   ├── lead-status-select.tsx   # Live lifecycle stage selector dropdown
│       │   ├── lead-next-action-card.tsx# High-priority operational directive card
│       │   ├── lead-property-card.tsx   # Property specs & photo showcase gallery
│       │   ├── lead-qualification-card.tsx # 5-point BANT underwriting & AI notes
│       │   └── lead-activity-timeline.tsx # Event stream, broker memo & photo upload
│       ├── data/
│       │   └── mock-leads.ts            # Realistic Nigerian luxury real-estate leads
│       ├── services/
│       │   └── leads-service.ts         # Leads API service, mock session store & CSV export
│       └── types/
│           └── index.ts                 # Strongly-typed Lead domain models
│
├── lib/
│   ├── config/                          # Site metadata & environment schemas
│   │   ├── env.ts                       # Zod client/server env validation
│   │   └── site.ts                      # Navigation and workspace presets
│   ├── constants/
│   │   └── navigation.ts                # App route taxonomy & icons
│   ├── context/
│   │   ├── workspace-context.tsx        # Workspace state & switching logic
│   │   └── auth-context.tsx             # User session & permissions
│   └── utils/
│       ├── cn.ts                        # Tailwind class merge helper
│       └── export-csv.ts                # Client-side CSV generator & download
│
└── types/                               # Core shared interfaces
    ├── auth.ts                          # User & workspace session definitions
    ├── common.ts                        # Async state & layout props
    └── navigation.ts                    # Route definitions
```

---

## 6. Local Development Setup Instructions

### Prerequisites
- **Node.js**: `v20.x` or higher (LTS recommended)
- **Package Manager**: `npm` or `pnpm`

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MikkyInnovate/SpaciaOS.git
   cd SpaciaOS
   ```

2. **Checkout the frontend branch:**
   ```bash
   git checkout frontend
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Prepare environment variables:**
   ```bash
   cp .env.example .env.local
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open in your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000). The application automatically redirects to the active `/dashboard`.

---

## 7. Environment Variables Guide

Reference `.env.example` for all configurable variables:

```bash
# ------------------------------------------------------------------------------
# 1. CLIENT-SAFE CONFIGURATION (Exposed to browser bundle)
# ------------------------------------------------------------------------------
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Spacia
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
NEXT_PUBLIC_DEFAULT_WORKSPACE_ID=ws_default_spacia

# ------------------------------------------------------------------------------
# 2. SERVER-ONLY CONFIGURATION (Never bundled to client)
# ------------------------------------------------------------------------------
NODE_ENV=development
BACKEND_API_URL=http://localhost:8000
BACKEND_API_KEY=your_backend_api_key_here
WEBHOOK_SIGNING_SECRET=your_webhook_signing_secret_here
```

---

## 8. Scripts Reference

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Next.js Turbopack development server on `http://localhost:3000` |
| `npm run build` | Compiles an optimized production build with static generation |
| `npm run start` | Boots the compiled production server |
| `npm run lint` | Runs ESLint 9 across all source files (clean output, 0 errors, 0 warnings) |
| `npm run type-check`| Runs TypeScript compiler (`tsc --noEmit`) to verify type soundness |

---

## 9. Core Features Implemented So Far

- **Command Center Dashboard Shell**: Responsive multi-column layout with collapsable sidebar, breadcrumb trail, and user profile switchers.
- **Real-Time KPI Metric Cards**: Intake volume, active call duration, qualification rates, and booked viewings with delta comparisons.
- **Live AI Agent Event Feed**: Real-time event stream showing call connections, AI qualification decisions, objection handling, and calendar syncs.
- **Lead Intake Table**: Tabular lead management with HOT/WARM/COLD status badges, property tags, broker assignments, search, and pagination.
- **Resizable Lead Dossier Panel**: Expandable side-drawer with tabbed views for:
  - Full AI audio call transcripts.
  - Interactive call playback scrubber with play/pause simulation.
  - 5-point BANT qualification breakdown (Budget, Authority, Need, Timeline, Property Fit).
  - One-click broker takeover trigger.
- **Upcoming Property Viewings**: Timeline list of confirmed physical inspections, assigned sales agents, and direct calendar links.
- **Pipeline Conversion Funnel**: Multi-stage visual drop-off analysis from inquiry to qualified prospect to viewing.
- **Appointments Module**: Calendar booking management with a bottom slide-up drawer for booking new inspections and property filtering.
- **Calls Module**: Call log inspector with duration filters, sentiment tags, audio playback controls, and transcript inspection drawers.
- **Analytics Module**: Period filtering with custom date picker popover and preset monthly views (MTD, past month, custom ranges).
- **Team Roster & Routing**: Sales associate directory with territory assignments, lead quotas, and calendar synchronization indicators.
- **Settings Module**: Workspace profile, brand customization, and notification preferences.
- **Global Command Palette (`Cmd+K` / `Ctrl+K`)**: Modal search allowing navigation between pages and quick lead lookups.
- **CSV Data Export**: Single-click client-side CSV download of all current leads and qualification data.

---

## 10. Mock Data Strategy & Live API Transition

All data utilized across Day 1 and Day 2 lives in `@/features/dashboard/data/mock-data.ts`. The schema directly mirrors the target API contracts:
- `DashboardLead`: Matches `/api/v1/leads` response.
- `DashboardAICallEvent`: Matches `/api/v1/calls/events` WebSocket stream.
- `UpcomingViewing`: Matches `/api/v1/appointments` response.
- `PipelineFunnelStage`: Matches `/api/v1/analytics/funnel` payload.

**Transitioning to Live APIs (Day 3)**:
1. Replace mock imports in feature components with TanStack Query (`useQuery`, `useMutation`) or native Server Component fetchers.
2. Direct all calls through the typed client in `@/lib/config/env.ts` (`NEXT_PUBLIC_API_BASE_URL`).
3. Connect the `AIAgentLiveFeed` component to a WebSocket or SSE endpoint (`/api/v1/stream/ai-feed`).

---

## 11. State Management Approach

Spacia utilizes React Context for global app states and localized state for UI interactions:

1. **`WorkspaceContext` (`@/lib/context/workspace-context.tsx`)**:
   - Manages active workspace (`currentWorkspaceId`, `currentWorkspace`).
   - Provides workspace switching (`setWorkspaceId`) across multi-tenant brokerage setups.
2. **`AuthContext` (`@/lib/context/auth-context.tsx`)**:
   - Manages authenticated user session, role, and sign-out logic.
3. **Local Component State**:
   - Drawer/modal visibility, search queries, table pagination, and audio player states are kept localized within their respective feature boundaries for performance.

---

## 12. Design System & Component Guidelines

- **Component Architecture**: Every UI primitive is stored in `@/components/ui` following shadcn/ui and Radix UI headless conventions.
- **Class Merging**: Always use the `cn(...)` utility (`clsx` + `tailwind-merge`) when applying conditional styling or accepting custom `className` props.
- **Theme Variables**: All colors and radii are defined as CSS variables in `globals.css` ensuring rapid white-labeling and theming support.

---

## 13. Day 3 — Authentication & Workspace Architecture (Completed & Approved)

Day 3 delivered production-ready Clerk authentication, multi-tenant workspace routing, and security guardrails across the SpaciaOS frontend:

### 1. Clerk Authentication & Brand Shell
- **Responsive 50/50 Split Shell**: Luxury real-estate hero visual with dynamic typewriter animation and dotted status badge on the left, paired with a restrained white auth card on the right (`@/app/(auth)/auth-split-shell.tsx`).
- **Interactive Password Requirements**: Real-time 5-point password validation checklist (`@/components/auth/password-requirements.tsx`) with immediate feedback and visual progress (`X/5 criteria met`).
- **Forgot Password Reset**: Integrated interactive reset modal powered by Clerk's client SDK (`@/components/auth/sign-in-helper.tsx`) allowing users to request a verification code, set a new password, and sign in.
- **Google Sign-Up Detection**: Intelligent tracking that warns users when attempting password login on accounts created via Google OAuth, pointing them directly to the Google action with a "Last Used" badge.

### 2. Protected Application Routes
- **Edge Middleware Proxy**: Implemented via `@/proxy.ts` using `clerkMiddleware` and `createRouteMatcher`.
- **Public Endpoints**: Restricted to `/`, `/sign-in(.*)`, `/sign-up(.*)`, `/unauthorized(.*)`, and `/api/webhooks(.*)`.
- **Route Guarding**: All operational routes (`/dashboard`, `/leads`, `/calls`, `/appointments`, `/analytics`, `/conversations`, `/team`, `/ai-agent`, `/integrations`, `/settings`) enforce `await auth.protect()`.

### 3. Authenticated User Context
- **`AuthProvider` (`@/lib/context/auth-context.tsx`)**: Bridges Clerk user objects to the standardized Spacia `UserProfile` model.
- **Token Synchronization**: Automatically synchronizes active Clerk session JWTs with the centralized `apiClient` instance on every auth state change.

### 4. Workspace & Multi-Tenant Context
- **`WorkspaceProvider` (`@/lib/context/workspace-context.tsx`)**: Integrates directly with Clerk Organizations (`useOrganization`, `useOrganizationList`).
- **Auto-Activation & Persistence**: Automatically activates a user's single organization or restores previous session choices.
- **`WorkspaceSwitcher` (`@/components/layout/workspace-switcher.tsx`)**: Header-mounted selector supporting instant organization switching with role badges.

### 5. Unauthorized & No-Workspace State
- **`WorkspaceGuard` (`@/components/layout/workspace-guard.tsx`)**: Intercepts authenticated users without an active organization/workspace assignment.
- **`UnauthorizedState` (`@/components/shared/unauthorized-state.tsx`) & `/unauthorized`**: Explains access status, displays the authenticated user identity, and provides refresh and sign-out actions.

### 6. Account Menu
- **Interactive Sidebar User Card (`@/components/layout/app-sidebar.tsx`)**: Displays user avatar, name, email, workspace role (`Admin` / `Member`), active organization name, links to Account, Settings, and Security, and an interactive Sign Out confirmation modal.

### 7. Frontend / Backend Authentication Contract
> **Important Distinction**: Day 3 establishes the complete **Frontend Authentication & Workspace Architecture**. 
> - The frontend manages authentication flows, route protection, organization switching, and token synchronization via `apiClient.setAuthToken(token)`.
> - When backend services (FastAPI / Node.js) are connected in subsequent milestones, they will receive this Clerk JWT in the `Authorization: Bearer <token>` header to verify claims against the Clerk JWKS endpoint. Backend token verification and database syncing are part of future backend integration milestones.

---

## 14. Day 4 — Core Domain Database UI Primitives (Completed)

Day 4 delivers a standardized suite of production-grade UI primitives and data-display patterns across the PaciaOS frontend:

### 1. Generic Data Table (`@/components/ui/data-table.tsx`)
- **Type-safe `<TData>` Component**: Renders strongly-typed datasets with custom column definitions, headers, and alignments.
- **Client-Side Sorting**: Ascending, descending, and neutral toggles with visual sort indicators.
- **Dynamic Search Filtering**: Real-time query matching across configured keys or object properties with built-in clear button.
- **Integrated Pagination**: Accessible pagination controls displaying active record ranges ("Showing 1 to 5 of 12 records").
- **State-Aware Fallbacks**: Automatic rendering of `TableSkeleton` during loading, `ErrorState` during network failures, and contextual `EmptyState` when queries yield no results.

### 2. Domain Status Badges (`@/components/ui/status-badge.tsx`)
- **Comprehensive Domain Taxonomy**: Native mappings for Lead Scoring (`HOT`, `WARM`, `COLD`), Lead Lifecycle (`New`, `Qualified`, `In Conversation`, `Viewing Booked`, `Contacting`, `Follow-up`), Call Outcomes, and Appointment States.
- **Live Dot Indicators**: Optional dot accents with subtle CSS pulse animations for operational, live, or escalated calls.

### 3. Qualification Score Indicator (`@/components/ui/score-indicator.tsx`)
- **Score Representation**: Translates 0–100 numerical underwriting scores into visual indicators with calibrated color transitions (Rose 80+, Amber 60–79, Stone <60).
- **Three Display Modes**:
  - `variant="badge"`: Compact table cell badge with score and tier.
  - `variant="gauge"`: Horizontal progress track for metric cards and summary bars.
  - `variant="breakdown"`: 5-point BANT qualification matrix (Budget, Authority, Need, Timeline, Location Fit).

### 4. Resilient Edge States (`@/components/shared/`)
- **Enhanced `EmptyState`**: Domain presets (`no-leads`, `no-calls`, `no-appointments`, `no-search-results`, `no-data`) with custom action triggers.
- **Enhanced `ErrorState`**: Actionable recovery button, error code tags, and collapsible technical debug accordion.
- **Skeleton Suite**: Base `Skeleton` primitive and composite `TableSkeleton`.

### 5. Modal & Drawer Patterns (`@/components/ui/`)
- **`ConfirmDialog`**: Standardized confirmation modal with variant styling (`default`, `destructive`, `warning`, `success`), async action handlers, and loading spinners.
- **`DetailDrawer`**: Adaptive inspection drawer with standardized header, scrollable body, action footer, and responsive sizing.

### 6. Basic Form Components (`@/components/ui/`)
- **`CurrencyInput`**: Real-estate currency input with prefix formatting (`₦`), thousands separators, and sanitized numeric emission.
- **`SearchInput`**: Search bar with search icon and instant clear button.
- **`FormField` Suite**: Accessible wrapper with `FormLabel`, `FormDescription`, and `FormMessage`.
- **`Textarea`, `Checkbox`, `Switch`**: Accessible form primitives styled in Pacia luxury real-estate tokens.

### 7. Interactive Testbench
- **Dedicated Developer Route (`/primitives`)**: Interactive showcase enabling live manipulation of all Day 4 primitives, state toggles (loading, error, empty), score sliders, dialogs, drawers, and form inputs. Accessible directly via URL (`/primitives`) for developer testing.

---

## 15. Day 5 — Lead-Management Foundation (Completed)

Day 5 establishes the dedicated Lead Management domain and operational command center for PaciaOS:

### 1. Dedicated Leads Domain Module (`@/features/leads/`)
- **Strongly-Typed Domain Models (`types/index.ts`)**: Models representing `Lead`, `LeadScoreCategory` (`HOT`, `WARM`, `COLD`), `LeadStatus` (`Qualified`, `Viewing Booked`, `In Conversation`, `Contacting`, `Follow-up`, `New`), `LeadFilterParams`, and `LeadsApiResponse`.
- **Decoupled Leads Service (`services/leads-service.ts`)**: Client service backed by `apiClient` (`Authorization: Bearer <clerk_jwt>`, `X-Workspace-Id`) with an agreed REST contract (`GET /api/v1/leads?search=&scoreCategory=&status=`, `GET /api/v1/leads/:id`) and a graceful, deterministic offline mock fallback (`mock-leads.ts`).

### 2. Operational Lead Table (`components/lead-table.tsx`)
- **Composed with Day 4 `DataTable<Lead>`**: Displays key operational real-estate sales figures at a glance:
  - **Prospect**: Prospect name and formatted telephone number.
  - **Property / Interest**: Property title, location pin, and acquisition intent badge (`Purchase`, `Rental`, `Investment`).
  - **Budget**: Formatted currency (`₦` tabular-nums) and decision timeline.
  - **Score**: Embedded Day 4 `ScoreIndicator` (`variant="badge"`).
  - **Status**: Embedded Day 4 `StatusBadge` mapped directly to established domain statuses with live status dots.
  - **Next Action**: Operational instruction and row click chevron.
- **Row Selection**: Clicking any row smoothly opens the prospect dossier in a slide-over `DetailDrawer`.

### 3. Foundational Filters & Status Presentation (`components/lead-filters-bar.tsx`)
- **Full-Text Search**: Instant search matching across prospect name, phone, property title, and location.
- **Score Tier Segmentation**: One-click score category chips (`All Tiers`, `HOT (80+)`, `WARM (60-79)`, `COLD (<60)`).
- **Domain Status Selection**: Dropdown filter mapped strictly to supported product statuses.
- **Counter & Reset**: Live record counter ("Showing X of Y leads") and reset button.

### 4. Lead Detail Shell (`components/lead-detail-shell.tsx`)
- **Slide-Over Inspection (`DetailDrawer`)**: Establishes the information hierarchy for prospect dossiers:
  - **Prospect Profile**: Verified phone and email links (`tel:`, `mailto:`).
  - **Commercial Context**: Declared budget, transaction intent, decision timeline, and score gauge.
  - **Target Property Interest**: Property title, neighborhood, and category.
  - **Supported Qualification Context**: Verified BANT notes and prospect intake insights.
  - **Operational Journey**: Structured chronological timeline representing next required action.

### 5. Streamlined Route Assembly (`/leads`)
- Clean, performant route component (`@/app/(app)/leads/page.tsx`) composing `LeadFiltersBar`, `LeadTable`, and `LeadDetailShell` with zero code bloat and full async state management (loading skeleton, empty search state, error recovery).

---

## 16. Day 6 — Complete Lead Workflow UI

> **Current Implementation Status**: Frontend workflow implemented against isolated mock/service contracts; backend persistence remains pending.

### 1. Day 6 Objective
Transform the Day 5 foundational lead-management slice into a complete, operational **Lead Workflow System** and sales command center for real-estate brokers, elevating lead intake into an end-to-end qualification and deal-progression engine.

### 2. Major Features Completed
- **Lead Workflow Table**: Operational table with prospect identification, phone verification, transaction intent badges, formatted Nigerian Naira (`₦`) budgets, qualification badges, live pulsing status indicators, and client-side column sorting.
- **Lead Detail Dossier**: Slide-over `DetailDrawer` command center integrating quick-contact actions, property context, underwriting matrices, activity history, and status progression.
- **Interactive Quick-Contact Bar**: Direct telephone link (`tel:`), instant clipboard copy with toast feedback, and email drafting (`mailto:`).
- **Domain Status Progression**: Live lifecycle stage selector with domain-calibrated status dots, updating table and drawer state simultaneously without page reloads.
- **High-Priority Operational Directives**: Next-action card presenting assigned agent/AI engine, priority tier, due date, and interactive action protocol triggers.
- **Target Property Showcase**: Comprehensive property specs (bedrooms, bathrooms, floor area in m², development stage), price vs budget alignment analysis, and high-resolution architectural photography with interactive carousel and lightbox modal.
- **BANT+ Underwriting Matrix**: 5-point qualification breakdown (Budget, Authority, Need, Timeline, Property Fit) with individual scores, AI intake commentary, and mock intelligence disclaimers.
- **Chronological Activity Timeline**: Multi-channel event log (inbound forms, AI voice qualification calls, WhatsApp brochures, viewing appointments) with duration/outcome metadata.
- **Broker Memo & Photo Ingestion**: Operational input allowing brokers to append immediate notes and attach site inspection photos, surveys, or proof-of-funds screenshots with full-screen inspection lightbox.
- **CSV Data Export**: Single-click header export generating standardized Excel/Sheets UTF-8 CSV downloads of active leads.

### 3. Lead Workflow Capabilities
- **Prospect Identity**: Displays verified prospect name and formatted phone number.
- **Target Property**: Property title, location pin, and intent category (`Purchase`, `Rental`, `Investment`).
- **Formatted Budget**: Numerical currency parsing and formatting (`₦85,000,000` with `font-mono tabular-nums`) alongside purchase timeline.
- **Qualification Scoring**: Integrated Day 4 `ScoreIndicator` (`variant="badge"`).
- **Lifecycle Status**: Integrated Day 4 `StatusBadge` mapped directly to domain statuses with live status dots.
- **Next Action**: Specific operational instructions with row click inspection chevron.
- **Sorting**: Multi-column sorting across Prospect Name, Property Title, Budget, Qualification Score, and Lifecycle Status.
- **Row Selection**: Clicking any row activates selection highlight and slides open the dossier.

### 4. Lead Detail Dossier
- **Header & Identity**: Displays lead name, system ID, intake timestamp, acquisition channel (`Instagram Lead Ad`, `Google Search`, `Direct Referral`), and overall score indicator.
- **Direct Communication**: One-click click-to-call, phone number copying with Sonner toast feedback, and mailto links.
- **Commercial Overview**: 3-card context summary displaying declared budget, transaction intent, and decision timeframe.
- **Synchronized State**: Any mutation performed inside the drawer (status change or broker memo addition) immediately reflects in the lead table and drawer state.

### 5. Property Context & Visual Showcase
- **Property Specifications**: Property type, bedrooms, bathrooms, floor area in square meters (`m²`), development stage (`Ready for Occupancy`, `Off-Plan`, `Completed`), and estate name.
- **Commercial Valuation Alignment**: Asking price compared against prospect's declared budget with automated classification badges (`Within Budget`, `Budget Stretch`, `Sub-Budget`).
- **Architectural Photography**: Curated luxury real-estate photography across Nigerian high-value corridors (Ikoyi, Lekki, Banana Island, Guzape Abuja), photo counter (`1 / 3 Photos`), prev/next navigation, and click-to-expand lightbox modal.

### 6. Qualification / BANT UI
- **5-Point Underwriting**: Dedicated evaluation for Budget (liquidity & source of funds), Authority (decision-maker status), Need (property criteria & lifestyle fit), Timeline (acquisition window), and Property Fit (listing compatibility).
- **Score Representation**: Powered by Day 4 `ScoreIndicator` (`variant="breakdown"`).
- **Simulated AI Intake Commentary**: Detailed qualification notes explaining score weighting, accompanied by an explicit user-facing disclaimer that data represents simulated demo intelligence.

### 7. Activity Timeline & Broker Memo Ingestion
- **Chronological Event Stream**: Ordered history of all prospect touchpoints with channel indicators (`Meta Lead Form`, `Spacia Voice Core`, `WhatsApp Business API`, `Calendar Connector`).
- **Interaction Metadata**: Call durations, qualification outcomes (`Qualified — HOT (92/100)`), and confirmed viewing slots.
- **Broker Note & Photo Attachment**: Input for operational notes with an image upload button (`ImageIcon`), attachment preview chip (`[ 🖼️ photo.jpg × ]`), and timeline photo rendering with full-screen inspection lightbox.

### 8. Next-Action Presentation & Execution
- **Operational Directive**: Clearly states the next protocol action, assigned owner (`Autonomous AI Engine` or named broker), priority tier (`Immediate`, `Scheduled`, `Routine`), and due date.
- **Recommended Protocol**: Explicit broker execution instructions (e.g., dispatch gate security access codes, hand-deliver acquisition memorandum).
- **Execution Button**: Interactive trigger dispatching Sonner toast confirmation.

### 9. Status Transitions & State Synchronization
- **Domain Stages**: Supports transitions between `New`, `Contacting`, `In Conversation`, `Qualified`, `Viewing Booked`, `Follow-up`, and `Human Managed`.
- **Clean Design System Trigger**: Single border-driven select trigger height-matched (`h-7`) with adjacent buttons, featuring an inline live colored dot and eliminating nested pill borders.
- **Optimistic State Updates**: Transitioning status updates the in-memory session store, appends an automatic status-change event to the activity timeline, and synchronizes the table and drawer views.

### 10. Edge States Handling
- **Loading State**: Displays `TableSkeleton` during initial data retrieval.
- **Empty Filter Results**: Shows contextual `EmptyState` when search or filter combinations yield zero records, complete with a "Reset all filters" button.
- **Empty Lead Selection**: Drawer gracefully unmounts or displays fallback state when no lead is active.
- **Error Recovery**: Full `ErrorState` banner with retry action if service invocation fails.

### 11. Mock / API Boundary Integrity
- **Decoupled Architecture**: The UI consumes the `leadsService` abstraction (`@/features/leads/services/leads-service.ts`) and never makes direct ad-hoc HTTP calls.
- **Proposed Contracts**: Clearly defines target REST endpoints:
  - `GET /api/v1/leads?search=&scoreCategory=&status=`
  - `GET /api/v1/leads/:id`
  - `PATCH /api/v1/leads/:id/status`
  - `POST /api/v1/leads/:id/activities`
- **In-Memory Session Store**: In the absence of a live backend, an in-memory session store manages optimistic mutations, event appending, and lifecycle changes without fabricating persistent production databases or fake authentication.

### 12. Technical Verification Status

| Test Suite | Command | Result | Verification Details |
| :--- | :--- | :---: | :--- |
| **TypeScript Strict** | `npm run type-check` | **PASS** | `tsc --noEmit` exited with code 0. Zero errors across all domain files. |
| **ESLint 9 Code Quality** | `npm run lint` | **PASS** | `eslint src` exited with code 0. Zero warnings, zero errors. |
| **Next.js Production Build** | `npm run build` | **PASS** | Next.js 16 (Turbopack) successfully built and optimized all 16 routes in 19.4s. |
| **Functional QA** | Interactive Browser Test | **PASS** | Verified search, score filtering, status filter, table sorting, drawer opening, status updates, photo memo attachment, lightbox viewer, and CSV download. |

## 17. Day 7 — Usable Property Information in Lead Workflows (Completed & Verified)

Day 7 establishes a dedicated, first-class real-estate property intelligence layer (`features/properties`) directly operationalized within the lead intake and qualification workflows:

### 1. Dedicated Properties Domain Architecture (`@/features/properties`)
- **Strongly-Typed Domain Models (`types/index.ts`)**:
  - `Property`: Canonical representation including `id`, `referenceCode`, `title`, `slug`, `location`, `estateName`, `city`, `state`, `country`, `propertyType`, `price`, `currency`, `formattedPrice`, `bedrooms`, `bathrooms`, `parkingSpaces`, `squareMeters`, `developmentStage`, `features`, `description`, `images`, `featuredImage`, `availability`, and `verification`.
  - `PropertyAvailability`: Strongly typed union covering the operational lifecycle (`Available`, `Under Offer`, `Sold`, `Reserved`, `Unavailable`, `Unknown`).
  - `PropertyVerificationStatus`: Multi-tier compliance states (`Verified`, `Pending Verification`, `Unverified`).
  - `PropertyVerificationDetails`: Legal title documentation details including `titleDeedType` (`Governor's Consent`, `C of O`, `Gazette`, `Deed of Assignment`, `Excision`), `registryNumber`, `verifiedAt`, `verifiedBy`, and underwriting notes.
  - `PropertyCommercialTerms`: Operational underwriting data including `serviceCharge`, `minimumDeposit`, `paymentPlanOptions`, and projected yields.
- **Mock Property Registry (`data/mock-properties.ts`)**: 8 curated Nigerian luxury real-estate listings across Lekki Phase 1, Banana Island, Victoria Island, Old Ikoyi, Guzape Abuja, Maitama Abuja, Chevron Toll Gate, and Osapa London.
- **Decoupled Properties Service (`services/properties-service.ts`)**: Encapsulates data-fetching abstractions and outlines target REST API contracts (`GET /api/v1/properties`, `GET /api/v1/properties/:id`).

### 2. Operational Property Card (`@/features/properties/components/property-card.tsx`)
- **Key Display Attributes**:
  - **Price**: High-contrast tabular monospace valuation (`₦85,000,000`) with budget match classification badge (`Within Budget`, `Budget Stretch`, `Sub-Budget`).
  - **Location**: Prime neighborhood and estate branding with pin indicator.
  - **Bedrooms & Bathrooms**: Clean metric chips with icons and counts.
  - **Floor Area**: Usable square meters (`210 m²`).
  - **Features**: Verified amenities chips (`24/7 Monitored Power`, `Private Cinema`, `Olympic Swimming Pool`, `Armed Perimeter Patrol`) with green checkmarks.
  - **Availability**: Integrated `PropertyAvailabilityBadge`.
  - **Verification State**: Integrated `PropertyVerificationBadge` displaying legal title deed type.
- **Deep-Dive Trigger**: Dedicated "Inspect Full Property Specifications & Title Deeds" action opening the presentation modal.

### 3. Deep-Dive Property Detail Presentation Modal (`@/features/properties/components/property-detail-presentation.tsx`)
- **High-Z Overlay (`z-[60]`)**: Built on Radix UI Dialog, stacking seamlessly over the Lead Dossier drawer without gesture interference.
- **Architectural Photo Showcase**: High-resolution gallery with photo counter, carousel controls, thumbnail navigation strip, and full-screen image lightbox modal (`z-[70]`).
- **Legal Underwriting & Title Verification**: Dedicated title deed review panel displaying deed document type, land registry index, signed clearance notes, and legal surveyor timestamps.
- **Commercial Terms & Payment Structures**: Breakdown of HOA service charges, required initial deposits, and developer installment milestones.
- **Broker Actions**: One-click "Share with Lead" (WhatsApp API dispatch toast) and "Brochure PDF" generation trigger.

### 4. Resilient Edge & Lifecycle States
- **Verification States**:
  - `Verified`: High-trust emerald badge with title deed indicator (e.g. `Governor's Consent`, `C of O`).
  - `Pending Verification`: Amber warning badge indicating documentation is currently undergoing land registry search.
  - `Unverified`: Subtle stone indicator flagging unvetted form claims.
- **Unavailable / Off-Market State (`PropertyUnavailableState`)**:
  - Displays proactive operational warning when property is `Sold` or `Unavailable` (e.g., leased off-market).
  - Outlines unavailability reason and suggests alternative active inventory in the same district and price tier.
- **Unknown Property State (`PropertyUnknownState`)**:
  - Handles general inbound inquiries where prospect submitted search preferences (budget, location) without linking a specific property.
  - Displays prospect preference criteria with a one-click "Match Inventory" action.

### 5. Technical Verification Status

| Test Suite | Command | Result | Verification Details |
| :--- | :--- | :---: | :--- |
| **TypeScript Strict** | `npm run type-check` | **PASS** | `tsc --noEmit` exited with code 0. Zero loose any types, full type integrity across `features/properties` and `features/leads`. |
| **ESLint 9 Code Quality** | `npm run lint` | **PASS** | `eslint src` exited with code 0. Zero warnings, zero errors across all components. |
| **Next.js Production Build** | `npm run build` | **PASS** | Next.js 16 (Turbopack) successfully compiled and optimized all 16 static/dynamic routes in 35.0s. |
| **Edge States Verification** | Lead Dossier & Table QA | **PASS** | Verified active property inspection (`lead_01`), sold/unavailable warning state (`lead_06`, `lead_07`), unknown criteria state (`lead_09`), and verification badge states. |

---

## 18. Day 8 — Event System & Automation Foundation (Completed & Verified)

Day 8 prepares the PaciaOS frontend for asynchronous workflow execution states, real-estate telephony and WhatsApp events, resilient retry/failure recovery, and distinct AI autonomous versus human broker actor attribution:

### 1. Dedicated Event Domain Architecture (`@/features/events`)
- **Strongly-Typed Domain Models (`types/index.ts`)**:
  - `WorkflowExecutionStatus`: Covers full async lifecycle (`idle`, `queued`, `in_progress`, `completed`, `failed`, `retrying`, `blocked`, `cancelled`).
  - `ActorType`: Tri-tier actor categorization (`ai_agent`, `human_broker`, `system`).
  - `WorkflowActor`: Union supporting `AIActorDetails` (model name, latency in ms, confidence score, live stream pulse), `HumanActorDetails` (broker avatar, name, role, territory, takeover reason, verified badge), and `SystemActorDetails`.
  - `RetryPolicy`: Manages retry attempt counts (`Attempt 2 of 3`), backoff countdown timers (`45s`), and manual retry capability.
  - `FailureDiagnostic`: Structured error payload (`errorCode`, `errorMessage`, `technicalDetails`, `recoverable`, `suggestedAction`, `failedAt`).
  - `WorkflowActivityEvent`: Canonical event model supporting multi-channel touchpoints (`voice_call`, `whatsapp`, `calendar`, `underwriting`, `broker_note`, `status_transition`, `system_webhook`).
- **Decoupled Events Service (`services/events-service.ts`)**: Encapsulates API calls with target REST contracts (`GET /api/v1/events`, `POST /api/v1/workflows/:id/retry`, `POST /api/v1/workflows/:id/cancel`) backed by an in-memory session store for deterministic offline state transitions.
- **Realistic Event Registry (`data/mock-events.ts`)**: Luxury real-estate automation events including completed AI voice qualification calls, dropped telephony calls auto-retrying with countdowns, WhatsApp floorplan deliveries, broker escrow takeovers, and calendar slot conflicts.

### 2. Workflow & Status Indicators (`components/workflow-status-indicator.tsx`)
- **Comprehensive Lifecycle Presentation**: Renders all 7 execution states with color calibrations (Emerald for `in_progress` and `completed`, Amber for `retrying` and `blocked`, Rose for `failed`, Stone for `queued` and `cancelled`).
- **Four Distinct Variants**:
  - `badge`: Standard compact pill with icon, label, and attempt counter.
  - `pill`: Rounded pill for status bars.
  - `dot-only`: Subtle 2px animated pulse dot with tooltip explanation.
  - `expanded`: Full-width banner with icon, label, and operational description.

### 3. Actor Attribution: AI Autonomous vs. Human Broker Indicators
- **`AIActivityIndicator` (`components/ai-activity-indicator.tsx`)**:
  - Distinctive Pacia Green branding with emerald status pulse.
  - Displays agent persona ("Spacia Voice Core"), neural model version ("Neural Executive v2.4"), latency metrics ("380ms"), and confidence percentage.
  - Supports `badge`, `compact`, and `detailed` card variants with live streaming pulse toggle.
- **`HumanActivityIndicator` (`components/human-activity-indicator.tsx`)**:
  - Displays sales broker avatar, name, role, territory ("Lekki Phase 1 & Ikate"), and takeover rationale.
  - High-trust verified broker badge with green shield icon.

### 4. Resilient Retry & Failure Recovery Component (`components/workflow-retry-state.tsx`)
- **Automated & Manual Recovery**:
  - Displays failure error code (e.g. `SIP_486_BUSY_SUBSCRIBER`) and clear operational explanation.
  - Retry counter showing current attempt vs limit (`Attempt 2 of 3`).
  - Live backoff countdown timer (`Next in 45s`).
  - Interactive "Retry Now" button with loading spinner and instant toast feedback.
  - "Escalate to Human Broker" action for manual sales takeover.
  - Collapsible terminal-style diagnostic inspector displaying raw SIP headers, network traces, and failure timestamps.

### 5. Polymorphic Activity Event Card (`components/activity-event-card.tsx`)
- **Multi-Channel Sales Touchpoints**: Renders voice calls, WhatsApp messages, viewing calendar syncs, broker memos, and webhooks.
- **Integrated Architecture**: Composes `WorkflowStatusIndicator`, `AIActivityIndicator`, `HumanActivityIndicator`, and embeds `WorkflowRetryState` automatically when an event is in `failed` or `retrying` state.
- **Expandable Payload Inspector**: One-click drawer/accordion toggle revealing interaction transcripts, media attachments, and delivery receipts.

### 6. Live Operational Automation Event Feed (`components/automation-event-feed.tsx`)
- **Segmented Filter Tabs**: Filter event stream by `All Events`, `AI Autonomous`, `Human Broker`, or `Alerts / Retrying`.
- **Live Event Simulation**: Interactive "Simulate Async Event" button dynamically injects real-time events (AI underwriting calculations or telephony carrier dropouts) into the active feed.

### 7. Upgraded Lead Activity Timeline Integration (`features/leads`)
- Seamlessly enhanced `LeadActivityTimeline` in `src/features/leads` to render `WorkflowStatusIndicator`, `AIActivityIndicator`, `HumanActivityIndicator`, `WorkflowRetryState`, and transcript previews without breaking existing Day 6/7 lead workflow functionality.

### 8. Interactive Testbench (`/primitives`)
- Added Section 7 to `/primitives` featuring live state switchers across all status variants, AI pulse toggles, retry countdowns, standalone event cards, and the live automation feed.

### 9. Technical Verification Status

| Test Suite | Command | Result | Verification Details |
| :--- | :--- | :---: | :--- |
| **TypeScript Strict** | `npm run type-check` | **PASS** | `tsc --noEmit` exited with code 0. Zero loose any types, full type integrity across `features/events`, `features/leads`, and `features/properties`. |
| **ESLint 9 Code Quality** | `npm run lint` | **PASS** | `eslint src` exited with code 0. Zero warnings, zero errors across all components. |
| **Next.js Production Build** | `npm run build` | **PASS** | Next.js 16 (Turbopack) successfully compiled and optimized all 16 static/dynamic routes. |
| **Interactive Testbench** | `/primitives` & `/leads` | **PASS** | Verified status state transitions, retry countdowns, simulated event injection, AI/Human badges, and lead dossier timeline integration. |

---

## 20. Day 9 — AI Sales Agent Interface (`features/ai-agent`)

Spacia Day 9 establishes the comprehensive operational command center and atomic UI primitives for the autonomous AI Sales Agent. It gives real estate brokerages full visibility, configuration power, and intervention authority over autonomous voice qualification.

```text
src/features/ai-agent/
├── components/
│   ├── ai-status-card.tsx                 # Core engine telemetry, latency, concurrency, pause/resume
│   ├── config-presentation.tsx            # Voice persona, BANT thresholds, and legal guardrails
│   ├── ai-activity-state.tsx              # Live active call radar, audio equalizer, transcript & feed
│   └── confidence-intent-primitives.tsx   # IntentConfidenceGauge, BuyerIntentBadge, IntentSignalPill, BuyerIntentCard
├── data/
│   └── mock-ai-agent.ts                   # Realistic telemetry, voice specs, live call, buyer evaluations
├── services/
│   └── ai-agent-service.ts                # Decoupled service with in-memory session persistence & mock contract
├── types/
│   └── index.ts                           # Strongly-typed agent telemetry, voice persona, BANT, and intent models
└── index.ts                               # Domain slice barrel export
```

### 1. Autonomous AI Status Card (`components/ai-status-card.tsx`)
- **Real-Time Telemetry**: Tracks live line concurrency (`2 / 5 lines`), sub-second speech turnaround latency (`380ms`), calls handled today (`48`), and BANT pass rate (`72%` / 14 viewings).
- **Emergency Operator Intervention**: Prominent Pause / Resume Outbound dialer button that halts outbound queue processing while keeping inbound call routing open.

### 2. Comprehensive Configuration Presentation (`components/config-presentation.tsx`)
- **Voice Persona**: Details agent identity (*Spacia AI Sales Associate*), model (*Neural Executive v2.4*), accent (*Lagos Business Neutral*), 0.3 deterministic temperature, 450ms speech pause tolerance, 1.0x cadence, and strict verified truth policy.
- **BANT Qualification Gates**: Enforces ₦85M minimum budget gate, `< 30 Days` priority closing window, eligible legal title deeds (*Governor's Consent, C of O, Gazette*), and immediate escalation keywords (*discount, commission, installment terms*).
- **Safety & Legal Guardrails**: Hard 3-call outbound attempt limit, quiet hours (`20:00 – 08:00`), strict DNC list enforcement, and mandatory immediate transfer upon price negotiation.
- **Autonomous Action Dispatch (Auto-Pilot)**: Interactive switch allowing brokers to choose between fully autonomous hands-free scheduling or supervised manual approval.

### 3. Active Call Radar & Activity Stream (`components/ai-activity-state.tsx`)
- **Live Call Radar**: Real-time duration counter, dynamic audio carrier equalizer waveform animation, step indicator (`Evaluating BANT Underwriting`, `Synthesizing Speech`, `Listening`), and live speaker transcript stream.
- **Intervention Controls**: Instant "Take Lead" (human broker takeover with briefing toast) or "Disconnect" triggers for sales directors.
- **Recent Executions Feed**: Live feed of autonomous agent actions (HOT qualification, physical inspection booking, broker escalation, carrier drop retry).

### 4. Buyer Intent & Confidence UI Primitives (`components/confidence-intent-primitives.tsx`)
- **`IntentConfidenceGauge`**: Color-calibrated 0–100% confidence meter (Emerald $\ge 85\%$, Amber $60–84\%$, Rose $<60\%$) in both standard and compact inline variants.
- **`BuyerIntentBadge`**: Domain badges representing extracted purchase patterns (`High Purchase Intent`, `Yield Seeking Investor`, `Luxury Relocation`, `Exploratory`, `Unqualified`).
- **`IntentSignalPill`**: Atomic tag identifying specific conversational qualification signals (Budget verified, 14-day close, sole decision maker, property fit) with signal strength indicators (`high`, `medium`, `low`).
- **`BuyerIntentCard`**: Composite presentation combining prospect identity, confidence gauge, intent classification, extracted quote, signal pills, and post-call outcomes:
  - **Autonomous Company Calendar Bookings**: Automatically checks team availability and schedules in-person physical inspections or virtual tours upon positive call outcomes.
  - **Human Closer Payment Stage**: Seamless handoff for the physical showing and deposit/escrow collection (`[ Collect Payment ]`).
  - **Pacia Design System Fills**: Filter pill controls with `#0d4a36` active fill and soft neutral inactive states.

### 5. Technical Verification Status

| Test Suite | Command | Result | Verification Details |
| :--- | :--- | :---: | :--- |
| **TypeScript Strict** | `npm run type-check` | **PASS** | `tsc --noEmit` exited with code 0. Zero loose any types, full type integrity across `features/ai-agent`, `features/events`, `features/leads`, and `features/properties`. |
| **ESLint 9 Code Quality** | `npm run lint` | **PASS** | `eslint src` exited with code 0. Zero warnings, zero errors across all components. |
| **Next.js Production Build** | `npm run build` | **PASS** | Next.js 16 (Turbopack) successfully compiled and optimized all 16 static/dynamic routes. |
| **Interactive Testbench** | `/ai-agent` & `/primitives` | **PASS** | Verified live telemetry card, pause/resume dialer toggle, waveform equalizer, config tabs, intent filter chips, interactive confidence slider, and action dispatch toast notifications. |

---

## 21. Git Workflow & Branching Conventions

- **Dedicated Frontend Branch**: All Day 1 through Day 9 frontend foundation code resides on the `frontend` branch.
- **Protected `main` Branch**: The `main` branch is reserved for verified releases and backend-integrated milestones.
- **Branch Naming Conventions**:
  - `feat/feature-name` for new user-facing capabilities
  - `fix/bug-description` for bug repairs
  - `refactor/scope` for code improvements
- **Commit Standards**: Conventional Commits standard (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`).

---

## 22. Contribution & Development Guidelines

1. Always run `npm run lint` and `npm run type-check` before committing. Zero errors and zero warnings are required.
2. Keep pages server-rendered where possible; designate `"use client"` only when user interaction, state, or browser APIs are required.
3. Place feature-specific components inside their respective `@/features/<feature>/components` directory rather than polluting `@/components/ui`.
4. Ensure all interactive elements (buttons, inputs, selects, drawers) have clear accessible labels and keyboard focus states.


