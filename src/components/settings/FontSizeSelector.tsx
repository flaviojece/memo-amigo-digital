import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Type } from "lucide-react";
import { useFontSize, OPCOES_FONTE } from "@/contexts/FontSizeContext";
import { cn } from "@/lib/utils";

export function FontSizeSelector() {
  const { escala, setEscala } = useFontSize();

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-senior-lg">
          <Type className="w-6 h-6 text-primary" aria-hidden="true" />
          Tamanho das letras
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-senior-sm text-muted-foreground">
          Escolha o tamanho que você lê com mais conforto. Muda o app inteiro.
        </p>
        <div className="flex gap-3" role="group" aria-label="Tamanho das letras">
          {OPCOES_FONTE.map((opcao, i) => (
            <Button
              key={opcao.valor}
              variant={escala === opcao.valor ? "default" : "outline"}
              onClick={() => setEscala(opcao.valor)}
              aria-pressed={escala === opcao.valor}
              className={cn(
                "flex-1 min-h-[72px] flex flex-col gap-1 border-2",
                escala === opcao.valor && "border-primary"
              )}
            >
              {/* O tamanho do "A" mostra o efeito antes de aplicar */}
              <span
                aria-hidden="true"
                style={{ fontSize: `${18 + i * 8}px`, lineHeight: 1 }}
                className="font-bold"
              >
                {opcao.exemplo}
              </span>
              <span className="text-senior-xs">{opcao.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
