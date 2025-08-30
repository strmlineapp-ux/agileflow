
"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"
import { Separator } from "./separator"
import { useUser } from "@/context/user-context"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <div className="relative">
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "flex h-auto items-center justify-around bg-transparent p-0 text-foreground",
        className
      )}
      {...props}
    />
    <Separator className="absolute -bottom-px" />
  </div>
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const { viewAsUser } = useUser();
  const baseWeight = viewAsUser?.fontWeight || 400;
  const isBoldEmphasis = baseWeight === 700;

  const emphasisClass = isBoldEmphasis
    ? "data-[state=active]:text-primary"
    : "data-[state=active]:font-emphasis";

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-none data-[state=active]:bg-transparent",
        emphasisClass,
        className
      )}
      {...props}
    >
        {React.Children.map(children, child => {
          if (React.isValidElement(child) && (child.type as any).displayName === 'GoogleSymbol') {
            return React.cloneElement(child as React.ReactElement<any>, { 
              className: cn(child.props.className, 'transition-all'),
            });
          }
          return child;
        })}
    </TabsPrimitive.Trigger>
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
