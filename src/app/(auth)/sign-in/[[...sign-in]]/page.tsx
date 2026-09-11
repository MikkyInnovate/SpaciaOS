"use client";

import * as React from "react";
import { SignIn } from "@clerk/nextjs";
import { authAppearance } from "@/lib/config/clerk-auth-appearance";
import { SignInHelper } from "@/components/auth/sign-in-helper";

export default function SignInPage() {
  const containerRef = React.useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative w-full">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/dashboard"
        appearance={authAppearance}
      />
      <SignInHelper containerRef={containerRef} />
    </div>
  );
}
