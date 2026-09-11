import { SignUp } from "@clerk/nextjs";
import { authAppearance } from "@/lib/config/clerk-auth-appearance";

export default function SignUpPage() {
  return (
    <SignUp
      routing="path"
      path="/sign-up"
      signInUrl="/sign-in"
      fallbackRedirectUrl="/dashboard"
      appearance={authAppearance}
    />
  );
}
