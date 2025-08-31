
"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative w-full touch-none select-none h-0",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="absolute h-0.5 w-full grow overflow-hidden rounded-full bg-foreground top-1/2 -translate-y-1/2">
        <div className="absolute w-full -translate-y-1/2 top-1/2 h-full flex justify-between">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-2 w-px bg-foreground" />
            ))}
        </div>
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-foreground bg-card transition-colors disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
