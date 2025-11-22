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
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error) {
        console.error('Erro ao verificar status do banco:', error);
        setIsEmpty(false);
        return;
      }

      setIsEmpty(!data || data.length === 0);
    } catch (error) {
      console.error('Erro ao verificar status do banco:', error);
      setIsEmpty(false);
    } finally {
      setLoading(false);
    }
  };

  return { isEmpty, loading, recheckStatus: checkDatabaseStatus };
}
