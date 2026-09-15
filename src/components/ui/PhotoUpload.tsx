import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface PhotoUploadProps {
  /** Caminho atual do arquivo no bucket (não é URL pública) */
  value?: string | null;
  onChange: (path: string | null) => void;
  bucket?: string;
  label?: string;
  ajuda?: string;
}

const MAX_BYTES = 5 * 1024 * 1024;
const LARGURA_MAX = 800;

/**
 * Redimensiona no navegador antes de enviar: foto de celular tem 4 MB,
 * e quem usa o app costuma estar em rede móvel limitada.
 */
async function comprimir(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, LARGURA_MAX / bitmap.width);
  const largura = Math.round(bitmap.width * escala);
  const altura = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, largura, altura);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", 0.82);
  });
}

export function PhotoUpload({
  value,
  onChange,
  bucket = "medication-photos",
  label = "Foto",
  ajuda,
}: PhotoUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [previa, setPrevia] = useState<string | null>(null);

  // Bucket é privado: precisa de URL assinada para exibir
  const carregarPrevia = async (path: string) => {
    const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
    if (data?.signedUrl) setPrevia(data.signedUrl);
  };

  if (value && !previa && !enviando) {
    void carregarPrevia(value);
  }

  const selecionar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > MAX_BYTES) {
      toast({
        title: "Foto muito grande",
        description: "Escolha uma imagem de até 5 MB.",
        variant: "destructive",
      });
      return;
    }

    setEnviando(true);
    try {
      const blob = await comprimir(file);
      const caminho = `${user.id}/${crypto.randomUUID()}.jpg`;

      const { error } = await supabase.storage.from(bucket).upload(caminho, blob, {
        contentType: "image/jpeg",
        upsert: false,
      });
      if (error) throw error;

      // Apaga a anterior para não acumular lixo no bucket
      if (value) await supabase.storage.from(bucket).remove([value]);

      onChange(caminho);
      await carregarPrevia(caminho);
    } catch {
      toast({
        title: "Não foi possível enviar a foto",
        description: "Verifique sua conexão e tente de novo.",
        variant: "destructive",
      });
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remover = async () => {
    if (value) await supabase.storage.from(bucket).remove([value]);
    onChange(null);
    setPrevia(null);
  };

  return (
    <div className="space-y-2">
      <span className="text-senior-base font-semibold block">{label}</span>
      {ajuda && <p className="text-senior-xs text-muted-foreground">{ajuda}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={selecionar}
        className="sr-only"
        aria-label={label}
      />

      {previa ? (
        <div className="flex items-center gap-3">
          <img
            src={previa}
            alt={label}
            className="w-24 h-24 object-cover rounded-senior border-4 border-border"
          />
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              className="min-h-[48px] text-senior-sm"
            >
              Trocar
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={remover}
              className="min-h-[48px] text-senior-sm text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={enviando}
          className="w-full min-h-[64px] text-senior-base border-2 border-dashed"
        >
          {enviando ? (
            <>
              <Loader2 className="w-6 h-6 mr-2 animate-spin" aria-hidden="true" />
              Enviando...
            </>
          ) : (
            <>
              <Camera className="w-6 h-6 mr-2" aria-hidden="true" />
              Tirar foto
            </>
          )}
        </Button>
      )}
    </div>
  );
}
