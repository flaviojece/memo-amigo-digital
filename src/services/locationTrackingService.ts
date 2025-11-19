import { supabase } from "@/integrations/supabase/client";

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
        maximumAge: 5000,
        timeout: 10000,
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

    console.log("✅ Rastreamento iniciado");
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

    console.log("⏸️ Rastreamento pausado");
  }

  /**
   * Processa nova posição
   */
  private async handlePosition(geoPosition: GeolocationPosition) {
    if (!this.userId) return;

    const { latitude, longitude, accuracy, heading, speed } = geoPosition.coords;

    // Verificar se houve movimento significativo
    if (this.lastPosition && accuracy < 100) {
      const distance = this.calculateDistance(
        this.lastPosition.latitude,
        this.lastPosition.longitude,
        latitude,
        longitude
      );

      // Se movimento for menor que threshold, pular atualização
      if (distance < this.accuracyThreshold) {
        console.log(`Movimento insignificante (${distance.toFixed(0)}m), pulando`);
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
      console.warn("Battery API não disponível:", error);
    }

    // Atualizar live_locations (UPSERT)
    const isMoving = speed !== null && speed > 0.5; // >0.5 m/s = movendo
    const { error } = await supabase.from("live_locations").upsert({
      user_id: this.userId,
      latitude,
      longitude,
      accuracy,
      heading,
      speed,
      battery_level: batteryLevel,
      is_moving: isMoving,
      last_movement_at: isMoving ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("❌ Erro ao atualizar localização:", error);
      return;
    }

    console.log("📍 Localização atualizada:", { latitude, longitude, accuracy });

    // Inserir em location_history (a cada 1 minuto OU movimento >100m)
    const shouldSaveHistory = this.shouldSaveToHistory(latitude, longitude);
    if (shouldSaveHistory) {
      await supabase.from("location_history").insert({
        user_id: this.userId,
        latitude,
        longitude,
        accuracy,
        heading,
        speed,
      });
      this.lastHistoryInsert = Date.now();
      console.log("📝 Histórico salvo");
    }

    // Atualizar última posição
    this.lastPosition = { latitude, longitude, accuracy, heading, speed };
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
        console.error("❌ Permissão de localização negada pelo usuário");
        break;
      case error.POSITION_UNAVAILABLE:
        console.error("❌ Localização não disponível");
        break;
      case error.TIMEOUT:
        console.error("⏱️ Timeout ao obter localização");
        break;
      default:
        console.error("❌ Erro desconhecido:", error.message);
    }
  }
}

export const locationTracker = new LocationTrackingService();
