"use client";

import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { Header } from "@/components/layout/Header";

// -----------------------------------------------------------------------
// Tipos — deben coincidir con la forma real de la respuesta del API
// -----------------------------------------------------------------------

interface KpiCard {
  label: string;
  value: number;
  statusColor: string; // clase Tailwind del punto indicador, ej. "bg-emerald-500"
  statusLabel: string;
}

interface Alerta {
  titulo: string;
  detalle: string;
  accion: string;
}

type Estatus = "completo" | "parcial" | "sin-sistema";

interface FilaResumen {
  tipo: string;
  sipirf: boolean;
  scaydfo: boolean;
  padronSepomex: boolean;
  estatus: Estatus;
}

interface UsuarioActual {
  nombre: string;
  apellido: string;
}

interface DashboardData {
  kpis: KpiCard[];
  alertas: Alerta[];
  resumen: FilaResumen[];
}

const estatusConfig: Record<Estatus, { color: string; label: string }> = {
  completo: { color: "bg-emerald-500", label: "Completo" },
  parcial: { color: "bg-amber-500", label: "Parcial" },
  "sin-sistema": { color: "bg-gray-400", label: "Sin sistema" },
};

// -----------------------------------------------------------------------
// Llamadas al API — AJUSTA estas rutas/URLs a tu backend real
// -----------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function fetchDashboardData(): Promise<DashboardData> {
  const res = await fetch(`${API_BASE}/api/panel-inicio`, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo obtener la información del panel");
  return res.json();
}

