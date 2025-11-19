import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackToHomeButtonProps {
  onBackToHome: () => void;
}

export function BackToHomeButton({ onBackToHome }: BackToHomeButtonProps) {
  return (
    <Button
      onClick={onBackToHome}
      variant="ghost"
      size="sm"
      className="group flex items-center gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 mb-2"
    >
      <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
      <span className="text-senior-sm font-medium">Voltar ao Início</span>
    </Button>
  );
}
