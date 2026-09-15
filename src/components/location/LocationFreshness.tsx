import { AlertTriangle, Clock, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationFreshnessProps {
  /** Quando a posição foi registrada */
  updatedAt?: string | null;
  /** Se o rastreamento está ativo neste momento */
  trackingActive?: boolean;
  /** Por que parou, quando parou */
  stoppedReason?: string | null;
  /** De onde veio a posição */
  source?: string | null;
  /** Versão compacta, para listas */
  compacto?: boolean;
}

type Nivel = "ativo" | "recente" | "antiga" | "muito_antiga" | "sem_dados";

function classificar(updatedAt?: string | null, trackingActive?: boolean): Nivel {
  if (!updatedAt) return "sem_dados";
  const minutos = (Date.now() - new Date(updatedAt).getTime()) / 60000;
  if (trackingActive && minutos < 5) return "ativo";
  if (minutos < 15) return "recente";
  if (minutos < 60) return "antiga";
  return "muito_antiga";
}

function descreverIdade(updatedAt: string): string {
  const minutos = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 60000);
  if (minutos < 1) return "agora mesmo";
  if (minutos < 60) return `há ${minutos} ${minutos === 1 ? "minuto" : "minutos"}`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} ${horas === 1 ? "hora" : "horas"}`;
  const dias = Math.floor(horas / 24);
  return `há ${dias} ${dias === 1 ? "dia" : "dias"}`;
}

const ORIGEM: Record<string, string> = {
  abertura_app: "quando abriu o aplicativo",
  remedio_confirmado: "quando confirmou o remédio",
  emergencia: "quando acionou a emergência",
  rastreamento: "durante o uso do aplicativo",
};

/**
 * Mostra a idade da posição com o peso visual proporcional ao risco.
 *
 * Um marcador de 4 horas atrás mostrado como "tempo real" faz o anjo relaxar
 * quando deveria agir. Informação velha apresentada como atual é pior que
 * informação nenhuma — por isso o aviso cresce conforme o dado envelhece.
 */
export function LocationFreshness({
  updatedAt,
  trackingActive,
  stoppedReason,
  source,
  compacto = false,
}: LocationFreshnessProps) {
  const nivel = classificar(updatedAt, trackingActive);

  if (nivel === "sem_dados") {
    return (
      <div className="flex items-center gap-2 text-senior-sm text-muted-foreground">
        <Clock className="w-5 h-5 shrink-0" aria-hidden="true" />
        Nenhuma posição registrada ainda
      </div>
    );
  }

  const idade = descreverIdade(updatedAt!);

  if (nivel === "ativo") {
    return (
      <div className="flex items-center gap-2 text-senior-sm font-semibold text-secondary-text">
        <Radio className="w-5 h-5 shrink-0 animate-pulse" aria-hidden="true" />
        Atualizando agora — aplicativo aberto
      </div>
    );
  }

  const estilos: Record<Exclude<Nivel, "ativo" | "sem_dados">, string> = {
    recente: "bg-muted text-foreground border-border",
    antiga: "bg-accent/20 text-foreground border-accent",
    muito_antiga: "bg-destructive/10 text-foreground border-destructive",
  };

  const titulo =
    nivel === "recente"
      ? `Última posição ${idade}`
      : nivel === "antiga"
      ? `Posição de ${idade}`
      : `Posição antiga — ${idade}`;

  if (compacto) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-senior border-2 px-3 py-1 text-senior-xs font-semibold",
          estilos[nivel as keyof typeof estilos]
        )}
      >
        {nivel === "muito_antiga" && (
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
        )}
        {titulo}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-senior border-2 p-4 space-y-2",
        estilos[nivel as keyof typeof estilos]
      )}
      role={nivel === "muito_antiga" ? "alert" : undefined}
    >
      <div className="flex items-center gap-2 text-senior-base font-bold">
        {nivel === "muito_antiga" ? (
          <AlertTriangle className="w-6 h-6 shrink-0" aria-hidden="true" />
        ) : (
          <Clock className="w-6 h-6 shrink-0" aria-hidden="true" />
        )}
        {titulo}
      </div>

      {source && ORIGEM[source] && (
        <p className="text-senior-sm">Registrada {ORIGEM[source]}.</p>
      )}

      {nivel !== "recente" && (
        <p className="text-senior-sm">
          <strong>Esta não é a posição atual.</strong> O aplicativo só registra a
          localização enquanto está aberto no celular
          {stoppedReason === "permissao_negada" && ", e a permissão de localização foi negada"}
          {stoppedReason === "desligado_pelo_usuario" && ", e o compartilhamento foi desligado"}.
        </p>
      )}

      {nivel === "muito_antiga" && (
        <p className="text-senior-sm font-semibold">
          Se você precisa saber onde a pessoa está agora, ligue para ela.
        </p>
      )}
    </div>
  );
}
