
import { cn } from "@/lib/utils";
import React from 'react';

// Using a forwardRef so it can be used with asChild prop in some shadcn components
export const GoogleSymbol = React.forwardRef<
  HTMLSpanElement,
  { name: string; className?: string; filled?: boolean } & React.HTMLAttributes<HTMLSpanElement>
>(({ name, className, filled, ...props }, ref) => {
  const style = { ...props.style };
  if (filled) {
    style.fontVariationSettings = `'FILL' 1`;
  }
  
  return (
    <span
      ref={ref}
      className={cn("material-symbols-outlined", className)}
      style={style}
      {...props}
    >
      {name}
    </span>
  );
});
GoogleSymbol.displayName = 'GoogleSymbol';
