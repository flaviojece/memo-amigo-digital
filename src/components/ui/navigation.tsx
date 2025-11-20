import React from "react";
import { Home, Pill, Calendar, Users, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "home", label: "Início", icon: Home },
  { id: "meds", label: "Remédios", icon: Pill },
  { id: "appointments", label: "Consultas", icon: Calendar },
  { id: "contacts", label: "Contatos", icon: Users },
  { id: "more", label: "Mais", icon: MoreHorizontal },
];

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const [hasAnimated, setHasAnimated] = React.useState(false);
  
  React.useEffect(() => {
    // Animar apenas uma vez e salvar no localStorage
    const animated = localStorage.getItem('moreButtonAnimated');
    if (!animated) {
      setHasAnimated(false);
      const timer = setTimeout(() => {
        localStorage.setItem('moreButtonAnimated', 'true');
        setHasAnimated(true);
      }, 3000); // Após 3 segundos (tempo da animação)
      return () => clearTimeout(timer);
    } else {
      setHasAnimated(true);
    }
  }, []);

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 w-full bg-white border-t-4 border-primary shadow-lg z-[9999] min-h-[80px] pb-[env(safe-area-inset-bottom,0px)]"
      role="navigation"
      aria-label="Navegação principal"
    >
      <div className="flex justify-around items-center py-2 px-2 sm:px-4 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isMoreTab = tab.id === "more";
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center p-2 sm:p-3 rounded-senior transition-all duration-300",
                "flex-1 max-w-[80px] min-h-[68px] font-semibold touch-manipulation",
                isMoreTab && !isActive && cn(
                  "bg-accent text-accent-foreground shadow-button border-2 border-accent",
                  !hasAnimated && "animate-bounce-attention"
                ),
                isActive 
                  ? "bg-primary text-primary-foreground shadow-button" 
                  : !isMoreTab && "text-foreground hover:text-foreground hover:bg-muted active:bg-muted/80"
              )}
              aria-label={`${tab.label}${isActive ? ' (página atual)' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-7 h-7 mb-3" />
              <span className="text-xs">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}