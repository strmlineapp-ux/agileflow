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
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/user-context";
import { GoogleSymbol } from "../icons/google-symbol";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
});

export function SignUpForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isEditingEmail, setIsEditingEmail] = React.useState(false);
  const { notifications, setNotifications } = useUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    const newNotification = {
      id: crypto.randomUUID(),
      type: 'access_request' as const,
      status: 'pending' as const,
      user: { // This is the user requesting access
        displayName: values.email,
        avatarUrl: `https://placehold.co/40x40.png`,
        userId: '',
        isAdmin: false,
      },
      content: `${values.email} has requested access.`,
      time: new Date(),
      read: false,
      data: {
        email: values.email,
        displayName: values.email,
      },
    };

    setNotifications([newNotification, ...notifications]);

    toast({
      title: "Request Sent",
      description: "Your access request has been submitted for approval.",
    });

    setTimeout(() => {
      router.push('/login');
    }, 1500);
  }

  return (
    <div className="grid gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-center">
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
                                className="h-auto p-0 border-0 shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                                placeholder="name@example.com"
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
          <Button type="submit" variant="ghost" className="font-bold text-muted-foreground hover:text-primary" disabled={isLoading}>
            <GoogleSymbol name="send" />
            {isLoading ? 'Submitting...' : 'Request Access'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
