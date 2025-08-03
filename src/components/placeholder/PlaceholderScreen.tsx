import { ReactNode } from "react";
import { Construction } from "lucide-react";

interface PlaceholderScreenProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

export function PlaceholderScreen({ 
  title, 
  description, 
  icon = <Construction className="w-16 h-16 text-primary" />
}: PlaceholderScreenProps) {
  return (
    <div className="min-h-screen bg-background pb-24 flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          {icon}
        </div>
        
        <div className="space-y-4">
          <h1 className="text-senior-2xl font-bold text-foreground">
            {title}
          </h1>
          
          <p className="text-senior-lg text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        <div className="bg-card p-6 rounded-memo border-2 border-border">
          <p className="text-senior-base text-accent font-semibold">
            🚧 Em desenvolvimento
          </p>
          <p className="text-senior-sm text-muted-foreground mt-2">
            Esta tela será implementada nas próximas atualizações do Dr. Memo
          </p>
        </div>
      </div>
    </div>
  );
}