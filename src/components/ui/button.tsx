import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /* Literal Tailwind blues so CTAs always read as “primary” even if CSS-variable order fails in dev */
        default:
          "bg-blue-600 text-white shadow-sm ring-offset-slate-50 hover:bg-blue-700 focus-visible:ring-blue-500 dark:bg-blue-500 dark:ring-offset-slate-950 dark:hover:bg-blue-600",
        destructive:
          "bg-red-600 text-white ring-offset-white hover:bg-red-700 focus-visible:ring-red-500 dark:ring-offset-background",
        outline:
          "border border-slate-300 bg-white text-slate-900 ring-offset-slate-50 hover:bg-slate-50 dark:border-input dark:bg-background dark:text-foreground dark:ring-offset-background dark:hover:bg-accent dark:hover:text-accent-foreground",
        secondary:
          "bg-slate-200 text-slate-900 ring-offset-slate-50 hover:bg-slate-300 dark:bg-secondary dark:text-secondary-foreground dark:ring-offset-background dark:hover:bg-secondary/80",
        ghost:
          "text-slate-900 ring-offset-white hover:bg-slate-100 dark:text-foreground dark:ring-offset-background dark:hover:bg-accent dark:hover:text-accent-foreground",
        link: "text-blue-600 underline-offset-4 hover:underline dark:text-blue-400",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
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
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
