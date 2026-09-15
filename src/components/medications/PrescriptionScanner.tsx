import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Loader2, AlertTriangle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MedicamentoExtraido {
  nome: string;
  dosagem: string;
  frequencia: string;
  horarios_sugeridos: string[];
  observacoes: string;
  confianca: "alta" | "media" | "baixa";
}

interface PrescriptionScannerProps {
  aberto: boolean;
  onFechar: () => void;
  patientId: string;
  /** Chamado com a lista revisada e confirmada pelo usuário */
  onConfirmar: (medicamentos: MedicamentoExtraido[]) => Promise<void> | void;
}

async function paraBase64(file: File): Promise<{ base64: string; tipo: string }> {
  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
  return { base64: dataUrl.split(",")[1], tipo: "image/jpeg" };
}

/**
 * Fotografa a receita, propõe os medicamentos e obriga a revisão campo a campo.
 * Nada é salvo antes de o usuário conferir — e, no fluxo do anjo, o paciente
 * ainda precisa aprovar depois.
 */
export function PrescriptionScanner({
  aberto,
  onFechar,
  patientId,
  onConfirmar,
}: PrescriptionScannerProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [lendo, setLendo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [itens, setItens] = useState<MedicamentoExtraido[] | null>(null);

  const escolherFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLendo(true);
    setAviso("");
    try {
      const { base64, tipo } = await paraBase64(file);
      const { data, error } = await supabase.functions.invoke("extract-prescription", {
        body: { imageBase64: base64, mediaType: tipo, patientId },
      });
      if (error) throw error;

      const lista: MedicamentoExtraido[] = data?.medicamentos ?? [];
      setItens(lista);
      setAviso(data?.aviso ?? "");

      if (lista.length === 0) {
        toast({
          title: "Nada encontrado na foto",
          description: data?.aviso || "Tente uma foto mais próxima e bem iluminada.",
        });
      }
    } catch {
      toast({
        title: "Não consegui ler a receita",
        description: "Tente novamente ou cadastre à mão.",
        variant: "destructive",
      });
    } finally {
      setLendo(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const atualizar = (i: number, campo: keyof MedicamentoExtraido, valor: string) => {
    setItens((atual) =>
      atual!.map((m, idx) => (idx === i ? { ...m, [campo]: valor } : m))
    );
  };

  const remover = (i: number) => {
    setItens((atual) => atual!.filter((_, idx) => idx !== i));
  };

  const confirmar = async () => {
    if (!itens?.length) return;
    setSalvando(true);
    try {
      await onConfirmar(itens);
      setItens(null);
      onFechar();
    } finally {
      setSalvando(false);
    }
  };

  const fechar = () => {
    setItens(null);
    setAviso("");
    onFechar();
  };

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && fechar()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-senior-xl">Ler receita por foto</DialogTitle>
          <DialogDescription className="text-senior-sm">
            A leitura é automática e pode errar. Confira cada campo antes de confirmar.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={escolherFoto}
          className="sr-only"
          aria-label="Foto da receita"
        />

        {!itens && (
          <Button
            size="lg"
            onClick={() => inputRef.current?.click()}
            disabled={lendo}
            className="w-full min-h-[72px] text-senior-base"
          >
            {lendo ? (
              <>
                <Loader2 className="w-6 h-6 mr-2 animate-spin" aria-hidden="true" />
                Lendo a receita...
              </>
            ) : (
              <>
                <Camera className="w-6 h-6 mr-2" aria-hidden="true" />
                Fotografar receita
              </>
            )}
          </Button>
        )}

        {aviso && (
          <div className="flex items-start gap-2 rounded-senior bg-accent/20 p-3">
            <AlertTriangle className="w-5 h-5 text-accent-text shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-senior-sm text-foreground">{aviso}</p>
          </div>
        )}

        {itens && itens.length > 0 && (
          <div className="space-y-4">
            {itens.map((m, i) => (
              <Card key={i} className="border-2">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant={m.confianca === "alta" ? "secondary" : "outline"}
                      className="text-senior-xs"
                    >
                      {m.confianca === "alta"
                        ? "Leitura clara"
                        : m.confianca === "media"
                        ? "Confira com atenção"
                        : "Leitura duvidosa"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remover(i)}
                      className="text-destructive"
                      aria-label={`Remover ${m.nome}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </div>

                  <div>
                    <Label className="text-senior-sm">Nome</Label>
                    <Input
                      value={m.nome}
                      onChange={(e) => atualizar(i, "nome", e.target.value)}
                      className="text-senior-base mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-senior-sm">Dosagem</Label>
                      <Input
                        value={m.dosagem}
                        onChange={(e) => atualizar(i, "dosagem", e.target.value)}
                        placeholder="ex: 50mg"
                        className="text-senior-base mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-senior-sm">Frequência</Label>
                      <Input
                        value={m.frequencia}
                        onChange={(e) => atualizar(i, "frequencia", e.target.value)}
                        placeholder="ex: 1x ao dia"
                        className="text-senior-base mt-1"
                      />
                    </div>
                  </div>

                  {m.observacoes && (
                    <p className="text-senior-xs text-muted-foreground">{m.observacoes}</p>
                  )}
                </CardContent>
              </Card>
            ))}

            <p className="text-senior-xs text-muted-foreground">
              Na dúvida sobre qualquer campo, confira na receita em papel antes de confirmar.
            </p>

            <div className="flex gap-3">
              <Button variant="outline" onClick={fechar} className="flex-1 min-h-[56px]">
                Cancelar
              </Button>
              <Button
                onClick={confirmar}
                disabled={salvando}
                className="flex-1 min-h-[56px] text-senior-base"
              >
                {salvando ? "Enviando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
