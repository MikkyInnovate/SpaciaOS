export const authAppearance = {
  layout: {
    socialButtonsPlacement: "bottom" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "#0d4a36",
    colorText: "#18181b",
    colorTextSecondary: "#71717a",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#18181b",
    colorSuccess: "#0d4a36",
    borderRadius: "0.375rem",
    fontFamily: "var(--font-sans)",
  },
  elements: {
    rootBox: "w-full overflow-visible",
    cardBox: "w-full shadow-none border-0 p-0 bg-transparent overflow-visible",
    card: "border-0 shadow-none bg-transparent p-0.5 w-full rounded-none overflow-visible",
    main: "w-full gap-4 overflow-visible",
    header: "hidden",
    form: "gap-3 overflow-visible",
    formField: "space-y-1.5 mb-3 overflow-visible",
    formFieldLabel: "text-xs font-medium text-stone-700",
    formFieldRow: "overflow-visible",
    formFieldInputGroup:
      "flex items-center w-full border border-stone-200 focus-within:border-stone-400 focus-within:ring-1 focus-within:ring-stone-400 rounded-md bg-white transition-all overflow-visible shadow-none",
    formFieldInput:
      "text-xs px-3 py-2 h-10 bg-transparent text-stone-900 border-0 focus:ring-0 focus:outline-none shadow-none w-full",
    formFieldInputShowPasswordButton:
      "text-stone-400 hover:text-stone-600 px-3 focus:outline-none cursor-pointer",
    formFieldSuccessText: "text-xs text-emerald-800 mt-1.5 flex items-center gap-1.5 overflow-visible font-medium",
    formFieldErrorText: "text-xs text-rose-600 mt-1.5 overflow-visible font-medium",
    formFieldWarningText: "text-xs text-amber-600 mt-1.5 overflow-visible",
    formButtonPrimary:
      "bg-[#0d4a36] hover:bg-[#093829] text-white font-medium text-xs h-10 rounded-md shadow-xs transition-colors cursor-pointer w-full mt-2",
    dividerRow: "my-4",
    dividerText: "text-[11px] text-stone-400 uppercase tracking-wider",
    socialButtonsBlockButton:
      "border border-stone-200 hover:bg-stone-50 h-10 rounded-md text-xs font-medium text-stone-800 shadow-2xs transition-colors",
    footer: "mt-5 text-center",
    footerActionText: "text-xs text-stone-500",
    footerActionLink:
      "text-[#0d4a36] hover:text-[#093829] font-semibold text-xs transition-colors ml-1",
  },
};
