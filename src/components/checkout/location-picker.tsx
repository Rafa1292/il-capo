"use client";

import { useEffect, useRef, useState } from "react";
import { Crosshair, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
// El CSS va estático: sin él Leaflet dibuja los tiles apilados en una columna.
import "leaflet/dist/leaflet.css";

export interface PickedLocation {
  latitude: number;
  longitude: number;
}

interface Props {
  value: PickedLocation | null;
  onChange: (location: PickedLocation) => void;
  /** Centro inicial cuando todavía no hay pin (el local). */
  fallbackCenter: PickedLocation;
}

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const DEFAULT_ZOOM = 16;

/**
 * Mapa para marcar a dónde va el pedido.
 *
 * Hace falta un punto y no basta con las señas escritas: en Costa Rica una
 * dirección es "200 m sur de la iglesia", que ningún geocodificador convierte
 * en coordenadas. Sin punto no hay distancia, y sin distancia no hay precio de
 * envío que cobrar antes de pasar la tarjeta.
 *
 * Leaflet se carga solo en el navegador (`import()` dentro del efecto): su
 * módulo toca `window` al evaluarse y revienta el render del servidor.
 */
export function LocationPicker({ value, onChange, fallbackCenter }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const start = value ?? fallbackCenter;
      const map = L.map(containerRef.current, { attributionControl: true }).setView(
        [start.latitude, start.longitude],
        DEFAULT_ZOOM
      );
      L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map);

      // Ícono propio: los PNG por defecto de Leaflet se resuelven contra rutas
      // relativas al CSS y en un bundle de Next salen 404.
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:22px;height:22px;border-radius:9999px;background:#dc2626;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([start.latitude, start.longitude], {
        draggable: true,
        icon,
      }).addTo(map);

      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        onChangeRef.current({ latitude: lat, longitude: lng });
      });

      map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        onChangeRef.current({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      });

      mapRef.current = map;
      markerRef.current = marker;

      // Si el contenedor se montó oculto (acordeón, tab), Leaflet calcula mal
      // el tamaño y el mapa sale en gris.
      setTimeout(() => map.invalidateSize(), 0);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Solo al montar: mover el mapa cuando cambia `value` pelearía con el arrastre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Este navegador no puede darnos tu ubicación. Movés el pin a mano.");
      return;
    }
    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        markerRef.current?.setLatLng([location.latitude, location.longitude]);
        mapRef.current?.setView([location.latitude, location.longitude], DEFAULT_ZOOM);
        onChangeRef.current(location);
        setIsLocating(false);
      },
      () => {
        setError("No pudimos ubicarte. Movés el pin a mano sobre el mapa.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="h-56 w-full overflow-hidden rounded-xl border"
        style={{ zIndex: 0 }}
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {value ? (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-primary" />
              Tocá el mapa o arrastrá el punto para ajustarlo
            </span>
          ) : (
            "Tocá el mapa para marcar dónde entregamos"
          )}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={useMyLocation} disabled={isLocating}>
          <Crosshair className="mr-1.5 h-3.5 w-3.5" />
          {isLocating ? "Ubicando..." : "Usar mi ubicación"}
        </Button>
      </div>
      {error && <p className="text-xs text-muted-foreground">{error}</p>}
    </div>
  );
}
