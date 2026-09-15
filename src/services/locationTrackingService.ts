import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

interface Position {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
}

interface TrackingSettings {
  updateIntervalSeconds: number;
  accuracyThresholdMeters: number;
}

const PADRAO: TrackingSettings = {
  updateIntervalSeconds: 15,
  accuracyThresholdMeters: 50,
};

/** Acima disso a leitura é ruim demais para ser útil num mapa. */
const PRECISAO_MAXIMA_ACEITAVEL = 150;

/** Abaixo disso consideramos o aparelho parado (m/s). */
const VELOCIDADE_PARADO = 0.5;

/**
 * Rastreamento de localização.
 *
 * LIMITE IMPORTANTE: isto roda no JavaScript da página e para quando o app sai
 * da tela — o iOS suspende o JS na hora, o Android congela a aba em poucos
 * minutos. Ou seja, NÃO é rastreamento contínuo em segundo plano; é a posição
 * enquanto a pessoa está usando o app.
 *
 * Por isso o serviço registra explicitamente quando parou (`tracking_stopped_at`),
 * para a tela do anjo poder dizer a verdade sobre a idade do dado em vez de
 * mostrar um marcador antigo como se fosse atual.
 *
 * Rastreamento contínuo de verdade só existe em app nativo — planejado para uma
 * etapa futura, com Capacitor.
 */
class LocationTrackingService {
  private watchId: number | null = null;
  private lastPosition: Position | null = null;
  private userId: string | null = null;
  private settings: TrackingSettings = PADRAO;

  private lastHistoryInsert = 0;
  private lastUpsert = 0;

  /** Leituras recentes, usadas só para reduzir ruído com o aparelho parado. */
  private leiturasParado: GeolocationPosition[] = [];

  private onVisibilityChange: (() => void) | null = null;

