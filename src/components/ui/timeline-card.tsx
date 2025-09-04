
import * as React from "react"
import { cn } from "@/lib/utils"

const TimelineCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg bg-card text-foreground flex flex-col h-full",
      className
    )}
    {...props}
  />
))
TimelineCard.displayName = "TimelineCard"

const TimelineCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
))
TimelineCardHeader.displayName = "TimelineCardHeader"

const TimelineCardTitle = React.forwardRef<
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
TimelineCardTitle.displayName = "TimelineCardTitle"

const TimelineCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm", className)}
    {...props}
  />
))
TimelineCardDescription.displayName = "TimelineCardDescription"

const TimelineCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex-1 min-h-0", className)} {...props} />
))
TimelineCardContent.displayName = "TimelineCardContent"

const TimelineCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-2 pt-0", className)}
    {...props}
  />
))
TimelineCardFooter.displayName = "TimelineCardFooter"

export { TimelineCard, TimelineCardHeader, TimelineCardFooter, TimelineCardTitle, TimelineCardDescription, TimelineCardContent }

    