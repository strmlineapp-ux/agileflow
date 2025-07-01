import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getContrastColor(hexColor: string): string {
  if (!hexColor) return '#000000';
  
  // Ensure the hex color starts with a #
  if (hexColor.indexOf('#') === 0) {
      hexColor = hexColor.slice(1);
  }

  // Convert 3-digit hex to 6-digits.
  if (hexColor.length === 3) {
      hexColor = hexColor.split('').map(function (hex) {
          return hex + hex;
      }).join('');
  }
  
  if (hexColor.length !== 6) {
    return '#000000'; // Default to black for invalid colors
  }

  try {
    const r = parseInt(hexColor.substring(0, 2), 16);
    const g = parseInt(hexColor.substring(2, 4), 16);
    const b = parseInt(hexColor.substring(4, 6), 16);
    // http://www.w3.org/TR/AERT#color-contrast
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
  } catch (e) {
    return '#000000';
  }
}
