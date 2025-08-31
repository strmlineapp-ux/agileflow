
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const TransparentCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg bg-transparent border-none shadow-none",
      className
    )}
    {...props}
  />
))
TransparentCard.displayName = "TransparentCard"


const TransparentCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-0", className)} {...props} />
))
TransparentCardContent.displayName = "TransparentCardContent"

export { TransparentCard, TransparentCardContent }
