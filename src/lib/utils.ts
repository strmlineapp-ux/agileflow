import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getContrastColor(hexColor: string): string {
  if (!hexColor) return '#000000';
  
  const color = hexColor.charAt(0) === '#' ? hexColor.substring(1, 7) : hexColor;
  if (color.length !== 6) return '#000000';

  try {
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    // http://www.w3.org/TR/AERT#color-contrast
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
  } catch (e) {
    return '#000000';
  }
}
