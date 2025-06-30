
import { cn } from "@/lib/utils";
import React from 'react';

type GoogleSymbolVariant = 'outlined' | 'rounded' | 'sharp';

// Using a forwardRef so it can be used with asChild prop in some shadcn components
export const GoogleSymbol = React.forwardRef<
  HTMLSpanElement,
  { 
    name: string; 
    className?: string; 
    filled?: boolean;
    variant?: GoogleSymbolVariant;
  } & React.HTMLAttributes<HTMLSpanElement>
>(({ name, className, filled, variant = 'outlined', ...props }, ref) => {
  const style = { ...props.style };
  if (filled) {
    style.fontVariationSettings = `'FILL' 1`;
  }
  
  const variantClass = `material-symbols-${variant}`;

  return (
    <span
      ref={ref}
      className={cn(variantClass, className)}
      style={style}
      {...props}
    >
      {name}
    </span>
  );
});
GoogleSymbol.displayName = 'GoogleSymbol';
