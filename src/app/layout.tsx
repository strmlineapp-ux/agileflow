

'use client';

import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import { UserProvider, useUser } from '@/context/user-context';
import { Roboto } from 'next/font/google';
import { ThemeProvider, useTheme } from 'next-themes';
import React, { useState, useEffect } from 'react';
import { GoogleSymbol } from "@/components/icons/google-symbol";
import { cn } from '@/lib/utils';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700'],
  variable: '--font-roboto',
});

function AppBody({ children }: { children: React.ReactNode }) {
    const { viewAsUser } = useUser();
    const { setTheme, theme } = useTheme();

    React.useEffect(() => {
        if (viewAsUser?.theme) {
            setTheme(viewAsUser.theme);
        }
    }, [viewAsUser?.theme, setTheme]);

    React.useEffect(() => {
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
                100: 300,
                300: 400,
                400: 500,
                500: 700,
                700: 700 // For bold, emphasis doesn't change weight
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

            const radius = viewAsUser.radius ?? 0.5;
            root.style.setProperty('--radius', `${radius}rem`);

             // Set primary color
            if (viewAsUser.primaryColor) {
                // The color is already in HSL string format, so we can use it directly.
                const hsl = viewAsUser.primaryColor.replace(/hsl\(|\)/g, "");
                root.style.setProperty('--primary', hsl);
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
    
    return (
        <body className={cn(
            `${roboto.variable} antialiased`,
            (viewAsUser?.fontWeight || 400) >= 700 ? 'bold-emphasis' : ''
        )}>
            {children}
            <Toaster />
        </body>
    );
}

// Wrapper to prevent rendering on the server and during initial hydration
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <GoogleSymbol name="progress_activity" className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

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
      <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
        <UserProvider>
          <ClientOnly>
              <AppBody>
                {children}
              </AppBody>
          </ClientOnly>
        </UserProvider>
      </ThemeProvider>
    </html>
  );
}
