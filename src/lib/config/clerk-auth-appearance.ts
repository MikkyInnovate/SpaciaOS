/* Clerk sign-in / sign-up appearance in the Pixel design language:
   flat on the page, square corners, Outfit Light headings, mono micro-labels,
   square black buttons that turn brand green on hover. */
export const authAppearance = {
  layout: {
    socialButtonsPlacement: "bottom" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "#14231d",
    colorText: "#14231d",
    colorTextSecondary: "#71717a",
    colorBackground: "#f4f4f2",
    colorInputBackground: "#ffffff",
    colorInputText: "#14231d",
    colorSuccess: "#15803d",
    colorDanger: "#dc2626",
    borderRadius: "2px",
    fontFamily: "var(--font-sans)",
    fontSize: "14px",
  },
  elements: {
    rootBox: "w-full overflow-visible",
    cardBox: "w-full shadow-none! border-0! p-0 bg-transparent! rounded-none! overflow-visible",
    card: "border-0! shadow-none! bg-transparent! p-0! w-full rounded-none! overflow-visible gap-7",
    header: "text-left gap-1.5",
    headerTitle: "font-display font-light! text-[30px]! leading-[1.08]! tracking-[-0.035em]! text-[#14231d]!",
    headerSubtitle: "text-[14px]! text-zinc-500!",
    main: "gap-6",
    form: "flex flex-col gap-5 overflow-visible",
    formField: "m-0 p-0 overflow-visible",
    formFieldRow: "m-0 p-0 overflow-visible",
    formFieldLabelRow: "flex items-center justify-between w-full m-0 mb-2 p-0",
    formFieldLabel: "font-mono! text-[11px]! font-normal! uppercase tracking-[0.14em] text-zinc-500!",
    formFieldAction:
      "font-mono! text-[10px]! uppercase tracking-[0.12em] text-zinc-500! hover:text-[#15803d]! transition-colors cursor-pointer",
    formFieldInputGroup:
      "flex items-center w-full rounded-none! border-0! bg-white! ring-1 ring-zinc-300 focus-within:ring-2 focus-within:ring-[#15803d] transition-shadow shadow-none!",
    formFieldInput:
      "h-11! text-[14px]! px-3.5! bg-white! text-[#14231d] rounded-none! border-0! ring-1 ring-zinc-300 focus:ring-2! focus:ring-[#15803d]! in-[.cl-formFieldInputGroup]:ring-0! shadow-none! w-full placeholder:text-zinc-400",
    formFieldInputShowPasswordButton: "text-zinc-400 hover:text-zinc-700 px-3 cursor-pointer",
    formFieldSuccessText: "text-[12px] text-[#15803d] mt-1.5 font-medium",
    formFieldErrorText: "text-[12px] text-red-600 mt-1.5 font-medium",
    formFieldWarningText: "text-[12px] text-amber-600 mt-1.5",
    formButtonPrimary:
      "h-11! w-full rounded-none! bg-zinc-950! hover:bg-[#15803d]! text-white! font-mono! text-[12px]! font-normal! uppercase tracking-[0.12em] shadow-none! transition-colors duration-300 cursor-pointer after:hidden!",
    buttonArrowIcon: "text-white/70",
    dividerRow: "my-1",
    dividerLine: "bg-zinc-200!",
    dividerText: "font-mono! text-[10px]! uppercase tracking-[0.16em] text-zinc-400!",
    socialButtons: "gap-2",
    socialButtonsBlockButton:
      "h-11! rounded-none! border-0! bg-white! ring-1 ring-zinc-300 hover:ring-[#15803d] hover:bg-white! text-[13px]! font-medium text-[#14231d] shadow-none! transition-shadow",
    socialButtonsIconButton:
      "h-11! rounded-none! border-0! bg-white! ring-1 ring-zinc-300 hover:ring-[#15803d] hover:bg-white! shadow-none! transition-shadow",
    badge: "rounded-none! font-mono! text-[9px]! uppercase tracking-[0.12em] bg-[#f4f4f2]! text-zinc-600! ring-1 ring-zinc-300 shadow-none!",
    footer: "bg-transparent! bg-none! rounded-none! shadow-none! border-t border-zinc-200 mt-2",
    footerAction: "justify-center",
    footerActionText: "text-[13px]! text-zinc-500!",
    footerActionLink: "text-[13px]! font-medium! text-[#15803d]! hover:text-[#0d4a36]! ml-1",
    identityPreview: "rounded-none! ring-1 ring-zinc-300 border-0! bg-white!",
    otpCodeFieldInput: "rounded-none! ring-1 ring-zinc-300 border-0! focus:ring-2! focus:ring-[#15803d]!",
    alternativeMethodsBlockButton: "rounded-none! ring-1 ring-zinc-300 border-0! bg-white! hover:ring-[#15803d]! shadow-none!",
  },
};