  /**
   * Inicia o rastreamento. As configurações vêm do banco — antes eram valores
   * fixos no código e a tela de ajustes não tinha efeito nenhum.
   */
  async startTracking(userId: string) {
    this.userId = userId;
    this.settings = await this.carregarConfiguracoes(userId);

    try {
      const permission = await navigator.permissions.query({
        name: "geolocation" as PermissionName,
      });
      if (permission.state === "denied") {
        throw new Error("Permissão de localização negada");
      }
    } catch (error) {
      logger.warn("Não foi possível verificar permissão:", error);
    }

    // Uma única fonte de GPS. Antes havia watchPosition E um setInterval
    // paralelo, ambos em alta precisão — duas linhas de GPS ligadas ao mesmo
    // tempo, o que derrubava a bateria sem nenhum ganho.
    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePosition(position),
      (error) => this.handleError(error),
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 20000,
      }
    );

    // O app pode ser fechado sem passar pelo stopTracking. Registrar a saída
    // deixa claro para o anjo que o dado congelou naquele momento.
    this.onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void this.registrarParada("app_em_segundo_plano");
      }
    };
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    window.addEventListener("pagehide", this.onVisibilityChange);

    await this.registrarInicio();
    logger.log("✅ Rastreamento iniciado (somente com o app aberto)");
  }

  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.onVisibilityChange) {
      document.removeEventListener("visibilitychange", this.onVisibilityChange);
      window.removeEventListener("pagehide", this.onVisibilityChange);
      this.onVisibilityChange = null;
    }

    void this.registrarParada("desligado_pelo_usuario");

    this.userId = null;
    this.lastPosition = null;
    this.leiturasParado = [];

    logger.log("⏸️ Rastreamento pausado");
  }

  /**
   * Registra a posição atual uma única vez, sem ligar o rastreamento contínuo.
   *
   * É o que sustenta os "rastros": o idoso abre o app algumas vezes por dia por
   * causa dos remédios, e cada abertura deixa uma posição recente sem custo de
   * bateria. Na prática rende mais que o rastreamento contínuo, que só funciona
   * com a tela ligada.
   */
  async registrarPosicaoPontual(
    userId: string,
    motivo: "abertura_app" | "remedio_confirmado" | "emergencia"
  ): Promise<boolean> {
    // Emergência é o único caso em que vale insistir por precisão.
    const urgente = motivo === "emergencia";

    try {
      const posicao = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: urgente,
          maximumAge: urgente ? 0 : 60000,
          timeout: urgente ? 20000 : 10000,
        });
      });

      const { latitude, longitude, accuracy, heading, speed } = posicao.coords;

      if (accuracy > PRECISAO_MAXIMA_ACEITAVEL && !urgente) {
        logger.warn(`[GPS] Posição pontual descartada: ±${accuracy.toFixed(0)}m`);
        return false;
      }

      await supabase.from("live_locations").upsert({
        user_id: userId,
        latitude,
        longitude,
        accuracy,
        heading,
        speed,
        battery_level: await this.nivelBateria(),
        is_moving: false,
        source: motivo,
        updated_at: new Date().toISOString(),
      });

      logger.log(`📍 Posição pontual registrada (${motivo})`);
      return true;
    } catch (error) {
      logger.warn("Não foi possível registrar posição pontual:", error);
      return false;
    }
  }

  private async carregarConfiguracoes(userId: string): Promise<TrackingSettings> {
    const { data } = await supabase
      .from("location_sharing_settings")
      .select("update_interval_seconds, accuracy_threshold_meters")
      .eq("user_id", userId)
      .maybeSingle();

    return {
      updateIntervalSeconds:
        data?.update_interval_seconds ?? PADRAO.updateIntervalSeconds,
      accuracyThresholdMeters:
        data?.accuracy_threshold_meters ?? PADRAO.accuracyThresholdMeters,
    };
  }

  private async registrarInicio() {
    if (!this.userId) return;
    await supabase
      .from("location_sharing_settings")
      .update({
        tracking_active: true,
        tracking_stopped_at: null,
        tracking_started_at: new Date().toISOString(),
      })
      .eq("user_id", this.userId);
  }

  private async registrarParada(motivo: string) {
    if (!this.userId) return;
    await supabase
      .from("location_sharing_settings")
      .update({
        tracking_active: false,
        tracking_stopped_at: new Date().toISOString(),
        tracking_stopped_reason: motivo,
      })
      .eq("user_id", this.userId);
    logger.log(`⏹️ Rastreamento interrompido: ${motivo}`);
  }

  private async nivelBateria(): Promise<number | null> {
    try {
      if ("getBattery" in navigator) {
        const battery = await (
          navigator as unknown as { getBattery: () => Promise<{ level: number }> }
        ).getBattery();
        return Math.round(battery.level * 100);
      }
    } catch {
      // Battery API indisponível (é o caso do iOS) — segue sem o dado
    }
    return null;
  }

  private async handlePosition(geoPosition: GeolocationPosition) {
    if (!this.userId) return;

    const { accuracy, speed } = geoPosition.coords;

    // Antes o limite era 100m e a leitura ruim era simplesmente descartada,
    // sem nunca completar o buffer de 5 leituras que o código exigia. Dentro
    // de casa isso travava o rastreamento inteiro, em silêncio.
    if (accuracy > PRECISAO_MAXIMA_ACEITAVEL) {
      logger.warn(`[GPS] Leitura descartada: ±${accuracy.toFixed(0)}m`);
      return;
    }

    const parado = speed === null || speed < VELOCIDADE_PARADO;

    // Média só faz sentido com o aparelho parado — reduz o ruído do GPS.
    // Em movimento, a média devolve um ponto ATRÁS da posição real, entre o
    // início e o fim da janela de coleta. Andando, usamos a leitura atual.
    let posicaoFinal = geoPosition;
    if (parado) {
      this.leiturasParado.push(geoPosition);
      if (this.leiturasParado.length > 3) this.leiturasParado.shift();
      posicaoFinal = this.mediaDasLeituras();
    } else {
      this.leiturasParado = [];
    }

    const coords = posicaoFinal.coords;

    // Respeita o intervalo configurado pelo usuário
    if (Date.now() - this.lastUpsert < this.settings.updateIntervalSeconds * 1000) {
      return;
    }

    // Não grava quando o movimento é menor que o limiar, para não registrar
    // apenas o tremor natural do GPS
    if (this.lastPosition) {
      const distancia = this.calculateDistance(
        this.lastPosition.latitude,
        this.lastPosition.longitude,
        coords.latitude,
        coords.longitude
      );
      if (distancia < this.settings.accuracyThresholdMeters) return;
    }

    const emMovimento = coords.speed !== null && coords.speed > VELOCIDADE_PARADO;

    const { error } = await supabase.from("live_locations").upsert({
      user_id: this.userId,
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      heading: coords.heading,
      speed: coords.speed,
      battery_level: await this.nivelBateria(),
      is_moving: emMovimento,
      last_movement_at: emMovimento ? new Date().toISOString() : undefined,
      source: "rastreamento",
      updated_at: new Date().toISOString(),
    });

    if (error) {
      logger.error("❌ Erro ao atualizar localização:", error);
      return;
    }

    this.lastUpsert = Date.now();
    logger.log(
      `📍 [${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}] ±${coords.accuracy.toFixed(0)}m`
    );

    if (this.shouldSaveToHistory(coords.latitude, coords.longitude)) {
      await supabase.from("location_history").insert({
        user_id: this.userId,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        heading: coords.heading,
        speed: coords.speed,
      });
      this.lastHistoryInsert = Date.now();
    }

    this.lastPosition = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      heading: coords.heading,
      speed: coords.speed,
    };
  }

  /** Média das leituras recentes — só é chamada com o aparelho parado. */
  private mediaDasLeituras(): GeolocationPosition {
    const leituras = this.leiturasParado;
    if (leituras.length === 1) return leituras[0];

    const maisRecente = leituras[leituras.length - 1];
    const lat = leituras.reduce((s, p) => s + p.coords.latitude, 0) / leituras.length;
    const lon = leituras.reduce((s, p) => s + p.coords.longitude, 0) / leituras.length;
    const acc = leituras.reduce((s, p) => s + p.coords.accuracy, 0) / leituras.length;

    return {
      coords: {
        latitude: lat,
        longitude: lon,
        accuracy: acc,
        heading: maisRecente.coords.heading,
        speed: maisRecente.coords.speed,
        altitude: null,
        altitudeAccuracy: null,
        toJSON() {
          return { ...this };
        },
      },
      timestamp: Date.now(),
      toJSON() {
        return { coords: this.coords, timestamp: this.timestamp };
      },
    } as GeolocationPosition;
  }

  /** Distância entre dois pontos, em metros (Haversine). */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const f1 = (lat1 * Math.PI) / 180;
    const f2 = (lat2 * Math.PI) / 180;
    const df = ((lat2 - lat1) * Math.PI) / 180;
    const dl = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(df / 2) * Math.sin(df / 2) +
      Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) * Math.sin(dl / 2);

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private shouldSaveToHistory(lat: number, lon: number): boolean {
    if (Date.now() - this.lastHistoryInsert >= 60_000) return true;

    if (this.lastPosition) {
      return (
        this.calculateDistance(
          this.lastPosition.latitude,
          this.lastPosition.longitude,
          lat,
          lon
        ) >= 100
      );
    }
    return false;
  }

  private handleError(error: GeolocationPositionError) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        logger.error("❌ Permissão de localização negada");
        void this.registrarParada("permissao_negada");
        break;
      case error.POSITION_UNAVAILABLE:
        logger.error("❌ Localização indisponível");
        break;
      case error.TIMEOUT:
        logger.warn("⏱️ Tempo esgotado ao obter localização");
        break;
      default:
        logger.error("❌ Erro de geolocalização:", error.message);
    }
  }
}

export const locationTracker = new LocationTrackingService();
