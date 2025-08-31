
import * as React from "react"

import { cn } from "@/lib/utils"

const TransparentCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg text-foreground",
      className
    )}
    {...props}
  />
))
TransparentCard.displayName = "TransparentCard"

const TransparentCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-2", className)}
    {...props}
  />
))
TransparentCardHeader.displayName = "TransparentCardHeader"

const TransparentCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "leading-none tracking-tight break-words",
      className
    )}
    {...props}
  />
))
TransparentCardTitle.displayName = "TransparentCardTitle"

const TransparentCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-foreground", className)}
    {...props}
  />
))
TransparentCardDescription.displayName = "TransparentCardDescription"

const TransparentCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-2 pt-0", className)} {...props} />
))
TransparentCardContent.displayName = "TransparentCardContent"

const TransparentCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-2 pt-0", className)}
    {...props}
  />
))
TransparentCardFooter.displayName = "TransparentCardFooter"

export { TransparentCard, TransparentCardHeader, TransparentCardFooter, TransparentCardTitle, TransparentCardDescription, TransparentCardContent }
