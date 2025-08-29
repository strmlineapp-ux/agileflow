

'use client';

import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import { UserProvider, useUser } from '@/context/user-context';
import { Roboto } from 'next/font/google';
import { ThemeProvider, useTheme } from 'next-themes';
import React, { useState, useEffect } from 'react';
import { GoogleSymbol } from "@/components/icons/google-symbol";

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700'],
  variable: '--font-roboto',
});

const DynamicStyles = () => {
  const { viewAsUser, loading } = useUser();

  const primaryColor = viewAsUser?.primaryColor;
  const hideWash = viewAsUser?.hideWash;

  React.useEffect(() => {
    const root = document.documentElement;
    if (primaryColor) {
        const hslValues = primaryColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if(hslValues) {
            const primaryHsl = `${hslValues[1]} ${hslValues[2]}% ${hslValues[3]}%`;
            root.style.setProperty('--primary', primaryHsl);
            // Always set wash to be the same as primary
            root.style.setProperty('--wash', primaryHsl);
        }
    } else {
        root.style.removeProperty('--primary');
        root.style.removeProperty('--wash');
    }
    
    // Opacity is now only controlled by the hideWash flag
    if (hideWash) {
        root.style.setProperty('--wash-opacity', '0');
    } else {
        // If a custom color is set, and wash is not hidden, show it.
        // Otherwise, it stays hidden.
        root.style.setProperty('--wash-opacity', primaryColor ? '0.1' : '0');
    }

  }, [primaryColor, hideWash]);


  if (loading) return null;

  return null;
}

function AppBody({ children }: { children: React.ReactNode }) {
    const { viewAsUser } = useUser();
    const { setTheme } = useTheme();

    React.useEffect(() => {
        if (viewAsUser?.theme) {
            setTheme(viewAsUser.theme);
        }
    }, [viewAsUser?.theme, setTheme]);

    React.useEffect(() => {
        if (viewAsUser) {
            const root = document.documentElement;
            
            const fontWeight = viewAsUser.fontWeight || 400;
            document.body.style.fontWeight = fontWeight.toString();
            root.style.setProperty('--global-icon-weight', fontWeight.toString());
            
            const iconGrade = viewAsUser.iconGrade || 0;
            root.style.setProperty('--global-icon-grade', iconGrade.toString());

            const iconOpticalSize = viewAsUser.iconOpticalSize || 24;
            root.style.setProperty('--global-icon-optical-size', iconOpticalSize.toString());

            const iconFill = viewAsUser.iconFill ? 1 : 0;
            root.style.setProperty('--global-icon-fill', iconFill.toString());
        }
    }, [viewAsUser?.fontWeight, viewAsUser?.iconGrade, viewAsUser?.iconOpticalSize, viewAsUser?.iconFill, viewAsUser]);
    
    React.useEffect(() => {
        const root = document.documentElement;
        if (viewAsUser?.primaryColor) {
            const hslValues = viewAsUser.primaryColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
            if (hslValues) {
                const primaryHsl = `${hslValues[1]} ${hslValues[2]}% ${hslValues[3]}%`;
                root.style.setProperty('--primary', primaryHsl);
                root.style.setProperty('--wash', primaryHsl);
            }
        } else {
            root.style.removeProperty('--primary');
            root.style.removeProperty('--wash');
        }
    }, [viewAsUser?.primaryColor, viewAsUser?.theme]);
    
    return (
        <>
            <DynamicStyles />
            {children}
            <Toaster />
        </>
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
      <body className={`${roboto.variable} antialiased`}>
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
      </body>
    </html>
  );
}