async function fetchUsuarioActual(): Promise<UsuarioActual> {
  const res = await fetch(`${API_BASE}/api/auth/me`, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo obtener el usuario actual");
  return res.json();
}

function getIniciales(usuario: UsuarioActual | null): string {
  if (!usuario) return "";
  const inicialNombre = usuario.nombre?.trim().charAt(0) ?? "";
  const inicialApellido = usuario.apellido?.trim().charAt(0) ?? "";
  return `${inicialNombre}${inicialApellido}`.toUpperCase();
}

// -----------------------------------------------------------------------
// Componente principal
// -----------------------------------------------------------------------

export default function PanelInicio() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [usuario, setUsuario] = useState<UsuarioActual | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    Promise.all([fetchDashboardData(), fetchUsuarioActual()])
      .then(([dashboard, user]) => {
        if (!activo) return;
        setData(dashboard);
        setUsuario(user);
      })
      .catch((err: Error) => {
        if (!activo) return;
        setError(err.message ?? "Ocurrió un error al cargar el panel");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F3F3F3" }}>
      <Header title="Panel de inicio" iniciales={getIniciales(usuario)} />

      <main className="mx-auto max-w-7xl px-6 py-8 sm:px-10 sm:py-10">
        {error && (
          <p className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <KpiGrid kpis={data?.kpis ?? []} cargando={cargando} />

        <SectionTitle>Localización de inmuebles</SectionTitle>
        <MapaCard />

        <AlertasStrip alertas={data?.alertas ?? []} cargando={cargando} />

        <SectionTitle>Resumen por tipo de ocupación</SectionTitle>
        <ResumenTable resumen={data?.resumen ?? []} cargando={cargando} />
      </main>
    </div>
  );
}


// -----------------------------------------------------------------------
// Sección title
// -----------------------------------------------------------------------

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 mt-8 inline-block border-b-4 border-gray-900 pb-1 text-xl font-extrabold text-gray-900 sm:text-2xl">
      {children}
    </h2>
  );
}

// -----------------------------------------------------------------------
// KPI cards
// -----------------------------------------------------------------------

function KpiGrid({ kpis, cargando }: { kpis: KpiCard[]; cargando: boolean }) {
  if (cargando) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl px-6 py-7 shadow-sm"
            style={{ backgroundColor: "#7A1F3D" }}
          >
            <div className="h-4 w-24 rounded bg-white/20" />
            <div className="mt-2 h-8 w-12 rounded bg-white/20" />
            <div className="mt-3 h-3 w-28 rounded bg-white/20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {kpis.map((kpi, i) => (
        <div
          key={i}
          className="rounded-xl px-6 py-7 text-white shadow-sm"
          style={{ backgroundColor: "#7A1F3D" }}
        >
          <p className="text-sm text-white/85">{kpi.label}</p>
          <p className="mt-1 text-3xl font-bold">{kpi.value}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${kpi.statusColor}`} />
            <span className="text-sm text-white/80">{kpi.statusLabel}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------
// Mapa
// -----------------------------------------------------------------------

function AlaDecorativa({ side }: { side: "left" | "right" }) {
  const isRight = side === "right";
  const angulos = [-80, -57, -34, -11, 12, 35, 58, 81];

  return (
    <svg
      className={`pointer-events-none absolute inset-y-0 h-full w-32 sm:w-48 ${
        isRight ? "right-0 scale-x-[-1]" : "left-0"
      }`}
      viewBox="0 0 180 400"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {angulos.map((angle, i) => (
        <path
          key={i}
          d="M0,0 C55,-14 120,-14 175,0 C120,14 55,14 0,0 Z"
          transform={`translate(0 200) rotate(${angle})`}
          fill="white"
          fillOpacity={i % 2 === 0 ? 0.09 : 0.05}
        />
      ))}
    </svg>
  );
}

function MapaCard() {
  return (
    <div
      className="relative overflow-hidden rounded-xl p-6"
      style={{ backgroundColor: "#611830" }}
    >
      <AlaDecorativa side="left" />
      <AlaDecorativa side="right" />

      {/* Contenedor del mapa real — sustituir por <Map /> (Mapbox/Google Maps) */}
      <div className="relative z-10 flex h-80 items-center justify-center overflow-hidden rounded-lg border-2 border-white/30 bg-neutral-700 sm:h-[26rem]">
        <span className="text-lg font-medium text-white/90">
          Mapa interactivo
        </span>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Alertas y pendientes
// -----------------------------------------------------------------------

function AlertasStrip({
  alertas,
  cargando,
}: {
  alertas: Alerta[];
  cargando: boolean;
}) {
  return (
    <div
      className="mt-8 flex flex-col overflow-hidden rounded-xl sm:flex-row"
      style={{ backgroundColor: "#7A1F3D" }}
    >
      <div className="flex items-center justify-center gap-2 px-6 py-7 text-center sm:w-44 sm:flex-col sm:justify-center sm:border-r sm:border-white/15">
        <Bell className="h-6 w-6 text-white" strokeWidth={2.5} />
        <span className="text-base font-bold text-white">
          Alertas y pendientes
        </span>
      </div>

      <div className="grid flex-1 grid-cols-1 divide-y divide-white/15 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {cargando
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-2 px-6 py-7">
                <div className="h-4 w-40 rounded bg-white/20" />
                <div className="h-3 w-28 rounded bg-white/20" />
                <div className="h-3 w-32 rounded bg-white/20" />
              </div>
            ))
          : alertas.map((a, i) => (
              <div key={i} className="px-6 py-7">
                <p className="text-base font-semibold text-white">{a.titulo}</p>
                <p className="mt-1.5 text-sm text-white/75">{a.detalle}</p>
                <p className="text-sm text-white/75">· {a.accion}</p>
              </div>
            ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Tabla resumen
// -----------------------------------------------------------------------

function ResumenTable({
  resumen,
  cargando,
}: {
  resumen: FilaResumen[];
  cargando: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl" style={{ backgroundColor: "#7A1F3D" }}>
      <table className="w-full text-left text-sm text-white">
        <thead style={{ backgroundColor: "#611830" }}>
          <tr className="border-b border-white/15 text-white">
            <th className="px-5 py-4 font-semibold">Tipo</th>
            <th className="px-5 py-4 font-semibold">SIPIFP</th>
            <th className="px-5 py-4 font-semibold">SCAyDFO</th>
            <th className="px-5 py-4 font-semibold">Padron SEPOMEX</th>
            <th className="px-5 py-4 font-semibold">Estatus</th>
          </tr>
        </thead>
        <tbody>
          {cargando
            ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse border-b border-white/10 last:border-none">
                  <td className="px-5 py-4" colSpan={5}>
                    <div className="h-4 w-full max-w-xs rounded bg-white/20" />
                  </td>
                </tr>
              ))
            : resumen.map((fila, i) => {
                const cfg = estatusConfig[fila.estatus];
                return (
                  <tr key={i} className="border-b border-white/10 last:border-none">
                    <td className="px-5 py-4">{fila.tipo}</td>
                    <td className="px-5 py-4">{fila.sipirf && <Check className="h-4 w-4" />}</td>
                    <td className="px-5 py-4">{fila.scaydfo && <Check className="h-4 w-4" />}</td>
                    <td className="px-5 py-4">{fila.padronSepomex && <Check className="h-4 w-4" />}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${cfg.color}`} />
                        <span className="text-xs">{cfg.label}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}
