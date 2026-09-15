import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LocationFreshness } from "./LocationFreshness";
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
  isVisible?: boolean;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export function LiveLocationMap({ patientId, onClose, variant = 'fullscreen', isVisible = true }: LiveLocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [sharingStatus, setSharingStatus] = useState<{
    trackingActive: boolean;
    stoppedReason: string | null;
  }>({ trackingActive: false, stoppedReason: null });
  const [location, setLocation] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapState, setMapState] = useState<{ center: [number, number]; zoom: number }>({
    center: [-46.6333, -23.5505],
    zoom: 15
  });

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
    if (!mapContainer.current) return;
    
    // Só inicializar se for visível (importante para tabs)
    if (!isVisible && variant === 'inline') {
      logger.log('[LiveLocationMap] Aba não visível, aguardando...');
      return;
    }
    
    // Prevenir múltiplas instâncias
    if (map.current) {
      logger.warn('[LiveLocationMap] Mapa já existe, pulando inicialização');
      return;
    }

    if (!MAPBOX_TOKEN) {
      logger.error("VITE_MAPBOX_ACCESS_TOKEN não configurado");
      return;
    }

    try {
      logger.log('[LiveLocationMap] Inicializando mapa Mapbox...');
      
      mapboxgl.accessToken = MAPBOX_TOKEN;

      // Se já temos localização, centralizar nela; senão usar estado salvo
      const initialCenter = location 
        ? [location.longitude, location.latitude] as [number, number]
        : mapState.center;
      
      const initialZoom = location ? 16 : mapState.zoom;
      
      logger.log(`[LiveLocationMap] Centro inicial do mapa: [${initialCenter[0]}, ${initialCenter[1]}], zoom: ${initialZoom}`);

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: initialCenter,
        zoom: initialZoom,
        preserveDrawingBuffer: true, // Ajuda a prevenir perda de contexto WebGL
      });

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Handler para contexto WebGL perdido
      map.current.on('webglcontextlost', (event: any) => {
        event.preventDefault();
        logger.warn('[LiveLocationMap] WebGL context perdido, tentando recuperar...');
        setMapError('Recarregando mapa...');
        setMapReady(false);
      });

      // Handler para contexto WebGL restaurado
      map.current.on('webglcontextrestored', () => {
        logger.log('[LiveLocationMap] WebGL context restaurado com sucesso');
        setMapError(null);
        setMapReady(true);
      });

      // Aguardar o estilo carregar completamente
      map.current.on('load', () => {
        logger.log("✅ Mapa Mapbox carregado com sucesso");
        setMapReady(true);
        
        // Etapa 3: Resize imediato após load
        setTimeout(() => {
          if (map.current) {
            map.current.resize();
            logger.log('[LiveLocationMap] Resize executado após load');
          }
        }, 100);
      });

      map.current.on('error', (event) => {
        logger.error("❌ Erro no Mapbox:", event.error || event);
        const errorMsg = event.error?.message || "Erro desconhecido ao carregar o mapa";
        setMapError(errorMsg);
      });
    } catch (error) {
      logger.error('[LiveLocationMap] Erro ao inicializar mapa:', error);
      setMapError('Erro ao inicializar o mapa');
    }

    return () => {
      if (map.current) {
        try {
          // Salvar estado do mapa antes de destruir
          const center = map.current.getCenter();
          const zoom = map.current.getZoom();
          setMapState({ 
            center: [center.lng, center.lat], 
            zoom 
          });

          // Remover marker primeiro
          if (markerRef.current) {
            markerRef.current.remove();
            markerRef.current = null;
          }

          // Remover event listeners (mapbox não usa .off, apenas remove o mapa)
          // Os listeners são automaticamente removidos quando o mapa é destruído

          // Destruir mapa
          logger.log('[LiveLocationMap] Destruindo mapa...');
          map.current.remove();
          map.current = null;
          setMapReady(false);
        } catch (error) {
          logger.error('[LiveLocationMap] Erro ao destruir mapa:', error);
        }
      }
    };
  }, [isVisible, variant]);

  // Forçar resize quando a aba se torna visível (Etapa 2: múltiplas tentativas)
  useEffect(() => {
    if (map.current && isVisible && mapReady) {
      // Primeiro resize
      setTimeout(() => {
        if (map.current) {
          map.current.resize();
          logger.log('[LiveLocationMap] Mapa redimensionado após visibilidade (tentativa 1)');
        }
      }, 150);
      
      // Segundo resize de segurança
      setTimeout(() => {
        if (map.current) {
          map.current.resize();
          logger.log('[LiveLocationMap] Mapa redimensionado após visibilidade (tentativa 2)');
        }
      }, 500);
    }
  }, [isVisible, mapReady]);

  // Atualizar marker e linha de histórico
  useEffect(() => {
    logger.log(`[LiveLocationMap] Estado do marcador: mapReady=${mapReady}, hasLocation=${!!location}, hasMap=${!!map.current}`);
    if (!map.current || !location || !mapReady) {
      logger.log('[LiveLocationMap] Aguardando mapa e localização ficarem prontos...');
      return;
    }
    
    logger.log(`[LiveLocationMap] ✅ Criando marcador em: [${location.longitude}, ${location.latitude}]`);

    // Atualizar ou criar marker com estilo padrão do Mapbox
    if (markerRef.current) {
      markerRef.current.setLngLat([location.longitude, location.latitude]);
      logger.log(`[LiveLocationMap] Marcador atualizado para novas coordenadas`);
    } else {
      // Usar marcador padrão do Mapbox (mais confiável)
      markerRef.current = new mapboxgl.Marker({ 
        color: '#3b82f6',
        scale: 1.5
      })
        .setLngLat([location.longitude, location.latitude])
        .addTo(map.current);
      
      logger.log(`[LiveLocationMap] ✅ Marcador criado e adicionado ao mapa`);
      logger.log(`[LiveLocationMap] Elemento do marcador:`, markerRef.current.getElement());
    }

    // Aguardar render do marcador antes de flyTo
    setTimeout(() => {
      if (map.current && location) {
        logger.log(`[LiveLocationMap] Centralizando mapa no marcador`);
        map.current.flyTo({
          center: [location.longitude, location.latitude],
          zoom: 16,
          essential: true
        });
      }
    }, 150);

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

  // Assinatura das atualizações de posição
  useEffect(() => {
    // Buscar localização inicial
    const fetchInitialLocation = async () => {
      // Quem é observado tem direito de saber quando foi observado
      void supabase.rpc("registrar_visualizacao_localizacao", {
        _patient_id: patientId,
      });

      const [{ data }, { data: settings }] = await Promise.all([
        supabase.from("live_locations").select("*").eq("user_id", patientId).maybeSingle(),
        supabase
          .from("location_sharing_settings")
          .select("tracking_active, tracking_stopped_reason")
          .eq("user_id", patientId)
          .maybeSingle(),
      ]);

      if (data) setLocation(data);
      setSharingStatus({
        trackingActive: settings?.tracking_active ?? false,
        stoppedReason: settings?.tracking_stopped_reason ?? null,
      });
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
                Para visualizar a localização no mapa, você precisa configurar um token do Mapbox.
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
    <div className={variant === 'inline' ? "relative h-[min(500px,70dvh)] min-h-[380px] w-full" : "relative h-dvh w-full"}>
      {/* Container do Mapa - Etapa 1: altura mínima garantida */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0" 
      />

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
           className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] shadow-lg bg-card"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar
        </Button>
      )}

      {/* Card de informações do paciente */}
      {!location && mapReady && (
        <Card className={variant === 'inline' 
          ? "absolute top-4 left-4 right-20 shadow-lg" 
          : "absolute top-[max(1rem,env(safe-area-inset-top))] left-4 right-4 shadow-2xl max-w-sm mx-auto"
        }>
          <CardContent className="p-6 text-center">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="font-semibold text-lg mb-2">Sem localização recente</p>
            <p className="text-sm text-muted-foreground">
              Nenhuma localização disponível para este paciente no momento.
            </p>
          </CardContent>
        </Card>
      )}

      {location && (
        <Card className={variant === 'inline' 
          ? "absolute top-4 left-4 right-20 shadow-lg" 
          : "absolute top-[max(1rem,env(safe-area-inset-top))] left-4 right-4 shadow-2xl max-w-sm mx-auto"
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
                <LocationFreshness
                  updatedAt={location.updated_at}
                  trackingActive={sharingStatus.trackingActive}
                  stoppedReason={sharingStatus.stoppedReason}
                  source={(location as { source?: string }).source}
                  compacto
                />
              </div>
            </div>

            <div className="mt-3">
              <LocationFreshness
                updatedAt={location.updated_at}
                trackingActive={sharingStatus.trackingActive}
                stoppedReason={sharingStatus.stoppedReason}
                source={(location as { source?: string }).source}
              />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {location.accuracy && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Crosshair className="w-4 h-4" />
                  ±{Math.round(location.accuracy)}m
                </div>
              )}
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
          </CardContent>
        </Card>
      )}

      {/* Controles de zoom e centralização */}
      <div className={variant === 'inline' 
        ? "absolute bottom-4 right-4 flex flex-col gap-2" 
        : "absolute bottom-[max(2rem,env(safe-area-inset-bottom))] right-4 flex flex-col gap-2"
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
