"use client";

import * as React from "react";
import { SignUp } from "@clerk/nextjs";
import { authAppearance } from "@/lib/config/clerk-auth-appearance";
import { PasswordRequirements } from "@/components/auth/password-requirements";

export default function SignUpPage() {
  const containerRef = React.useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative w-full">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
        appearance={authAppearance}
      />
      <PasswordRequirements containerRef={containerRef} />
    </div>
  );
}
