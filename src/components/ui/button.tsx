
'use client';

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { useUser } from "@/context/user-context";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-transparent",
        secondary:
          "bg-background text-foreground",
        ghost: "text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        circle: "rounded-full",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10 p-0",
        xlarge: "h-12 w-12 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  enableReset?: boolean;
  onReset?: () => void;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, enableReset = false, onReset, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const { viewAsUser } = useUser();
    const baseWeight = viewAsUser?.fontWeight || 400;
    const isBoldEmphasis = baseWeight === 700;

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (enableReset && (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)) {
        event.preventDefault();
        onReset?.();
      } else {
        onClick?.(event);
      }
    };

    const emphasisClass =
      variant === "ghost" || variant === 'outline' || variant === 'secondary'
        ? isBoldEmphasis
          ? "hover:text-primary focus:text-primary"
          : "hover:font-emphasis focus:font-emphasis"
        : "";
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), emphasisClass)}
        ref={ref}
        onClick={handleClick}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
