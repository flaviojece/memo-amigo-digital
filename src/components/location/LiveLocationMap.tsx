import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import Map, { Marker, Source, Layer, NavigationControl } from "react-map-gl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Crosshair, ZoomIn, ZoomOut, Navigation as NavigationIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import "mapbox-gl/dist/mapbox-gl.css";

interface LiveLocationMapProps {
  patientId: string;
  onClose: () => void;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export function LiveLocationMap({ patientId, onClose }: LiveLocationMapProps) {
  const mapRef = useRef<any>(null);
  const [viewport, setViewport] = useState({
    latitude: -23.5505,
    longitude: -46.6333,
    zoom: 15,
  });
  const [location, setLocation] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

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
      console.error("Erro ao carregar histórico:", error);
      return;
    }

    setHistory(data || []);
  };

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
        setViewport((prev) => ({
          ...prev,
          latitude: data.latitude as number,
          longitude: data.longitude as number,
        }));
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
          console.log("📍 Nova localização recebida:", payload.new);
          const newLocation = payload.new as any;
          setLocation(newLocation);

          // Centralizar mapa na nova posição
          setViewport((prev) => ({
            ...prev,
            latitude: newLocation.latitude as number,
            longitude: newLocation.longitude as number,
          }));

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
    if (location) {
      setViewport((prev) => ({
        ...prev,
        latitude: location.latitude,
        longitude: location.longitude,
        zoom: 16,
      }));

      // Animar mapa
      mapRef.current?.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 16,
        duration: 1000,
      });
    }
  };

  const handleZoomIn = () => {
    setViewport((prev) => ({ ...prev, zoom: Math.min(prev.zoom + 1, 20) }));
  };

  const handleZoomOut = () => {
    setViewport((prev) => ({ ...prev, zoom: Math.max(prev.zoom - 1, 1) }));
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-destructive font-bold mb-2">
              ⚠️ Token do Mapbox não configurado
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Para usar o rastreamento ao vivo, você precisa:
              <br />
              1. Criar uma conta em mapbox.com
              <br />
              2. Obter um token de acesso
              <br />
              3. Adicionar como secret: VITE_MAPBOX_ACCESS_TOKEN
            </p>
            <Button onClick={onClose} className="mt-4">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full">
      {/* Mapa */}
      <Map
        ref={mapRef}
        {...viewport}
        onMove={(evt) => setViewport(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" />

        {/* Marcador da posição atual */}
        {location && (
          <Marker
            latitude={location.latitude}
            longitude={location.longitude}
            anchor="bottom"
          >
            <div className="relative">
              {/* Pulso animado */}
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-75" />
              
              {/* Ícone principal */}
              <div className="relative bg-blue-600 rounded-full p-2 shadow-lg border-2 border-white">
                <NavigationIcon className="w-8 h-8 text-white" fill="white" />
              </div>
            </div>
          </Marker>
        )}

        {/* Trajeto recente (polyline) */}
        {history.length > 1 && (
          <Source
            type="geojson"
            data={{
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: history.map((h) => [h.longitude, h.latitude]),
              },
            }}
          >
            <Layer
              id="route"
              type="line"
              paint={{
                "line-color": "#3b82f6",
                "line-width": 4,
                "line-opacity": 0.7,
              }}
            />
          </Source>
        )}
      </Map>

      {/* Botão Voltar */}
      <Button
        onClick={onClose}
        variant="outline"
        size="lg"
        className="absolute top-4 left-4 shadow-lg bg-white"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Voltar
      </Button>

      {/* Card de informações do paciente */}
      <Card className="absolute top-4 left-1/2 -translate-x-1/2 shadow-2xl max-w-sm w-full mx-4">
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
      <div className="absolute bottom-8 right-4 flex flex-col gap-2">
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
        <Badge className="absolute bottom-8 left-4 shadow-lg bg-white text-foreground">
          📍 {history.length} pontos nas últimas 2h
        </Badge>
      )}
    </div>
  );
}
