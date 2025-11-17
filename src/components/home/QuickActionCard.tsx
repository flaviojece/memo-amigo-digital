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
  className 
}: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "card-memo p-6 text-left w-full transition-all duration-300",
        "hover:scale-105 active:scale-95 min-h-[120px]",
        variant === "emergency" && "bg-destructive text-destructive-foreground shadow-emergency border-destructive",
        variant === "accent" && "bg-accent text-accent-foreground",
        className
      )}
      aria-label={`${title}${subtitle ? ': ' + subtitle : ''}`}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "p-3 rounded-senior flex-shrink-0",
          variant === "emergency" ? "bg-white/20" : "bg-primary/10"
        )}>
          {icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-senior-lg mb-1 truncate">
            {title}
          </h3>
          {subtitle && (
            <p className={cn(
              "text-senior-sm",
              variant === "emergency" 
                ? "text-white/90" 
                : "text-muted-foreground"
            )}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}