import { cn } from "@/lib/utils";
import React from 'react';

// Using a forwardRef so it can be used with asChild prop in some shadcn components
export const GoogleSymbol = React.forwardRef<HTMLSpanElement, { name: string, className?: string } & React.HTMLAttributes<HTMLSpanElement>>(
  ({ name, className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn("material-symbols-outlined", className)}
        {...props}
      >
        {name}
      </span>
    );
  }
);
GoogleSymbol.displayName = 'GoogleSymbol';
