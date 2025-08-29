
"use client";

import * as React from "react";
import { useRouter } from 'next/navigation';

import { Button } from "@/components/ui/button";
import { GoogleSymbol } from "../icons/google-symbol";
import { useUser } from "@/context/user-context";

export function LoginForm() {
  const router = useRouter();
  const { googleLogin, realUser, loading, isFirebaseReady } = useUser();
  const [isSigningIn, setIsSigningIn] = React.useState(false);

  React.useEffect(() => {
    // If loading is finished and we have a user, redirect them.
    if (!loading && realUser) {
      if (realUser.accountType === 'Full') {
        router.push('/dashboard/overview');
      }
      // If user is 'Viewer', we let the layout handle the "Awaiting Approval" message,
      // so no redirect is needed here.
    }
  }, [realUser, loading, router]);


  const handleGoogleSignIn = async () => {
    if (!isFirebaseReady) return; 
    setIsSigningIn(true);
    try {
      await googleLogin();
      // The useEffect will now handle the redirect after state updates.
    } catch (error) {
      console.error("Sign-in failed:", error);
      setIsSigningIn(false);
    }
  };
  
  const isButtonDisabled = isSigningIn || loading;

  return (
    <div className="space-y-4">
        <Button variant="outline" type="button" disabled={isButtonDisabled} className="w-full justify-center text-muted-foreground hover:text-primary hover:bg-transparent" onClick={handleGoogleSignIn}>
            {isSigningIn || loading ? (
                <GoogleSymbol name="progress_activity" className="animate-spin mr-2" />
            ) : (
                <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                    <path
                        fill="currentColor"
                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.84-4.32 1.84-3.6 0-6.5-2.95-6.5-6.5s2.9-6.5 6.5-6.5c1.95 0 3.45.82 4.25 1.58l2.5-2.5C18.43 1.18 15.7.01 12.48.01 7.1 0 2.98 3.98 2.98 9.5s4.12 9.5 9.5 9.5c5.13 0 9.04-3.47 9.04-9.25 0-.8-.08-1.32-.19-1.84h-8.9v.01Z"
                    ></path>
                </svg>
            )}
          Sign in with Google
        </Button>
    </div>
  );
}
