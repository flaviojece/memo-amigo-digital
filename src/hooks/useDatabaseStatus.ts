import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useDatabaseStatus() {
  const [isEmpty, setIsEmpty] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      // RPC security definer: verifica se já existe algum admin sem depender do RLS de profiles.
      // Antes, um usuário sem perfil (falha na trigger) era enviado ao setup inicial.
      const { data, error } = await supabase.rpc('is_system_empty');

      if (error) {
        console.error('Erro ao verificar status do banco:', error);
        setIsEmpty(false);
        return;
      }

      setIsEmpty(data === true);
    } catch (error) {
      console.error('Erro ao verificar status do banco:', error);
      setIsEmpty(false);
    } finally {
      setLoading(false);
    }
  };

  return { isEmpty, loading, recheckStatus: checkDatabaseStatus };
}
