"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-stone-900 group-[.toaster]:border-stone-200 group-[.toaster]:shadow-lg font-sans",
          description: "group-[.toast]:text-stone-500 text-xs",
          actionButton:
            "group-[.toast]:bg-[#0d4a36] group-[.toast]:text-white font-medium",
          cancelButton:
            "group-[.toast]:bg-stone-100 group-[.toast]:text-stone-600 font-medium",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
