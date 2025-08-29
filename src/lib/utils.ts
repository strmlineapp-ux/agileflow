
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function getLuminance(colorString: string): number | null {
    if (colorString.startsWith('hsl')) {
        const matches = colorString.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/);
        if (!matches) return null;
        // HSL Lightness is a percentage from 0 to 100.
        return parseInt(matches[3]);
    } else { // Assume HEX
        let hexColor = colorString;
        if (hexColor.indexOf("#") === 0) hexColor = hexColor.slice(1);
        if (hexColor.length === 3) hexColor = hexColor.split("").map(hex => hex + hex).join("");
        if (hexColor.length !== 6) return null;

        try {
            const r = parseInt(hexColor.substring(0, 2), 16) / 255;
            const g = parseInt(hexColor.substring(2, 4), 16) / 255;
            const b = parseInt(hexColor.substring(4, 6), 16) / 255;
            // Formula for luminance
            const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            return Math.round(luma * 100);
        } catch (e) {
            return null;
        }
    }
}

/**
 * Returns a readable color against the current theme's background.
 * If the provided color is too light for the light theme or too dark for the dark theme,
 * it returns a muted foreground color. Otherwise, it returns the original color.
 * @param colorString The color to check.
 * @param theme The current theme ('light' or 'dark').
 * @returns The original color or a muted fallback color.
 */
export function getReadableColor(colorString: string, theme?: string): string {
    const fallbackColor = "hsl(var(--muted-foreground))";
    if (!colorString) return fallbackColor;

    const luma = getLuminance(colorString);
    if (luma === null) return fallbackColor;

    const isTooLight = theme === 'light' && luma >= 90;
    const isTooDark = theme === 'dark' && luma <= 10;

    if (isTooLight || isTooDark) {
        return fallbackColor;
    }

    return colorString;
}


export function getContrastColor(colorString: string): string {
    if (!colorString) return "hsl(var(--muted-foreground))";

    if (colorString.startsWith('hsl')) {
        const matches = colorString.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/);
        if (!matches) return "hsl(var(--muted-foreground))";
        const l = parseInt(matches[3]);
        return (l > 50) ? '#000000' : '#FFFFFF';
    } else {
         try {
            let hexColor = colorString;
            if (hexColor.indexOf("#") === 0) hexColor = hexColor.slice(1);
            if (hexColor.length === 3) hexColor = hexColor.split("").map(hex => hex + hex).join("");
            const r = parseInt(hexColor.substring(0, 2), 16);
            const g = parseInt(hexColor.substring(2, 4), 16);
            const b = parseInt(hexColor.substring(4, 6), 16);
            const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
            return (yiq >= 128) ? "#000000" : "#FFFFFF";
        } catch (e) {
            return "#000000";
        }
    }
}

/**
 * A robust function to check if an item's hue is within a certain range of a target hue.
 * This correctly handles the circular nature of hue values (e.g., 350 is close to 10).
 * @param targetHue The central hue value of the desired range.
 * @param itemHue The hue value of the item to check.
 * @param range The +/- range to check against (e.g., 20 for a total range of 40).
 * @returns `true` if the item's hue is within the range, `false` otherwise.
 */
export function isHueInRange(targetHue: number, itemHue: number, range: number = 20): boolean {
    const lowerBound = targetHue - range;
    const upperBound = targetHue + range;

    if (lowerBound < 0) {
        // Wraps around the 0/360 point (e.g., range for hue 10 is 350-30)
        return itemHue >= (360 + lowerBound) || itemHue <= upperBound;
    }
    if (upperBound > 360) {
        // Wraps around the 360/0 point (e.g., range for hue 350 is 330-10)
        return itemHue >= lowerBound || itemHue <= (upperBound - 360);
    }
    
    // Normal case, no wrapping
    return itemHue >= lowerBound && itemHue <= upperBound;
}

export const getHueFromHsl = (hsl: string | null): number | null => {
    if (!hsl || !hsl.startsWith('hsl')) return null;
    const match = hsl.match(/hsl\((\d+)/);
    return match ? parseInt(match[1], 10) : null;
};
