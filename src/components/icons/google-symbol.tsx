
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
    weight?: number;
    size?: number;
  } & React.HTMLAttributes<HTMLSpanElement>
>(({ name, className, filled, variant = 'outlined', weight, size, ...props }, ref) => {
  const style: React.CSSProperties & { fontVariationSettings?: string } = { ...props.style };
  
  const settings = [];
  if (filled) {
    settings.push(`'FILL' 1`);
  }
  if (weight) {
      settings.push(`'wght' ${weight}`);
  }
  
  // Use optical size if provided, otherwise it will inherit from font-size
  if (size) {
    settings.push(`'opsz' ${size}`);
    style.fontSize = `${size}px`;
  }

  if (settings.length > 0) {
    style.fontVariationSettings = settings.join(', ');
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
