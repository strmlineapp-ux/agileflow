
'use client';

import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import { UserProvider, useUser } from '@/context/user-context';
import { Roboto } from 'next/font/google';
import { ThemeProvider, useTheme } from 'next-themes';
import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700'],
  variable: '--font-roboto',
});

// This component now directly manages the theme and style effects.
function AppThemeManager({ children }: { children: React.ReactNode }) {
    const { viewAsUser } = useUser();
    const { setTheme, theme } = useTheme();

    useEffect(() => {
        if (viewAsUser?.theme) {
            setTheme(viewAsUser.theme);
        }
    }, [viewAsUser?.theme, setTheme]);

    useEffect(() => {
        if (viewAsUser) {
            const root = document.documentElement;
            
            const fontWeight = viewAsUser.fontWeight || 400;
            const isBoldEmphasis = fontWeight >= 700;

            document.body.style.fontWeight = fontWeight.toString();
            
            if (isBoldEmphasis) {
                document.body.classList.add('bold-emphasis');
            } else {
                document.body.classList.remove('bold-emphasis');
            }

            const emphasisWeightMap: { [key: number]: number } = {
                100: 400,
                300: 500,
                400: 700,
                500: 700,
                700: 700
            };
            const emphasisWeight = emphasisWeightMap[fontWeight] || 500;
            root.style.setProperty('--font-weight-emphasis', emphasisWeight.toString());
            
            root.style.setProperty('--global-icon-weight', fontWeight.toString());
            
            const iconGrade = viewAsUser.iconGrade || 0;
            root.style.setProperty('--global-icon-grade', iconGrade.toString());

            const iconOpticalSize = viewAsUser.iconOpticalSize || 24;
            root.style.setProperty('--global-icon-optical-size', iconOpticalSize.toString());

            const iconFill = viewAsUser.iconFill ? 1 : 0;
            root.style.setProperty('--global-icon-fill', iconFill.toString());
            
            if (viewAsUser.iconFill) {
                document.body.classList.add('icon-fill-emphasis');
            } else {
                document.body.classList.remove('icon-fill-emphasis');
            }

            const radius = viewAsUser.radius ?? 0.5;
            root.style.setProperty('--radius', `${radius}rem`);

             // Set primary color
            if (viewAsUser.primaryColor) {
                const match = viewAsUser.primaryColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
                if (match) {
                    const [, h, s, l] = match;
                    root.style.setProperty('--primary', `${h} ${s}% ${l}%`);
                }
            } else {
                 if (theme === 'dark') {
                    root.style.setProperty('--primary', '25 88% 55%');
                } else {
                    root.style.setProperty('--primary', '210 70% 50%');
                }
            }
            
            // Set foreground/contrast
            const themeForeground = theme === 'dark' ? '210 7% 60%' : '210 7% 40%';
            if(viewAsUser.highContrast) {
                root.style.setProperty('--foreground', theme === 'dark' ? '210 7% 80%' : '210 7% 20%');
            } else {
                root.style.setProperty('--foreground', themeForeground);
            }
        }
    }, [viewAsUser, theme]);
    
    return <>{children}</>;
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>AgileFlow</title>
        <meta name="description" content="Task and Calendar Management for agile teams." />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className={cn(roboto.variable, "antialiased")}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
          <UserProvider>
            <AppThemeManager>
              {children}
            </AppThemeManager>
            <Toaster />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
