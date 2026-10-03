import { redirect } from "next/navigation";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  if (params?.mode === "signup") {
    redirect("/sign-up");
  }
  redirect("/sign-in");
}
