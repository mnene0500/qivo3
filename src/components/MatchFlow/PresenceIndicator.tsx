
"use client";

import { cn } from "@/lib/utils";

type PresenceStatus = "online" | "busy" | "away" | "focus";

interface PresenceIndicatorProps {
  status: PresenceStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PresenceIndicator({ status, size = "sm", className }: PresenceIndicatorProps) {
  const sizeClasses = {
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const statusColors = {
    online: "bg-emerald-400",
    busy: "bg-rose-500",
    away: "bg-amber-400",
    focus: "bg-primary animate-pulse-presence",
  };

  return (
    <div className={cn("relative inline-flex", className)}>
      <span
        className={cn(
          "rounded-full ring-2 ring-background",
          sizeClasses[size],
          statusColors[status]
        )}
      />
      {status === "focus" && (
        <span
          className={cn(
            "absolute inset-0 rounded-full bg-primary/40 animate-ping",
            sizeClasses[size]
          )}
        />
      )}
    </div>
  );
}
