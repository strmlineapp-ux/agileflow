
import { cn } from "@/lib/utils";
import React from 'react';

type GoogleSymbolVariant = 'outlined' | 'rounded' | 'sharp';

export const GoogleSymbol = React.forwardRef<
  HTMLSpanElement,
  { 
    name: string; 
    className?: string; 
    filled?: boolean;
    variant?: GoogleSymbolVariant;
    weight?: number;
    opticalSize?: number;
  } & React.HTMLAttributes<HTMLSpanElement>
>(({ name, className, filled, variant = 'outlined', weight, opticalSize, ...props }, ref) => {
  const style: React.CSSProperties & { fontVariationSettings?: string } = { ...props.style };
  
  const settings = [];
  if (filled) {
    settings.push(`'FILL' 1`);
  }
  if (weight) {
      settings.push(`'wght' ${weight}`);
  }
  
  // Use the opticalSize prop if provided, otherwise use fontSize.
  if (opticalSize) {
    settings.push(`'opsz' ${opticalSize}`);
  } else if (style.fontSize) {
    const numericSize = parseInt(String(style.fontSize), 10);
    if (!isNaN(numericSize)) {
      settings.push(`'opsz' ${numericSize}`);
    }
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
