import { redirect } from "next/navigation";

/**
 * Conversations Page Route — PRD V1 Scope Boundary.
 *
 * WhatsApp Cloud API & Omnichannel Messaging are scheduled for Phase 2 post-launch.
 * The full 3-pane interactive Conversation Command Center and all associated components,
 * domain models, and mock datasets are preserved and maintained in `@/features/conversations`.
 *
 * Direct URL hits during the MVP phase redirect to the primary live V1 voice interaction stream (/calls).
 */
export default function ConversationsPage() {
  redirect("/calls");
}
