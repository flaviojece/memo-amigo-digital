/**
 * Sistema de logging condicional
 * - Em desenvolvimento (DEV): exibe todos os logs
 * - Em produção (PROD): exibe apenas erros críticos
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Log de debug - apenas em desenvolvimento
   * Use para rastreamento de fluxo e debugging
   */
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log de informação - apenas em desenvolvimento
   * Use para informações úteis durante desenvolvimento
   */
  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    }
  },

  /**
   * Warning - apenas em desenvolvimento
   * Use para situações anormais mas não críticas
   */
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Erro - SEMPRE exibido (dev + prod)
   * Use apenas para erros que devem ser monitorados
   */
  error: (...args: any[]) => {
    console.error(...args);
    // Futuro: enviar para Sentry aqui
  },

  /**
   * Debug específico de performance
   */
  time: (label: string) => {
    if (isDev) {
      console.time(label);
    }
  },

  timeEnd: (label: string) => {
    if (isDev) {
      console.timeEnd(label);
    }
  },
};
