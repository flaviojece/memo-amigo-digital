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
          variant="outline"
          size="lg"
          className="w-full justify-between h-auto py-3"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <span>Configurações Avançadas</span>
          </div>
          {isOpen ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-6 mt-6">
        <PrivacyControls settings={settings} />
        <TechnicalInfo lastLocation={lastLocation} settings={settings} />
      </CollapsibleContent>
    </Collapsible>
  );
}
