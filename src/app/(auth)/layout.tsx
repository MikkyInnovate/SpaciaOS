import * as React from "react";
import { AuthSplitShell } from "./auth-split-shell";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthSplitShell>{children}</AuthSplitShell>;
}
