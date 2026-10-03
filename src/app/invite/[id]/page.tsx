"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  User,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  ArrowRight,
  Lock,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Briefcase,
  Copy,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { teamService } from "@/features/team/services/team-service";
import { siteConfig } from "@/lib/config/site";
import { toast } from "sonner";

interface InvitationData {
  id: string;
  workspaceId: string;
  workspaceName: string;
  email: string;
  hasClerkAccount?: boolean;
  role: string;
  roleTitle: string;
  roleDescription: string;
  badgeVariant: string;
  status: string;
  isAccepted: boolean;
  invitedAt?: string;
  joinedAt?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  agent?: {
    roleTitle?: string;
    territory?: string;
    specializations?: string[];
    phone?: string;
  } | null;
}

const HEADLINES = [
  "Every viewing booked, qualified, and closed in real time.",
  "The AI sales system for real estate teams.",
  "Instant prospect qualification and automated viewing pipeline.",
];

function AuthTypewriterHeadline() {
  const [index, setIndex] = React.useState(0);
  const [displayedText, setDisplayedText] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    const currentFullText = HEADLINES[index];
    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      if (displayedText.length < currentFullText.length) {
        timer = setTimeout(() => {
          setDisplayedText(currentFullText.slice(0, displayedText.length + 1));
        }, 40);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 3200);
      }
    } else {
      if (displayedText.length > 0) {
        timer = setTimeout(() => {
          setDisplayedText(currentFullText.slice(0, displayedText.length - 1));
        }, 18);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(false);
          setIndex((prev) => (prev + 1) % HEADLINES.length);
        }, 200);
      }
    }

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, index]);

  return (
    <h1 className="font-display text-2xl xl:text-3xl font-semibold tracking-tight text-white leading-snug min-h-[4rem] xl:min-h-[4.75rem] flex items-baseline">
      <span>{displayedText}</span>
      <span className="inline-block w-[2px] h-[0.9em] bg-emerald-400 ml-1.5 translate-y-[2px] animate-pulse shrink-0" />
    </h1>
  );
}

