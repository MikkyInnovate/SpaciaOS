# Spacia (SpaciaOS) — AI Sales Command Center

> **Spacia** is a high-performance, managed AI sales orchestration platform purpose-built for modern real-estate brokerages and development firms. It autonomously captures inbound property inquiries, engages prospects via natural voice and chat, qualifies buyers against stringent underwriting criteria, evaluates purchasing power and timeline, and seamlessly books qualified viewings directly onto connected sales agents' calendars.

This repository houses the **production frontend implementation for Day 1, Day 2, and Day 3** of the Spacia MVP.

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
│   └── dashboard/
│       ├── components/
│       │   ├── stat-metric-card.tsx     # Executive KPI cards with trend indicators
│       │   ├── lead-intake-table.tsx    # Interactive leads data table
│       │   ├── lead-dossier-panel.tsx   # Resizable dossier with playback & BANT
│       │   ├── ai-agent-live-feed.tsx   # Real-time event activity ticker
│       │   ├── pipeline-funnel.tsx      # Multi-stage conversion chart
│       │   └── upcoming-viewings-list.tsx# Scheduled calendar viewings
│       ├── data/
│       │   └── mock-data.ts             # Deterministic mock datasets
│       └── types/
│           └── index.ts                 # Domain models (Leads, Calls, Viewings)
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

## 14. Git Workflow & Branching Conventions

- **Dedicated Frontend Branch**: All Day 1 & Day 2 frontend foundation code resides on the `frontend` branch.
- **Protected `main` Branch**: The `main` branch is reserved for verified releases and backend-integrated milestones.
- **Branch Naming Conventions**:
  - `feat/feature-name` for new user-facing capabilities
  - `fix/bug-description` for bug repairs
  - `refactor/scope` for code improvements
- **Commit Standards**: Conventional Commits standard (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`).

---

## 15. Contribution & Development Guidelines

1. Always run `npm run lint` and `npm run type-check` before committing. Zero errors and zero warnings are required.
2. Keep pages server-rendered where possible; designate `"use client"` only when user interaction, state, or browser APIs are required.
3. Place feature-specific components inside their respective `@/features/<feature>/components` directory rather than polluting `@/components/ui`.
4. Ensure all interactive elements (buttons, inputs, selects, drawers) have clear accessible labels and keyboard focus states.
