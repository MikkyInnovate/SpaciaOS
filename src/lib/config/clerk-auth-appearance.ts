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
    header: "mb-2.5 text-left",
    headerTitle: "font-display font-bold text-lg text-stone-900 tracking-tight",
    headerSubtitle: "text-xs text-stone-500 mt-0.5",
    form: "flex flex-col gap-2 overflow-visible",
    formField: "m-0 p-0 overflow-visible space-y-0",
    formFieldRow: "m-0 p-0 overflow-visible space-y-0",
    formFieldLabelRow: "flex items-center justify-between w-full m-0 mb-1 p-0",
    formFieldLabel: "text-xs font-medium text-stone-700 m-0",
    formFieldAction:
      "text-[11px] text-[#0d4a36] hover:text-[#093829] font-medium transition-colors cursor-pointer",
    formFieldInputGroup:
      "flex items-center w-full border border-stone-200 focus-within:border-stone-400 focus-within:ring-1 focus-within:ring-stone-400 rounded-md bg-white transition-all overflow-visible shadow-none",
    formFieldInput:
      "text-xs px-3 py-1.5 h-9 bg-transparent text-stone-900 border-0 focus:ring-0 focus:outline-none shadow-none w-full",
    formFieldInputShowPasswordButton:
      "text-stone-400 hover:text-stone-600 px-2.5 focus:outline-none cursor-pointer",
    formFieldSuccessText: "text-xs text-emerald-800 mt-1 flex items-center gap-1.5 overflow-visible font-medium",
    formFieldErrorText: "text-xs text-rose-600 mt-1 overflow-visible font-medium",
    formFieldWarningText: "text-xs text-amber-600 mt-1 overflow-visible",
    formButtonPrimary:
      "bg-[#0d4a36] hover:bg-[#093829] text-white font-medium text-xs h-9 rounded-md shadow-xs transition-colors cursor-pointer w-full mt-1.5",
    dividerRow: "my-2",
    dividerText: "text-[10px] text-stone-400 uppercase tracking-wider",
    socialButtonsBlockButton:
      "border border-stone-200 hover:bg-stone-50 h-9 rounded-md text-xs font-medium text-stone-800 shadow-2xs transition-colors",
    footer: "mt-2.5 text-center",
    footerActionText: "text-xs text-stone-500",
    footerActionLink:
      "text-[#0d4a36] hover:text-[#093829] font-semibold text-xs transition-colors ml-1",
  },
};
