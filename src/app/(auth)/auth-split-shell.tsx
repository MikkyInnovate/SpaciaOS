"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Sparkles, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { siteConfig } from "@/lib/config/site";

export interface AuthSplitShellProps {
  children: React.ReactNode;
}

export function AuthSplitShell({ children }: AuthSplitShellProps) {
  const pathname = usePathname();
  const isSignIn = pathname.startsWith("/sign-in");
  const isSignUp = pathname.startsWith("/sign-up");

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-white font-sans text-stone-900">
      {/* Left Column: Edge-to-Edge Form Container */}
      <div className="flex flex-col justify-between min-h-screen p-6 sm:p-10 lg:p-14 xl:p-16 border-r border-stone-200 bg-white">
        {/* Top: Brand Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0d4a36] text-white shadow-2xs">
              <Sparkles className="h-4 w-4 text-emerald-200" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-base tracking-tight text-stone-900">
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

        {/* Center: Auth Form Container */}
        <div className="w-full max-w-sm sm:max-w-md mx-auto my-auto py-8">
          {/* Restrained Segmented Switcher */}
          <div className="grid grid-cols-2 p-1 mb-8 rounded-md bg-stone-100 border border-stone-200 text-xs font-medium text-stone-500">
            <Link
              href="/sign-in"
              className={cn(
                "py-2 text-center rounded-sm transition-all duration-150",
                isSignIn
                  ? "bg-white text-stone-900 font-semibold shadow-xs"
                  : "hover:text-stone-800"
              )}
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className={cn(
                "py-2 text-center rounded-sm transition-all duration-150",
                isSignUp
                  ? "bg-white text-stone-900 font-semibold shadow-xs"
                  : "hover:text-stone-800"
              )}
            >
              Sign up
            </Link>
          </div>

          {/* Form Content */}
          <div className="w-full">
            {children}
          </div>
        </div>

        {/* Bottom: Clean Operational Footer */}
        <div className="pt-6 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
          <span>© {new Date().getFullYear()} {siteConfig.name} OS</span>
          <span>Real-Estate AI Sales System</span>
        </div>
      </div>

      {/* Right Column: Full-Bleed Edge-to-Edge Image (No Rounded Corners) */}
      <div className="hidden lg:block relative min-h-screen w-full bg-stone-950 overflow-hidden">
        <Image
          src="/images/auth-real-estate.jpg"
          alt="Spacia Real Estate Advisory"
          fill
          priority
          sizes="50vw"
          className="object-cover object-center brightness-95"
        />

        {/* Top Status Tag */}
        <div className="absolute top-8 right-8 z-10">
          <span className="inline-flex items-center gap-2 rounded-md bg-stone-900/80 backdrop-blur-md px-3.5 py-1.5 text-xs font-medium text-stone-100 border border-white/10 shadow-lg">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Autonomous Real Estate Core
          </span>
        </div>

        {/* Bottom Overlay & Brand Watermark */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-12 xl:p-16 text-white z-10">
          <div className="space-y-2 max-w-md">
            <div className="flex items-baseline">
              <span className="font-display font-extrabold text-4xl xl:text-5xl tracking-tight text-white">
                Spacia
              </span>
              <span className="text-2xl font-normal text-emerald-400 ml-1">
                ™
              </span>
            </div>
            <p className="text-sm text-stone-200 leading-relaxed font-normal">
              Autonomous prospect response, conversational qualification, and viewing pipeline for premier real-estate developers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
