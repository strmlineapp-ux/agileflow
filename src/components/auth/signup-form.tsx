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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/user-context";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
});

export function SignUpForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
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
      id: new Date().toISOString(),
      type: 'access_request' as const,
      status: 'pending' as const,
      user: { // This is the user requesting access
        displayName: values.email,
        avatarUrl: `https://placehold.co/40x40.png`,
        userId: ''
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="name@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full font-bold" disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Request Access'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
