import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

export function LoadingSpinner({ 
  message = "Carregando...", 
  size = "md",
  fullScreen = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6",   // 24px
    md: "w-8 h-8",   // 32px  
    lg: "w-10 h-10"  // 40px
  };

  const content = (
    <div className="text-center space-y-3">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary mx-auto`} />
      {message && (
        <p className="text-senior-base text-muted-foreground">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {content}
      </div>
    );
  }

  return <div className="py-8">{content}</div>;
}
