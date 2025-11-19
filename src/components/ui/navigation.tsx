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
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-card border-t-2 border-border shadow-card z-50"
      role="navigation"
      aria-label="Navegação principal"
    >
      <div className="flex justify-around items-center py-2 px-4 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center p-3 rounded-senior transition-all duration-300",
                "min-w-[68px] min-h-[68px] font-semibold touch-manipulation",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-button" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted/80"
              )}
              aria-label={`${tab.label}${isActive ? ' (página atual)' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-6 h-6 mb-3" />
              <span className="text-xs">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}