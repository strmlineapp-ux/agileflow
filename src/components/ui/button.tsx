

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
        default: "text-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-transparent",
        ghost: "hover:bg-transparent hover:text-primary",
        link: "hover:underline",
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
  ({ className, variant, size, asChild = false, enableReset, onReset, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const { viewAsUser } = useUser();
    
    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
      const modifierKey = viewAsUser?.modifierKey || 'shift';
      const isModifierPressed = 
        (modifierKey === 'shift' && e.shiftKey) ||
        (modifierKey === 'alt' && e.altKey) ||
        (modifierKey === 'ctrl' && e.ctrlKey) ||
        (modifierKey === 'meta' && e.metaKey);

      if (enableReset && onReset && isModifierPressed) {
        e.preventDefault();
        e.stopPropagation();
        onReset();
      }
    };

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          "font-emphasis"
        )}
        ref={ref}
        onMouseDown={handleMouseDown}
        onClick={onClick}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
