
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

export function hexToHsl(hex: string): string | null {
  if (!hex || !/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) return null;

  let r_hex, g_hex, b_hex;
  if (hex.length === 4) {
    r_hex = hex[1] + hex[1];
    g_hex = hex[2] + hex[2];
    b_hex = hex[3] + hex[3];
  } else {
    r_hex = hex.substring(1, 3);
    g_hex = hex.substring(3, 5);
    b_hex = hex.substring(5, 7);
  }

  let r = parseInt(r_hex, 16) / 255;
  let g = parseInt(g_hex, 16) / 255;
  let b = parseInt(b_hex, 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}
