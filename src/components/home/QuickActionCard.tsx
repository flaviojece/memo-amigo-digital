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
        "card-memo p-4 text-left w-full transition-all duration-300 touch-manipulation",
        "hover:scale-[1.02] active:scale-[0.98] active:brightness-95",
        "min-h-[80px] min-h-touch-comfortable",
        variant === "emergency" &&
          "bg-destructive text-destructive-foreground shadow-emergency border-destructive",
        variant === "accent" && "bg-accent text-accent-foreground",
        className,
      )}
      aria-label={`${title}${subtitle ? ": " + subtitle : ""}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "p-2.5 rounded-xl flex-shrink-0",
            "[&_svg]:w-6 [&_svg]:h-6",
            variant === "emergency" ? "bg-white/20" : "bg-primary/10",
          )}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-senior-base mb-0.5 leading-tight">
            {title}
          </h3>
          {subtitle && (
            <p
              className={cn(
                "text-senior-sm mt-0.5 line-clamp-2",
                variant === "emergency" ? "text-white/90" : "text-muted-foreground",
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