export default function InviteOnboardingPage() {
  const params = useParams();
  const router = useRouter();
  const inviteId = params?.id as string;

  const { user: currentClerkUser, isSignedIn, isLoaded: isUserLoaded } = useUser();
  const clerk = useClerk();

  const [isLoading, setIsLoading] = React.useState(true);
  const [invitation, setInvitation] = React.useState<InvitationData | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Form State
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  // Session correlation: detect if admin is testing in their own browser
  const currentEmail = currentClerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase().trim();
  const invitedEmail = invitation?.email?.toLowerCase().trim();
  const isMismatchedSession = Boolean(
    isSignedIn && currentEmail && invitedEmail && currentEmail !== invitedEmail
  );
  const isMatchingSession = Boolean(
    isSignedIn && currentEmail && invitedEmail && currentEmail === invitedEmail
  );

  // Load invitation
  React.useEffect(() => {
    if (!inviteId) {
      setErrorMessage("No invitation ID provided.");
      setIsLoading(false);
      return;
    }

    async function fetchInvite() {
      try {
        setIsLoading(true);
        const data = await teamService.getInvitation(inviteId);
        if (!data || !data.id) {
          setErrorMessage("Invitation not found or link has expired.");
          return;
        }

        setInvitation(data);
        if (data.firstName) setFirstName(data.firstName);
        if (data.lastName) setLastName(data.lastName);
        if (data.agent?.phone) setPhone(data.agent.phone);
        else if (data.phone) setPhone(data.phone);
      } catch (err: any) {
        setErrorMessage(err?.message || "Failed to load invitation. The link may be expired or invalid.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchInvite();
  }, [inviteId]);

  // Handle Form Submit
  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please provide both your first and last name.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await teamService.acceptInvitation(inviteId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        clerkUserId: isMatchingSession ? currentClerkUser?.id : undefined,
      });

      if (res && res.success) {
        setIsSuccess(true);
        toast.success("Welcome to the team! Your profile is active.");

        // Direct guest to Clerk sign-in / sign-up or team roster
        if (isMismatchedSession) {
          // Admin tested in their own browser session.
          // Sign out so they don't land on their personal owner page.
          await clerk.signOut();
          const targetUrl = (invitation?.hasClerkAccount ?? res?.hasClerkAccount)
            ? `/sign-in?email_address=${encodeURIComponent(invitation?.email || "")}&redirect_url=${encodeURIComponent("/team")}`
            : `/sign-up?email_address=${encodeURIComponent(invitation?.email || "")}&redirect_url=${encodeURIComponent("/team")}`;
          setTimeout(() => {
            router.push(targetUrl);
          }, 1800);
        } else if (!isSignedIn) {
          // Fresh guest opening link on their device or in incognito
          const targetUrl = (invitation?.hasClerkAccount ?? res?.hasClerkAccount)
            ? `/sign-in?email_address=${encodeURIComponent(invitation?.email || "")}&redirect_url=${encodeURIComponent("/team")}`
            : `/sign-up?email_address=${encodeURIComponent(invitation?.email || "")}&redirect_url=${encodeURIComponent("/team")}`;
          setTimeout(() => {
            router.push(targetUrl);
          }, 1800);
        } else {
          // Already signed in as the invited guest
          setTimeout(() => {
            router.push("/team");
          }, 1800);
        }
      } else {
        toast.error(res?.message || "Failed to complete onboarding. Please try again.");
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred while accepting your invitation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen max-h-screen w-full flex flex-col lg:flex-row bg-white font-sans text-stone-900 overflow-hidden">
      {/* Left Column: Full-Bleed Edge-to-Edge Image (50% Width) matching Sign In/Up */}
      <div className="hidden lg:block relative h-full max-h-screen w-full lg:w-1/2 bg-stone-950 overflow-hidden">
        <Image
          src="/images/auth-real-estate.jpg"
          alt="SpaciaOS Real Estate Advisory"
          fill
          priority
          sizes="50vw"
          className="object-cover object-center brightness-95"
        />

        {/* Editorial Headline & Statement */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/40 to-transparent flex flex-col justify-end p-12 xl:p-16 text-white z-10">
          <div className="space-y-4 max-w-xl xl:max-w-2xl">
            {/* Badge: No Corner Radius, Dotted Edges matching Auth Shell */}
            <div className="inline-flex items-center gap-2 rounded-none bg-stone-900/80 backdrop-blur-md px-3 py-1 text-[11px] font-medium text-emerald-300 border border-dotted border-white/40 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-none bg-emerald-400 animate-pulse" />
              <span>Workspace Onboarding</span>
            </div>

            {/* H1 with Typing Effect Animation */}
            <AuthTypewriterHeadline />

            <p className="text-xs xl:text-sm text-stone-300 leading-relaxed font-normal">
              Answer, qualify and follow up every enquiry, book viewings automatically, and hand your best leads to your team.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Edge-to-Edge Form Container (50% Width) matching Sign In/Up */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between h-full max-h-screen px-6 py-4 sm:px-10 sm:py-5 lg:px-12 xl:px-16 border-l border-stone-200 bg-white overflow-y-auto">
        {/* Top: Brand Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0d4a36] text-white shadow-2xs group-hover:scale-105 transition-transform">
              <Sparkles className="h-3.5 w-3.5 text-emerald-200" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-sm tracking-tight text-stone-900">
                {siteConfig.name}
              </span>
              <span className="rounded bg-emerald-50 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-800 border border-emerald-200/60">
                OS
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
            <span>Enterprise Security</span>
          </div>
        </div>

        {/* Center: Main Onboarding Section */}
        <div className="w-full max-w-sm sm:max-w-md mx-auto my-auto py-6 sm:py-8">
          {/* State 1: Loading */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#0d4a36] flex items-center justify-center mx-auto mb-4 animate-spin">
                <Loader2 className="w-6 h-6" />
              </div>
              <h2 className="text-base font-semibold text-stone-900 mb-1">
                Verifying Invitation
              </h2>
              <p className="text-xs text-stone-500">
                Retrieving workspace membership credentials...
              </p>
            </div>
          )}

          {/* State 2: Error / Expired */}
          {!isLoading && errorMessage && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-semibold text-stone-900 mb-2">
                Invitation Invalid or Expired
              </h2>
              <p className="text-xs text-stone-500 mb-6 leading-relaxed">
                {errorMessage}
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link href="/sign-in" className="w-full">
                  <Button variant="outline" size="sm" className="w-full">
                    Go to Sign In
                  </Button>
                </Link>
                <Link href="/team" className="w-full">
                  <Button size="sm" className="w-full bg-[#0d4a36] hover:bg-[#0d4a36]/90 text-white">
                    Workspace Roster
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* State 3: Already Accepted */}
          {!isLoading && invitation && invitation.isAccepted && !isSuccess && (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50/50">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>Active Member</span>
              </div>
              <h2 className="text-xl font-bold text-stone-900 mb-2">
                Invitation Already Accepted
              </h2>
              <p className="text-xs text-stone-600 mb-6 leading-relaxed max-w-sm mx-auto">
                Membership for <strong className="text-stone-900">{invitation.email}</strong> is active in <strong className="text-stone-900">{invitation.workspaceName}</strong> as <strong className="text-stone-900">{invitation.roleTitle}</strong>.
              </p>

              {isMismatchedSession ? (
                <div className="space-y-3 max-w-sm mx-auto">
                  <div className="p-3 bg-amber-50/90 border border-amber-300 rounded-lg text-left text-xs text-amber-900 space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Account Session Notice</span>
                    </p>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Your browser is currently signed in as <strong>{currentEmail}</strong>. To access this workspace as <strong>{invitation.email}</strong>, test in an Incognito window or switch accounts:
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("Link copied! Open an Incognito window to view as guest.");
                      }}
                      className="text-[11px] h-8 gap-1.5 border-amber-300 bg-white text-amber-900 hover:bg-amber-100/60"
                    >
                      <Copy className="w-3.5 h-3.5 text-amber-700" />
                      <span>Copy for Incognito</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={async () => {
                        await clerk.signOut();
                        router.push(`/sign-in?email_address=${encodeURIComponent(invitation.email)}&redirect_url=${encodeURIComponent("/team")}`);
                      }}
                      className="bg-[#0d4a36] hover:bg-[#0d4a36]/90 text-white text-[11px] h-8 gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign In as Guest</span>
                    </Button>
                  </div>
                </div>
              ) : !isSignedIn ? (
                <Link href={`/sign-in?email_address=${encodeURIComponent(invitation.email)}&redirect_url=${encodeURIComponent("/team")}`}>
                  <Button className="bg-[#0d4a36] hover:bg-[#0d4a36]/90 text-white w-full gap-2 shadow-xs">
                    <span>Sign In to Access Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <Link href="/team">
                  <Button className="bg-[#0d4a36] hover:bg-[#0d4a36]/90 text-white w-full gap-2 shadow-xs">
                    <span>Enter Workspace Team</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* State 4: Standard Onboarding Form */}
          {!isLoading && invitation && !invitation.isAccepted && !isSuccess && (
            <div className="space-y-6">
              {/* Header Box */}
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mb-2.5 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/60 rounded">
                  <Sparkles className="w-3 h-3 text-emerald-700" />
                  <span>WORKSPACE INVITATION</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-stone-900 mb-1">
                  Join {invitation.workspaceName}
                </h2>
                <p className="text-xs text-stone-500">
                  You have been invited to join the brokerage team. Set up your profile below to accept.
                </p>
              </div>

              {/* Mismatched Session Alert for Testing Admins */}
              {isMismatchedSession && (
                <div className="rounded-lg border border-amber-300 bg-amber-50/90 p-3.5 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-semibold text-amber-900">
                        Admin Session Active ({currentEmail})
                      </h4>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        This invitation is addressed to <strong className="font-semibold text-amber-950">{invitation.email}</strong>. Testing in an Incognito window lets you preview as a guest without signing out:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-amber-200/60">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("Invite link copied! Open an Incognito / Private window to test as guest.");
                      }}
                      className="h-8 text-[11px] bg-white border-amber-300 text-amber-900 hover:bg-amber-100/60 gap-1.5 font-medium"
                    >
                      <Copy className="w-3.5 h-3.5 text-amber-700" />
                      <span>Copy Link for Incognito</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await clerk.signOut();
                        window.location.reload();
                      }}
                      className="h-8 text-[11px] bg-white border-amber-300 text-amber-900 hover:bg-amber-100/60 gap-1.5 font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5 text-amber-700" />
                      <span>Sign Out &amp; Switch Account</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Role & Territory Overview Banner */}
              <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200/80 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[#0d4a36]" />
                    <span>{invitation.roleTitle}</span>
                  </span>
                  <span className="text-[11px] text-stone-500 font-medium">
                    {invitation.workspaceName}
                  </span>
                </div>

                {invitation.agent?.territory && (
                  <div className="flex items-center gap-1.5 text-xs text-stone-600 pt-1 border-t border-stone-200/60">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>Territory: <strong className="text-stone-700">{invitation.agent.territory}</strong></span>
                  </div>
                )}

                {invitation.agent?.specializations && invitation.agent.specializations.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {invitation.agent.specializations.map((spec) => (
                      <span
                        key={spec}
                        className="px-2 py-0.5 rounded bg-white border border-stone-200 text-stone-600 font-mono text-[10px] capitalize shadow-2xs"
                      >
                        {spec.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleAccept} className="space-y-4">
                {/* Email (Readonly) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-stone-700 flex items-center justify-between">
                    <span>Invited Email</span>
                    <span className="text-[10px] text-stone-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Workspace Locked
                    </span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="email"
                      value={invitation.email}
                      disabled
                      className="pl-9 bg-stone-50/80 text-stone-500 cursor-not-allowed border-stone-200 text-xs h-9"
                    />
                  </div>
                </div>

                {/* Name Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-stone-700">
                      First Name <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        type="text"
                        placeholder="Marcus"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="pl-9 text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-stone-700">
                      Last Name <span className="text-rose-600">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Vance"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-stone-700 flex items-center justify-between">
                    <span>Direct Phone / WhatsApp</span>
                    <span className="text-[10px] text-stone-400">Buyer call routing</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="tel"
                      placeholder="+234 803 000 0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-9 text-xs h-9"
                    />
                  </div>
                </div>

                {/* Permissions & Security Note */}
                <div className="rounded-md bg-stone-50 border border-stone-200/80 p-3 text-[11px] text-stone-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-medium text-stone-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Role Access &amp; Compliance</span>
                  </div>
                  <p className="text-[10px] text-stone-500 leading-relaxed">
                    {invitation.roleDescription ||
                      "Accepting grants you access to qualified buyer portfolios, automated viewing calendars, and lead routing."}
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#0d4a36] hover:bg-[#0d4a36]/90 text-white font-medium h-9 text-xs shadow-xs transition-all gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Activating Workspace Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Accept Invitation &amp; Join Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* State 5: Success Celebration */}
          {isSuccess && (
            <div className="text-center py-10 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50/50">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-stone-900 mb-1">
                Welcome to {invitation?.workspaceName || "the Team"}!
              </h2>
              <p className="text-xs text-stone-500 mb-6">
                Your broker profile and lead dispatch routing are now active.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-stone-600">
                <Loader2 className="w-4 h-4 animate-spin text-[#0d4a36]" />
                <span>
                  {isMismatchedSession || !isSignedIn
                    ? `Preparing secure sign-in as ${invitation?.email}...`
                    : "Redirecting to Team Roster..."}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom: Clean Operational Footer matching Auth Shell */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400 shrink-0">
          <span>© {new Date().getFullYear()} {siteConfig.name} OS</span>
          <span>Real-Estate AI Sales System</span>
        </div>
      </div>
    </div>
  );
}
