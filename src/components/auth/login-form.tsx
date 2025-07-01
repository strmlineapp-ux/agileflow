
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from 'next/navigation';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { GoogleSymbol } from "../icons/google-symbol";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isEditingEmail, setIsEditingEmail] = React.useState(false);
  const [isEditingPassword, setIsEditingPassword] = React.useState(false);
  const passwordInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  React.useEffect(() => {
    if (isEditingPassword) {
      passwordInputRef.current?.focus();
    }
  }, [isEditingPassword]);

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      setIsEditingEmail(false);
      setIsEditingPassword(true);
    }
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    console.log(values);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard/calendar');
    }, 1000);
  }

  return (
    <div className="grid gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
           <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                    {isEditingEmail ? (
                        <div className="flex items-center gap-2">
                            <GoogleSymbol name="email" className="text-muted-foreground" />
                            <Input
                                {...field}
                                onBlur={() => setIsEditingEmail(false)}
                                autoFocus
                                onKeyDown={handleEmailKeyDown}
                                className="h-auto p-0 border-0 shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                                placeholder="Email"
                            />
                        </div>
                    ) : (
                        <button type="button" onClick={() => setIsEditingEmail(true)} className="flex items-center gap-2 w-full text-left text-muted-foreground hover:text-primary/80 transition-colors">
                            <GoogleSymbol name="email" />
                            <span className="flex-1">{field.value || 'Email'}</span>
                        </button>
                    )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                    {isEditingPassword ? (
                         <div className="flex items-center gap-2">
                            <GoogleSymbol name="lock" className="text-muted-foreground" />
                            <Input
                                {...field}
                                ref={passwordInputRef}
                                type="password"
                                onBlur={() => setIsEditingPassword(false)}
                                autoFocus
                                className="h-auto p-0 border-0 shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                                placeholder="Password"
                            />
                        </div>
                    ) : (
                        <button type="button" onClick={() => setIsEditingPassword(true)} className="flex items-center gap-2 w-full text-left text-muted-foreground hover:text-primary/80 transition-colors">
                            <GoogleSymbol name="lock" />
                            <span>Password</span>
                        </button>
                    )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col items-center gap-2 pt-2">
            <Button variant="ghost" type="submit" disabled={isLoading} className="font-semibold text-muted-foreground hover:text-primary">
              <GoogleSymbol name="login" />
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button variant="ghost" type="button" disabled={isLoading} className="font-semibold text-muted-foreground hover:text-primary">
              <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                <path
                  fill="currentColor"
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.84-4.32 1.84-3.6 0-6.5-2.95-6.5-6.5s2.9-6.5 6.5-6.5c1.95 0 3.45.82 4.25 1.58l2.5-2.5C18.43 1.18 15.7.01 12.48.01 7.1 0 2.98 3.98 2.98 9.5s4.12 9.5 9.5 9.5c5.13 0 9.04-3.47 9.04-9.25 0-.8-.08-1.32-.19-1.84h-8.9v.01Z"
                ></path>
              </svg>
              Sign in with Google
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
