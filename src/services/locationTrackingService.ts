import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

interface Position {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
}

class LocationTrackingService {
  private watchId: number | null = null;
  private lastPosition: Position | null = null;
  private userId: string | null = null;
  private updateInterval = 15000; // 15 segundos
  private accuracyThreshold = 50; // 50 metros
  private intervalId: NodeJS.Timeout | null = null;
  private lastHistoryInsert: number = 0;
  
  // Buffer para coletar múltiplas leituras de GPS
  private gpsReadings: GeolocationPosition[] = [];
  private maxReadings = 5; // Coletar 5 leituras antes de processar
  private minAccuracy = 100; // Aceitar apenas leituras com accuracy < 100m

  /**
   * Inicia o rastreamento de localização
   */
  async startTracking(userId: string) {
    this.userId = userId;

    // Verificar permissão
    try {
      const permission = await navigator.permissions.query({ name: "geolocation" as PermissionName });
      if (permission.state === "denied") {
        throw new Error("Permissão de localização negada");
      }
    } catch (error) {
      console.warn("Não foi possível verificar permissão:", error);
    }

    // Configurar watchPosition para atualizações automáticas
    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePosition(position),
      (error) => this.handleError(error),
      {
        enableHighAccuracy: true,
        maximumAge: 0,        // Nunca usar cache
        timeout: 15000,       // Aguardar até 15s por posição precisa
      }
    );

