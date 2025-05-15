import * as React from "react"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  indicatorClassName?: string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, indicatorClassName, ...props }, ref) => {
    // Ensure value is between 0 and 100
    const safeValue = Math.min(100, Math.max(0, value || 0));
    
    return (
      <div
        ref={ref}
        className={cn("relative h-2 w-full overflow-hidden rounded-full bg-gray-100", className)}
        {...props}
      >
        <div
          className={cn("h-full w-full flex-1 bg-blue-500 transition-all", indicatorClassName)}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
