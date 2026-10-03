"use client";

import { useEffect } from "react";

/** Sets a session cookie so the landing page skips the intro on the next visit this session. */
export function MarkIntroSeen() {
  useEffect(() => {
    document.cookie = "spacia-intro=1; path=/; SameSite=Lax";
  }, []);
  return null;
}
