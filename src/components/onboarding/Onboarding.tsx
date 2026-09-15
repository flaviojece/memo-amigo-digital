import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pill, HeartHandshake, ShieldCheck, ChevronRight } from "lucide-react";

const CHAVE = "dr-memo-onboarding-visto";

export function jaViuOnboarding() {
  try {
    return window.localStorage.getItem(CHAVE) === "1";
  } catch {
    return true;
  }
}

function marcarComoVisto() {
  try {
    window.localStorage.setItem(CHAVE, "1");
  } catch {
    // modo privado: mostra de novo na próxima vez, sem quebrar nada
  }
}

const PASSOS = [
  {
    icone: Pill,
    titulo: "Seus remédios, na hora certa",
    texto:
      "Cadastre cada remédio com foto e horário. O Dr. Memo avisa você na hora, e basta tocar em “Já tomei”.",
    cor: "text-primary",
  },
  {
    icone: HeartHandshake,
    titulo: "Alguém cuidando junto",
    texto:
      "Um filho, um neto, um cuidador. Quem você escolher vira seu Anjo e acompanha de longe, sem precisar ligar toda hora.",
    cor: "text-secondary",
  },
  {
    icone: ShieldCheck,
    titulo: "Ajuda a um toque",
    texto:
      "O botão de emergência avisa seus contatos e envia sua localização. É só segurar por cinco segundos.",
    cor: "text-destructive",
  },
];

/**
 * Três telas na primeira abertura, terminando no convite do Anjo —
 * paciente com anjo é paciente que não abandona o app.
 */
export function Onboarding({ onConcluir }: { onConcluir: () => void }) {
  const [passo, setPasso] = useState(0);
  const navigate = useNavigate();
  const atual = PASSOS[passo];
  const Icone = atual.icone;
  const ultimo = passo === PASSOS.length - 1;

  const concluir = (irParaConvite: boolean) => {
    marcarComoVisto();
    onConcluir();
    if (irParaConvite) navigate("/location-sharing-settings");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col p-6">
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md border-4 border-border">
          <CardContent className="p-8 text-center space-y-6">
            <Icone className={`w-24 h-24 mx-auto ${atual.cor}`} aria-hidden="true" />

            <h1 className="text-senior-2xl font-display text-foreground">{atual.titulo}</h1>

            <p className="text-senior-base text-muted-foreground leading-relaxed">
              {atual.texto}
            </p>

            <div className="flex justify-center gap-2" aria-hidden="true">
              {PASSOS.map((_, i) => (
                <span
                  key={i}
                  className={`h-3 rounded-full transition-all ${
                    i === passo ? "w-8 bg-primary" : "w-3 bg-border"
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3 max-w-md w-full mx-auto">
        {ultimo ? (
          <>
            <Button
              size="lg"
              onClick={() => concluir(true)}
              className="w-full min-h-[72px] text-senior-lg font-bold"
            >
              Convidar meu Anjo agora
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => concluir(false)}
              className="w-full min-h-[56px] text-senior-base"
            >
              Depois eu faço isso
            </Button>
          </>
        ) : (
          <>
            <Button
              size="lg"
              onClick={() => setPasso((p) => p + 1)}
              className="w-full min-h-[72px] text-senior-lg font-bold"
            >
              Continuar
              <ChevronRight className="ml-2 w-6 h-6" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => concluir(false)}
              className="w-full min-h-[56px] text-senior-base text-muted-foreground"
            >
              Pular
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
