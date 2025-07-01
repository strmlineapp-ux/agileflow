
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { GoogleSymbol } from "../icons/google-symbol";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isEmailEditing, setIsEmailEditing] = React.useState(false);
  const [isPasswordEditing, setIsPasswordEditing] = React.useState(false);

  const emailInputRef = React.useRef<HTMLInputElement>(null);
  const passwordInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  React.useEffect(() => {
    if (isEmailEditing) emailInputRef.current?.focus();
  }, [isEmailEditing]);

  React.useEffect(() => {
    if (isPasswordEditing) passwordInputRef.current?.focus();
  }, [isPasswordEditing]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    console.log(values);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard/calendar');
    }, 1000);
  };
  
  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      form.trigger('email').then(isValid => {
        if (isValid) {
          setIsEmailEditing(false);
          setIsPasswordEditing(true);
        }
      });
    }
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex items-center justify-between gap-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="flex-1">
                <div
                  className={cn("flex items-center gap-2 w-full text-left text-muted-foreground transition-colors p-2 h-10",
                    !isEmailEditing && "cursor-text hover:text-primary/80"
                  )}
                  onClick={() => !isEmailEditing && setIsEmailEditing(true)}
                >
                  <GoogleSymbol name="email" className="text-lg" />
                  {isEmailEditing ? (
                    <FormControl>
                      <Input
                        {...field}
                        ref={emailInputRef}
                        onBlur={() => setIsEmailEditing(false)}
                        onKeyDown={handleEmailKeyDown}
                        className="h-auto p-0 border-0 shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground"
                        placeholder="Email"
                      />
                    </FormControl>
                  ) : (
                    <span className="flex-1 text-sm">{field.value || 'Email'}</span>
                  )}
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="flex-1">
                <div
                  className={cn("flex items-center gap-2 w-full text-left text-muted-foreground transition-colors p-2 h-10",
                    !isPasswordEditing && "cursor-text hover:text-primary/80"
                  )}
                  onClick={() => !isPasswordEditing && setIsPasswordEditing(true)}
                >
                  <GoogleSymbol name="lock" className="text-lg" />
                  {isPasswordEditing ? (
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        ref={passwordInputRef}
                        onBlur={() => setIsPasswordEditing(false)}
                        onKeyDown={handlePasswordKeyDown}
                        className="h-auto p-0 border-0 shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground"
                        placeholder="Password"
                      />
                    </FormControl>
                  ) : (
                    <span className="flex-1 text-sm">{field.value ? '••••••••' : 'Password'}</span>
                  )}
                </div>
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-1 pt-2">
          <Button variant="ghost" type="button" disabled={isLoading} className="w-full justify-center text-muted-foreground hover:text-primary hover:bg-transparent">
              <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
              <path
                  fill="currentColor"
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.84-4.32 1.84-3.6 0-6.5-2.95-6.5-6.5s2.9-6.5 6.5-6.5c1.95 0 3.45.82 4.25 1.58l2.5-2.5C18.43 1.18 15.7.01 12.48.01 7.1 0 2.98 3.98 2.98 9.5s4.12 9.5 9.5 9.5c5.13 0 9.04-3.47 9.04-9.25 0-.8-.08-1.32-.19-1.84h-8.9v.01Z"
              ></path>
              </svg>
              Sign in with Google
          </Button>

          <div className="w-1/3 mx-auto py-1">
            <Separator />
          </div>

          <div className="flex justify-between items-center">
              <Button asChild variant="ghost" className="text-sm font-normal text-muted-foreground hover:text-primary hover:bg-transparent">
                  <Link href="/signup">
                      <GoogleSymbol name="person_add" />
                      Sign up
                  </Link>
              </Button>
              <Button type="submit" variant="ghost" className="text-sm font-normal text-muted-foreground hover:text-primary hover:bg-transparent" disabled={isLoading}>
                  {isLoading ? <GoogleSymbol name="progress_activity" className="animate-spin" /> : (
                      <>
                          <GoogleSymbol name="login" />
                          <span>Sign In</span>
                      </>
                  )}
              </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
