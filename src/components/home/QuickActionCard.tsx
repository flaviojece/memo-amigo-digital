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
        "card-memo p-6 w-full flex justify-center transition-all duration-300 touch-manipulation",
        "hover:scale-105 active:scale-95 active:brightness-95 min-h-[140px] min-h-touch-comfortable",
        variant === "emergency" && "bg-destructive text-destructive-foreground shadow-emergency border-destructive",
        variant === "accent" && "bg-accent text-accent-foreground",
        className
      )}
      aria-label={`${title}${subtitle ? ': ' + subtitle : ''}`}
    >
      <div className="flex items-center gap-8 mx-auto">
        <div className={cn(
          "p-3 rounded-senior flex-shrink-0 mr-6",
          "[&_svg]:w-7 [&_svg]:h-7",
          variant === "emergency" ? "bg-white/20" : "bg-primary/10"
        )}>
          {icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-senior-base mb-1 leading-tight whitespace-pre-line">
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