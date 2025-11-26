import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface QuickActionCardProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: "default" | "emergency" | "accent";
  className?: string;
}

export function QuickActionCard({
  title,
  subtitle,
  icon,
  onClick,
  variant = "default",
  className,
}: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "bg-card rounded-xl border-2 border-border shadow-sm",
        "p-3 text-left w-full h-full",
        "transition-all duration-200 touch-manipulation",
        "hover:shadow-md hover:scale-[1.01] active:scale-[0.99]",
        "min-h-[60px]",
        variant === "emergency" &&
          "bg-destructive text-destructive-foreground shadow-emergency border-destructive",
        variant === "accent" && "bg-accent text-accent-foreground",
        className,
      )}
      aria-label={`${title}${subtitle ? ": " + subtitle : ""}`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "p-2 rounded-lg flex-shrink-0",
            "[&_svg]:w-5 [&_svg]:h-5",
            variant === "emergency" ? "bg-white/20" : "bg-primary/10",
          )}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base leading-tight truncate">
            {title}
          </h3>
          {subtitle && (
            <p
              className={cn(
                "text-xs mt-0.5 truncate",
                variant === "emergency" ? "text-white/80" : "text-muted-foreground",
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
