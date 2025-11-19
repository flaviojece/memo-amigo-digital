import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Settings } from "lucide-react";
import { PrivacyControls } from "./PrivacyControls";
import { TechnicalInfo } from "./TechnicalInfo";

interface AdvancedSettingsProps {
  settings: any;
  lastLocation: any;
}

export function AdvancedSettings({ settings, lastLocation }: AdvancedSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between text-muted-foreground hover:text-foreground"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="text-sm">Configurações Avançadas</span>
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 mt-4">
        <PrivacyControls settings={settings} />
        <TechnicalInfo lastLocation={lastLocation} settings={settings} />
      </CollapsibleContent>
    </Collapsible>
  );
}
