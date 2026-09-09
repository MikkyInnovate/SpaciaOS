import { redirect } from "next/navigation";

export default function ConversationsPage() {
  // PRD V1 Scope Boundary: WhatsApp AI & omnichannel messaging is scheduled for Phase 2.
  // Redirect any direct URL hits to the primary live V1 voice interaction stream (/calls).
  redirect("/calls");
}
