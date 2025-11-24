import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import mapboxgl from "mapbox-gl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Crosshair, ZoomIn, ZoomOut, Navigation as NavigationIcon, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import "mapbox-gl/dist/mapbox-gl.css";
import { logger } from "@/lib/logger";

interface LiveLocationMapProps {
  patientId: string;
  onClose: () => void;
  variant?: 'fullscreen' | 'inline';
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export function LiveLocationMap({ patientId, onClose, variant = 'fullscreen' }: LiveLocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [location, setLocation] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Buscar dados do paciente
  const { data: patient } = useQuery({
    queryKey: ["patient-profile", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", patientId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Buscar histórico inicial
  useEffect(() => {
    loadHistory();
  }, [patientId]);

  const loadHistory = async () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("location_history")
      .select("*")
      .eq("user_id", patientId)
      .gte("recorded_at", twoHoursAgo)
      .order("recorded_at", { ascending: true });

    if (error) {
      logger.error("Erro ao carregar histórico:", error);
      return;
    }

    setHistory(data || []);
  };

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    if (!MAPBOX_TOKEN) {
      logger.error("VITE_MAPBOX_ACCESS_TOKEN não configurado");
      return;
    }

    logger.log("🔑 MAPBOX_TOKEN definido:", !!MAPBOX_TOKEN);
    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-46.6333, -23.5505],
      zoom: 15,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Aguardar o estilo carregar completamente
    map.current.on('load', () => {
      logger.log("✅ Mapa Mapbox carregado com sucesso (mapReady = true)");
      setMapReady(true);
    });

    map.current.on('error', (event) => {
      logger.error("❌ Erro no Mapbox:", event.error || event);
      const errorMsg = event.error?.message || "Erro desconhecido ao carregar o mapa";
      setMapError(errorMsg);
    });

    return () => {
      setMapReady(false);
      map.current?.remove();
    };
  }, []);

  // Atualizar marker e linha de histórico
  useEffect(() => {
    if (!map.current || !location || !mapReady) return;

    // Atualizar ou criar marker
    if (markerRef.current) {
      markerRef.current.setLngLat([location.longitude, location.latitude]);
    } else {
      const el = document.createElement('div');
      el.className = 'relative';
      el.innerHTML = `
        <div class="absolute -top-4 -left-4 w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-75"></div>
        <div class="relative bg-blue-600 rounded-full p-2 shadow-lg border-2 border-white">
          <svg class="w-8 h-8 text-white" fill="white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
      `;
      markerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([location.longitude, location.latitude])
        .addTo(map.current);
    }

    // Centralizar mapa
    map.current.flyTo({
      center: [location.longitude, location.latitude],
      zoom: 15,
    });

    // Adicionar linha de histórico
    if (history.length > 1) {
      try {
        const coordinates = history.map((h) => [h.longitude, h.latitude]);

        if (map.current.getSource("route")) {
          (map.current.getSource("route") as mapboxgl.GeoJSONSource).setData({
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates,
            },
          });
        } else {
          map.current.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates,
              },
            },
          });

