
import { cn } from "@/lib/utils";
import React from 'react';

type GoogleSymbolVariant = 'outlined' | 'rounded' | 'sharp';

export const GoogleSymbol = React.forwardRef<
  HTMLSpanElement,
  { 
    name: string; 
    className?: string; 
  } & React.HTMLAttributes<HTMLSpanElement>
>(({ name, className, ...props }, ref) => {
  const variantClass = 'material-symbols-outlined';

  const style: React.CSSProperties = { 
    ...props.style,
    fontVariationSettings: `'FILL' var(--global-icon-fill, 0), 'wght' var(--global-icon-weight, 100), 'GRAD' var(--global-icon-grade, 0), 'opsz' var(--global-icon-optical-size, 24)`
  };
  
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
