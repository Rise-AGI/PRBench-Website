"use client"

import { Loader2 } from "lucide-react"

interface ProgressBarProps {
  current: number
  total: number
  className?: string
}

export function ProgressBar({ current, total, className = "" }: ProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Loading results...</span>
        <span className="font-medium">
          {current} / {total}
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
        {/* Animated shimmer effect */}
        <div
          className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-primary/30 to-transparent"
          style={{
            animation: "shimmer 2s infinite",
          }}
        />
      </div>
    </div>
  )
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  text?: string
}

export function LoadingSpinner({ size = "md", text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  return (
    <div className="flex items-center gap-2">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  )
}

interface PulseDotsProps {
  className?: string
}

export function PulseDots({ className = "" }: PulseDotsProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:0ms]" />
      <div className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
      <div className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
    </div>
  )
}

// Add shimmer keyframe to global styles
if (typeof window !== "undefined") {
  const style = document.createElement("style")
  style.textContent = `
    @keyframes shimmer {
      100% {
        transform: translateX(100%);
      }
    }
  `
  document.head.appendChild(style)
}
