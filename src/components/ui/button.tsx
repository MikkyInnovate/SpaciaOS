import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#0d4a36] text-white shadow-xs hover:bg-[#093829] active:bg-[#072d21]",
        destructive:
          "bg-rose-600 text-white shadow-xs hover:bg-rose-700 active:bg-rose-800",
        outline:
          "border border-border bg-white text-stone-900 shadow-2xs hover:bg-stone-50 hover:text-stone-950",
        secondary:
          "bg-stone-100 text-stone-900 shadow-2xs hover:bg-stone-200/80",
        ghost:
          "hover:bg-stone-100 hover:text-stone-900 text-stone-700",
        link: "text-[#0d4a36] underline-offset-4 hover:underline",
        accent: "bg-[#0d4a36] text-white shadow-xs hover:bg-[#093829]",
      },
      size: {
        default: "h-9 px-3.5 py-2",
        sm: "h-8 rounded-md px-2.5 text-xs",
        lg: "h-10 rounded-md px-6 text-base",
        icon: "h-8.5 w-8.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
