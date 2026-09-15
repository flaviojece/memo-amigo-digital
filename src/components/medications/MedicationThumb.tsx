import { useEffect, useState } from "react";
import { Pill } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Miniatura da foto do remédio. O bucket é privado, então a exibição
 * depende de uma URL assinada. Sem foto, cai no ícone de sempre.
 */
export function MedicationThumb({
  path,
  alt,
}: {
  path?: string | null;
  alt: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    if (!path) {
      setUrl(null);
      return;
    }
    supabase.storage
      .from("medication-photos")
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (!cancelado) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      cancelado = true;
    };
  }, [path]);

  if (url) {
    return (
      <img
        src={url}
        alt={alt}
        className="w-16 h-16 object-cover rounded-senior border-2 border-border flex-shrink-0"
      />
    );
  }

  return (
    <div className="p-3 bg-primary/10 rounded-senior flex-shrink-0" aria-hidden="true">
      <Pill className="w-8 h-8 text-primary" />
    </div>
  );
}
