import { SignIn } from "@clerk/nextjs";
import { authAppearance } from "@/lib/config/clerk-auth-appearance";

export default function SignInPage() {
  return (
    <SignIn
      routing="path"
      path="/sign-in"
      signUpUrl="/sign-up"
      fallbackRedirectUrl="/dashboard"
      appearance={authAppearance}
    />
  );
}