    // Fallback: polling periódico caso watchPosition falhe
    this.intervalId = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => this.handlePosition(position),
        (error) => console.warn("Erro no polling:", error),
        { enableHighAccuracy: true }
      );
    }, this.updateInterval);

    logger.log("✅ Rastreamento iniciado");
  }

  /**
   * Para o rastreamento
   */
  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.userId = null;
    this.lastPosition = null;
    this.gpsReadings = [];

    logger.log("⏸️ Rastreamento pausado");
  }

  /**
   * Processa nova posição
   */
  private async handlePosition(geoPosition: GeolocationPosition) {
    if (!this.userId) return;

    const { accuracy } = geoPosition.coords;

    // 🔍 VALIDAÇÃO DE PRECISÃO (Opção 1)
    if (accuracy > this.minAccuracy) {
      logger.warn(
        `[GPS] Precisão insuficiente: ±${accuracy.toFixed(0)}m (mínimo: ${this.minAccuracy}m) - aguardando...`
      );
      return; // Rejeitar leitura imprecisa
    }

    // 📊 BUFFER DE LEITURAS (Opção 4)
    this.gpsReadings.push(geoPosition);
    logger.log(
      `[GPS] Leitura coletada: ±${accuracy.toFixed(0)}m (${this.gpsReadings.length}/${this.maxReadings})`
    );

    // Aguardar coletar leituras suficientes
    if (this.gpsReadings.length < this.maxReadings) {
      return; // Ainda coletando
    }

    // Processar média das melhores leituras
    const bestPosition = this.calculateBestPosition();
    const { latitude, longitude, accuracy: finalAccuracy, heading, speed } = bestPosition.coords;

    // Verificar se houve movimento significativo
    if (this.lastPosition && finalAccuracy < 100) {
      const distance = this.calculateDistance(
        this.lastPosition.latitude,
        this.lastPosition.longitude,
        latitude,
        longitude
      );

      // Se movimento for menor que threshold, pular atualização
      if (distance < this.accuracyThreshold) {
        logger.log(`Movimento insignificante (${distance.toFixed(0)}m), pulando`);
        this.gpsReadings = []; // Limpar buffer
        return;
      }
    }

    // Obter nível de bateria (se disponível)
    let batteryLevel: number | null = null;
    try {
      if ("getBattery" in navigator) {
        const battery = await (navigator as any).getBattery();
        batteryLevel = Math.round(battery.level * 100);
      }
    } catch (error) {
      logger.warn("Battery API não disponível:", error);
    }

    // Atualizar live_locations (UPSERT)
    const isMoving = speed !== null && speed > 0.5; // >0.5 m/s = movendo
    const { error } = await supabase.from("live_locations").upsert({
      user_id: this.userId,
      latitude,
      longitude,
      accuracy: finalAccuracy,
      heading,
      speed,
      battery_level: batteryLevel,
      is_moving: isMoving,
      last_movement_at: isMoving ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      logger.error("❌ Erro ao atualizar localização:", error);
      this.gpsReadings = []; // Limpar buffer em caso de erro
      return;
    }

    logger.log(`📍 Localização atualizada: [${latitude.toFixed(6)}, ${longitude.toFixed(6)}] ±${finalAccuracy.toFixed(0)}m`);

    // Inserir em location_history (a cada 1 minuto OU movimento >100m)
    const shouldSaveHistory = this.shouldSaveToHistory(latitude, longitude);
    if (shouldSaveHistory) {
      await supabase.from("location_history").insert({
        user_id: this.userId,
        latitude,
        longitude,
        accuracy: finalAccuracy,
        heading,
        speed,
      });
      this.lastHistoryInsert = Date.now();
      logger.log("📝 Histórico salvo");
    }

    // Atualizar última posição
    this.lastPosition = { latitude, longitude, accuracy: finalAccuracy, heading, speed };
    
    // Limpar buffer após processar com sucesso
    this.gpsReadings = [];
  }

  /**
   * Calcula a melhor posição a partir de múltiplas leituras
   * Usa média das 3 leituras mais precisas
   */
  private calculateBestPosition(): GeolocationPosition {
    // Ordenar por precisão (menor accuracy = melhor)
    const sorted = [...this.gpsReadings].sort(
      (a, b) => a.coords.accuracy - b.coords.accuracy
    );

    // Pegar as 3 melhores
    const best3 = sorted.slice(0, 3);

    logger.log(
      `[GPS] Melhores 3 leituras: ${best3.map(p => `±${p.coords.accuracy.toFixed(0)}m`).join(', ')}`
    );

    // Calcular média das coordenadas
    const avgLat = best3.reduce((sum, p) => sum + p.coords.latitude, 0) / 3;
    const avgLon = best3.reduce((sum, p) => sum + p.coords.longitude, 0) / 3;
    const avgAccuracy = best3.reduce((sum, p) => sum + p.coords.accuracy, 0) / 3;
    const avgHeading = best3[0].coords.heading; // Usar mais recente
    const avgSpeed = best3[0].coords.speed; // Usar mais recente

    logger.log(
      `[GPS] ✅ Posição final calculada: [${avgLat.toFixed(6)}, ${avgLon.toFixed(6)}] ±${avgAccuracy.toFixed(0)}m`
    );

    // Retornar objeto no formato GeolocationPosition
    return {
      coords: {
        latitude: avgLat,
        longitude: avgLon,
        accuracy: avgAccuracy,
        heading: avgHeading,
        speed: avgSpeed,
        altitude: null,
        altitudeAccuracy: null,
        toJSON() {
          return {
            latitude: this.latitude,
            longitude: this.longitude,
            accuracy: this.accuracy,
            altitude: this.altitude,
            altitudeAccuracy: this.altitudeAccuracy,
            heading: this.heading,
            speed: this.speed,
          };
        },
      },
      timestamp: Date.now(),
      toJSON() {
        return {
          coords: this.coords,
          timestamp: this.timestamp,
        };
      },
    } as GeolocationPosition;
  }

  /**
   * Calcula distância entre dois pontos (Haversine)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // raio da Terra em metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // distância em metros
  }

  /**
   * Verifica se deve salvar no histórico
   */
  private shouldSaveToHistory(lat: number, lon: number): boolean {
    const oneMinute = 60 * 1000;
    const timeSinceLastInsert = Date.now() - this.lastHistoryInsert;

    // Salvar a cada 1 minuto
    if (timeSinceLastInsert >= oneMinute) {
      return true;
    }

    // OU se movimento for >100m
    if (this.lastPosition) {
      const distance = this.calculateDistance(
        this.lastPosition.latitude,
        this.lastPosition.longitude,
        lat,
        lon
      );
      return distance >= 100;
    }

    return false;
  }

  /**
   * Trata erros de geolocalização
   */
  private handleError(error: GeolocationPositionError) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        logger.error("❌ Permissão de localização negada pelo usuário");
        break;
      case error.POSITION_UNAVAILABLE:
        logger.error("❌ Localização não disponível");
        break;
      case error.TIMEOUT:
        logger.error("⏱️ Timeout ao obter localização");
        break;
      default:
        logger.error("❌ Erro desconhecido:", error.message);
    }
  }
}

export const locationTracker = new LocationTrackingService();
