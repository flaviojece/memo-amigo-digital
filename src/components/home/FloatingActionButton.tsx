import { useState } from "react";
import { Plus, Pill, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  onTabChange: (tab: string) => void;
}

export function FloatingActionButton({ onTabChange }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: Pill, label: "Novo Medicamento", tab: "meds", color: "bg-blue-500" },
    { icon: Calendar, label: "Nova Consulta", tab: "appointments", color: "bg-green-500" },
    { icon: Users, label: "Novo Contato", tab: "contacts", color: "bg-purple-500" },
  ];

  const handleAction = (tab: string) => {
    setIsOpen(false);
    onTabChange(tab);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[100px] right-4 z-50 h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-2xl hover:bg-primary/90 transition-all hover:scale-110"
        size="icon"
      >
        <Plus className="w-8 h-8" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-senior-xl">Adicionar...</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {actions.map((action) => (
              <Button
                key={action.tab}
                onClick={() => handleAction(action.tab)}
                size="lg"
                className={cn(
                  "text-senior-base justify-start gap-3",
                  action.color,
                  "hover:opacity-90"
                )}
              >
                <action.icon className="w-6 h-6" />
                {action.label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
