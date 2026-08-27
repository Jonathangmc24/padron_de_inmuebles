"use client";

import { useEffect, useRef } from "react";

export interface PuntoMapa {
  noControlGbi: string;
  nombre: string;
  latitud: number;
  longitud: number;
  estatus: string;
}

interface MapaInmueblesProps {
  puntos: PuntoMapa[];
}

const COLOR_ESTATUS: Record<string, string> = {
  vigente: "#099667",
  en_proceso: "#F59E0B",
  baja: "#9CA3AF",
  reclasificacion: "#A855F7",
};

/**
 * Mapa con Leaflet + tiles de OpenStreetMap (open source, sin licenciamiento).
 * Se carga dinámicamente en el cliente porque Leaflet depende de `window`.
 */
export function MapaInmuebles({ puntos }: MapaInmueblesProps) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    let cancelado = false;
    let observer: ResizeObserver | null = null;

    async function iniciarMapa() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (cancelado || !contenedorRef.current || mapaRef.current) return;

      // Ícono por defecto de Leaflet (si no se configura, no se ve en Next.js)
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const puntosValidos = puntos.filter(
        (p) => Number.isFinite(p.latitud) && Number.isFinite(p.longitud)
      );

      const centro: [number, number] =
        puntosValidos.length > 0
          ? [puntosValidos[0].latitud, puntosValidos[0].longitud]
          : [23.6345, -102.5528]; // centro aproximado de México

      const mapa = L.map(contenedorRef.current, {
        center: centro,
        zoom: puntosValidos.length > 0 ? 12 : 4,
      });
      mapaRef.current = mapa;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapa);

      const grupo = L.featureGroup();

      puntosValidos.forEach((p) => {
        const color = COLOR_ESTATUS[p.estatus] ?? "#611830";
        const marcador = L.circleMarker([p.latitud, p.longitud], {
          radius: 8,
          fillColor: color,
          color: "#ffffff",
          weight: 2,
          fillOpacity: 0.9,
        }).bindPopup(
          `<strong>${p.nombre}</strong><br/>${p.noControlGbi}<br/>Estatus: ${p.estatus}`
        );

        // Quita el comportamiento por defecto de Leaflet (abrir el popup al
        // instante) para reemplazarlo por: primero zoom animado, y hasta que
        // termine, se abre la información.
        marcador.off("click");
        marcador.on("click", () => {
          mapa.once("moveend", () => {
            marcador.openPopup();
          });
          mapa.flyTo([p.latitud, p.longitud], Math.max(mapa.getZoom(), 15), {
            duration: 0.7,
          });
        });

        marcador.addTo(grupo);
      });

      grupo.addTo(mapa);

      // Espera a que el contenedor tenga un tamaño real (distinto de 0x0) antes
      // de invalidar el tamaño de Leaflet y ajustar el zoom — en React el
      // primer render puede ocurrir antes de que el layout esté listo.
      let yaAjustado = false;
      observer = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;
        if (yaAjustado || width === 0 || height === 0) return;
        yaAjustado = true;

        mapa.invalidateSize();

        if (puntosValidos.length > 1) {
          mapa.fitBounds(grupo.getBounds().pad(0.3), { maxZoom: 14 });
        } else if (puntosValidos.length === 1) {
          mapa.setView(centro, 14);
        }
      });
      observer.observe(contenedorRef.current);
    }

    iniciarMapa();

    return () => {
      cancelado = true;
      observer?.disconnect();
      mapaRef.current?.remove();
      mapaRef.current = null;
    };
  }, [puntos]);

  return (
    <div
      ref={contenedorRef}
      className="h-80 w-full rounded-lg border-2 border-white/30 sm:h-[26rem]"
      style={{ zIndex: 0, minHeight: "320px" }}
    />
  );
}