          map.current.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#3b82f6",
              "line-width": 4,
              "line-opacity": 0.7,
            },
          });
        }
      } catch (error) {
        logger.error("Erro ao adicionar rota ao mapa:", error);
      }
    }
  }, [location, history, mapReady]);

  // Subscribe em atualizações em tempo real
  useEffect(() => {
    // Buscar localização inicial
    const fetchInitialLocation = async () => {
      const { data } = await supabase
        .from("live_locations")
        .select("*")
        .eq("user_id", patientId)
        .maybeSingle();

      if (data) {
        setLocation(data);
      }
    };

    fetchInitialLocation();

    // Subscribe em mudanças
    const channel = supabase
      .channel(`live-location:${patientId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_locations",
          filter: `user_id=eq.${patientId}`,
        },
        (payload) => {
          logger.log("📍 Nova localização recebida:", payload.new);
          const newLocation = payload.new as any;
          setLocation(newLocation);

          // Adicionar ao histórico local
          setHistory((prev) => [
            ...prev,
            {
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
              recorded_at: newLocation.updated_at,
            },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId]);

  const handleRecenter = () => {
    if (map.current && location) {
      map.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 16,
      });
    }
  };

  const handleZoomIn = () => {
    if (map.current) {
      map.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (map.current) {
      map.current.zoomOut();
    }
  };

  if (!MAPBOX_TOKEN) {
    return (
      <Card className="border-2 border-dashed border-muted-foreground/30">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <MapPin className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-senior-lg font-bold mb-2">Token do Mapbox não configurado</h3>
              <p className="text-muted-foreground text-senior-sm mb-4">
                Para visualizar a localização em tempo real, você precisa configurar um token do Mapbox.
              </p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg text-left space-y-3 max-w-md mx-auto">
              <p className="text-senior-sm font-semibold">📋 Como obter o token:</p>
              <ol className="text-senior-xs text-muted-foreground space-y-2 ml-4 list-decimal">
                <li>Acesse <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">mapbox.com</a> e crie uma conta gratuita</li>
                <li>Vá em Dashboard → Tokens</li>
                <li>Copie seu token público (começa com <code className="bg-background px-1 rounded">pk.ey...</code>)</li>
                <li>Em "Allowed URLs", adicione:<br/><code className="bg-background px-1 rounded text-xs">https://*.lovableproject.com</code></li>
                <li>Salve as alterações e aguarde alguns minutos</li>
              </ol>
            </div>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              size="lg"
              className="mt-4"
            >
              🔄 Recarregar Página
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={variant === 'inline' ? "relative h-[500px] w-full" : "relative h-screen w-full"}>
      {/* Container do Mapa */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Loading State */}
      {!mapReady && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="max-w-sm">
            <CardContent className="p-6 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-muted-foreground">Carregando mapa do paciente...</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error State */}
      {mapError && (
        <div className="absolute top-20 left-4 right-4 z-10">
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="p-4">
              <p className="font-bold text-destructive mb-2">❌ Erro ao carregar o mapa</p>
              <p className="text-sm text-muted-foreground mb-2">
                Possíveis causas: token inválido, domínio não autorizado, ou problema de conexão.
              </p>
              <p className="text-xs font-mono bg-background/50 p-2 rounded border">
                {mapError}
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                💡 Verifique o console do navegador e configure o token em mapbox.com → Dashboard → Tokens
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Botão Voltar - apenas em fullscreen */}
      {variant === 'fullscreen' && (
        <Button
          onClick={onClose}
          variant="outline"
          size="lg"
          className="absolute top-4 left-4 shadow-lg bg-white"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar
        </Button>
      )}

      {/* Card de informações do paciente */}
      <Card className={variant === 'inline' 
        ? "absolute top-4 left-4 shadow-lg max-w-xs" 
        : "absolute top-4 left-1/2 -translate-x-1/2 shadow-2xl max-w-sm w-full mx-4"
      }>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {patient?.full_name?.[0] || patient?.email?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate">
                {patient?.full_name || patient?.email}
              </h3>
              {location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className="bg-green-50">
                    🟢 Ao vivo
                  </Badge>
                  <span>
                    {formatDistanceToNow(new Date(location.updated_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {location && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {location.speed !== null && location.speed > 0 && (
                <div className="flex items-center gap-1">
                  <NavigationIcon className="w-4 h-4" />
                  {(location.speed * 3.6).toFixed(1)} km/h
                </div>
              )}
              {location.battery_level && (
                <div className="flex items-center gap-1">
                  🔋 {location.battery_level}%
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controles de zoom e centralização */}
      <div className={variant === 'inline' 
        ? "absolute bottom-4 right-4 flex flex-col gap-2" 
        : "absolute bottom-8 right-4 flex flex-col gap-2"
      }>
        <Button
          onClick={handleZoomIn}
          size="icon"
          variant="outline"
          className="bg-white shadow-lg"
        >
          <ZoomIn className="w-5 h-5" />
        </Button>
        <Button
          onClick={handleZoomOut}
          size="icon"
          variant="outline"
          className="bg-white shadow-lg"
        >
          <ZoomOut className="w-5 h-5" />
        </Button>
        <Button
          onClick={handleRecenter}
          size="icon"
          variant="default"
          className="shadow-lg"
          disabled={!location}
        >
          <Crosshair className="w-5 h-5" />
        </Button>
      </div>

      {/* Indicador de histórico */}
      {history.length > 0 && (
        <Badge className={variant === 'inline'
          ? "absolute bottom-4 left-4 shadow-lg bg-white text-foreground"
          : "absolute bottom-8 left-4 shadow-lg bg-white text-foreground"
        }>
          📍 {history.length} pontos nas últimas 2h
        </Badge>
      )}
    </div>
  );
}
