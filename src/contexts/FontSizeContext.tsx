import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type FontScale = "normal" | "grande" | "maior";

const ESCALAS: Record<FontScale, number> = {
  normal: 1,
  grande: 1.15,
  maior: 1.35,
};

export const OPCOES_FONTE: { valor: FontScale; label: string; exemplo: string }[] = [
  { valor: "normal", label: "Normal", exemplo: "A" },
  { valor: "grande", label: "Grande", exemplo: "A" },
  { valor: "maior", label: "Maior", exemplo: "A" },
];

interface FontSizeContextType {
  escala: FontScale;
  setEscala: (e: FontScale) => void;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

const CHAVE = "dr-memo-font-scale";

/**
 * Preferência de tamanho de fonte do usuário.
 * Presbiopia varia muito entre pessoas — nenhum tamanho padrão serve para todos.
 * Fica no dispositivo (localStorage) para valer já na tela de login.
 */
export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [escala, setEscalaState] = useState<FontScale>(() => {
    if (typeof window === "undefined") return "normal";
    const salvo = window.localStorage.getItem(CHAVE) as FontScale | null;
    return salvo && salvo in ESCALAS ? salvo : "normal";
  });

  useEffect(() => {
    document.documentElement.style.setProperty("--font-scale", String(ESCALAS[escala]));
  }, [escala]);

  const setEscala = (e: FontScale) => {
    setEscalaState(e);
    try {
      window.localStorage.setItem(CHAVE, e);
    } catch {
      // modo privado do navegador: a preferência vale só nesta sessão
    }
  };

  return (
    <FontSizeContext.Provider value={{ escala, setEscala }}>{children}</FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const ctx = useContext(FontSizeContext);
  if (!ctx) throw new Error("useFontSize precisa estar dentro de FontSizeProvider");
  return ctx;
}
