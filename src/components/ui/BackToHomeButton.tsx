import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackToHomeButtonProps {
  onBackToHome: () => void;
}

export function BackToHomeButton({ onBackToHome }: BackToHomeButtonProps) {
  return (
    <Button
      onClick={onBackToHome}
      variant="outline"
      size="lg"
      className="group flex items-center gap-3 min-h-[48px] min-w-[200px] 
                 text-primary border-primary/30 hover:bg-primary/10 hover:border-primary 
                 transition-all duration-300 mb-4 touch-manipulation"
    >
      <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
      <Home className="w-5 h-5" />
      <span className="text-senior-base font-medium">Voltar ao Início</span>
    </Button>
  );
}
