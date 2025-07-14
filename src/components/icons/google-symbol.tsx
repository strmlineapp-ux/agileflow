
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
  } & React.HTMLAttributes<HTMLSpanElement>
>(({ name, className, filled, variant = 'outlined', weight, ...props }, ref) => {
  const style: React.CSSProperties & { fontVariationSettings?: string } = { ...props.style };
  
  const settings = [];
  if (filled) {
    settings.push(`'FILL' 1`);
  }
  if (weight) {
      settings.push(`'wght' ${weight}`);
  }
  
  // Extract font-size from style or className to apply to opsz
  let fontSize: string | number | undefined = style.fontSize;
  if (!fontSize && className) {
    const sizeClass = className.match(/text-([a-z0-9]+)/);
    if(sizeClass) {
        // This is a simplification; a production app might need a lookup table for Tailwind sizes.
        // For now, we'll try to extract a numeric value if possible.
        // This part is tricky because Tailwind classes aren't directly mappable to opsz values.
        // A better approach is setting font-size directly via style prop.
    }
  }

  if (fontSize) {
    const numericSize = parseInt(typeof fontSize === 'string' ? fontSize : String(fontSize), 10);
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
