"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Header } from "@/components/layout/Header";

// -----------------------------------------------------------------------
// Tipos — deben coincidir con la forma real de la respuesta del API
// -----------------------------------------------------------------------

interface KpisJuridico {
  regularizadosMonto: string;
  regularizadosDetalle: string;
  enRegulaCantidad: number;
  enRegulaDetalle: string;
  contratosVigentesCantidad: number;
  contratosVigentesDetalle: string;
}

type EstatusContrato = "por_vencer" | "vigente" | "vencido";

interface Contrato {
  titulo: string;
  detalle: string;
  estatus: EstatusContrato;
}

interface SeguimientoItem {
  label: string;
  actual: number;
  total: number;
}

interface JuridicoData {
  kpis: KpisJuridico;
  contratos: Contrato[];
  seguimiento: SeguimientoItem[];
}

interface UsuarioActual {
  nombre: string;
  apellido: string;
}

const estatusContratoConfig: Record<
  EstatusContrato,
  { tipo: "pill" | "dot"; bg?: string; text: string; label: string }
> = {
  por_vencer: { tipo: "pill", bg: "#FFE4BF", text: "#C57300", label: "Por vencer" },
  vigente: { tipo: "pill", bg: "#3FA05B", text: "#FFFFFF", label: "Vigente" },
  vencido: { tipo: "dot", text: "#6B7280", label: "Vencido" },
};

// -----------------------------------------------------------------------
// Llamadas al API — AJUSTA estas rutas/URLs a tu backend real
// -----------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function fetchJuridico(): Promise<JuridicoData> {
  const res = await fetch(`${API_BASE}/api/juridico-regularizacion`, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo obtener la información jurídica");
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

export default function JuridicoRegularizacion() {
  const [usuario, setUsuario] = useState<UsuarioActual | null>(null);
  const [data, setData] = useState<JuridicoData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpiSeleccionado, setKpiSeleccionado] = useState<
    "regularizados" | "en_regula" | "vigentes" | null
  >(null);

  useEffect(() => {
    fetchUsuarioActual()
      .then(setUsuario)
      .catch(() => setUsuario(null));
  }, []);

  useEffect(() => {
    let activo = true;
    setCargando(true);

    fetchJuridico()
      .then((res) => {
        if (!activo) return;
        setData(res);
        setError(null);
      })
      .catch((err: Error) => {
        if (!activo) return;
        setError(err.message ?? "Ocurrió un error al cargar la información");
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
      <Header title="Jurídico y regularización" iniciales={getIniciales(usuario)} />

      <main className="mx-auto max-w-7xl px-6 py-8 sm:px-10 sm:py-10">
        {error && (
          <p className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <EncabezadoPagina />

        <KpiGrid
          kpis={data?.kpis}
          cargando={cargando}
          seleccionado={kpiSeleccionado}
          onSeleccionar={setKpiSeleccionado}
        />

        <TablaContratos contratos={data?.contratos ?? []} cargando={cargando} />

        <SeguimientoRegularizacion items={data?.seguimiento ?? []} cargando={cargando} />
      </main>
    </div>
  );
}

// -----------------------------------------------------------------------
// Encabezado (título + botón de nuevo contrato)
// -----------------------------------------------------------------------

function EncabezadoPagina() {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-extrabold text-gray-900">Jurídico y regularización</h2>
        <p className="mt-1 text-sm text-gray-500">
          Estatus legal, contratos y seguimiento de regularización
        </p>
      </div>

      <button
        type="button"
        className="flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold text-white"
        style={{ backgroundColor: "#611830" }}
        onClick={() => {
          // TODO: conectar al flujo real de alta de contrato
          window.location.href = "/juridico-regularizacion/nuevo-contrato";
        }}
      >
        <Plus className="h-4 w-4" />
        Nuevo contrato
      </button>
    </div>
  );
}

// -----------------------------------------------------------------------
// KPIs (clicables para resaltar, sin filtrado real todavía)
// -----------------------------------------------------------------------

function KpiGrid({
  kpis,
  cargando,
  seleccionado,
  onSeleccionar,
}: {
  kpis: KpisJuridico | undefined;
  cargando: boolean;
  seleccionado: "regularizados" | "en_regula" | "vigentes" | null;
  onSeleccionar: (v: "regularizados" | "en_regula" | "vigentes" | null) => void;
}) {
  if (cargando || !kpis) {
    return (
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
            <div className="h-3 w-24 rounded bg-gray-200" />
            <div className="mt-3 h-8 w-20 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-32 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  const tarjetas = [
    {
      key: "regularizados" as const,
      label: "REGULARIZADOS",
      valor: kpis.regularizadosMonto,
      color: "#0D7716",
      detalle: kpis.regularizadosDetalle,
    },
    {
      key: "en_regula" as const,
      label: "EN REGULA",
      valor: String(kpis.enRegulaCantidad),
      color: "#C57300",
      detalle: kpis.enRegulaDetalle,
    },
    {
      key: "vigentes" as const,
      label: "CONTRATOS VIGENTES",
      valor: String(kpis.contratosVigentesCantidad),
      color: "#6A1434",
      detalle: kpis.contratosVigentesDetalle,
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {tarjetas.map((t) => {
        const activo = seleccionado === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onSeleccionar(activo ? null : t.key)}
            className="rounded-xl border-2 bg-white p-5 text-left transition-colors"
            style={{ borderColor: activo ? "#3B82F6" : "#E5E7EB" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t.label}
            </p>
            <p className="mt-1 text-3xl font-extrabold" style={{ color: t.color }}>
              {t.valor}
            </p>
            <p className="mt-1 text-xs text-gray-500">{t.detalle}</p>
          </button>
        );
      })}
    </div>
  );
}

// -----------------------------------------------------------------------
// Tabla de contratos
// -----------------------------------------------------------------------

function BadgeEstatus({ estatus }: { estatus: EstatusContrato }) {
  const cfg = estatusContratoConfig[estatus];

  if (cfg.tipo === "pill") {
    return (
      <span
        className="rounded-full px-3 py-1 text-xs font-semibold"
        style={{ backgroundColor: cfg.bg, color: cfg.text }}
      >
        {cfg.label}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: cfg.text }}>
      <span className="h-2 w-2 rounded-full bg-gray-400" />
      {cfg.label}
    </span>
  );
}

function TablaContratos({ contratos, cargando }: { contratos: Contrato[]; cargando: boolean }) {
  return (
    <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div
        className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
        style={{ backgroundColor: "#611830" }}
      >
        <span className="text-sm font-medium text-white">
          Contratos de arrendamiento y comodatos
        </span>
        <span className="text-xs font-medium text-white/80 sm:text-sm">Próximos a vencer</span>
      </div>

      <div>
        {cargando
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-4 last:border-none"
              >
                <div className="space-y-2">
                  <div className="h-4 w-56 rounded bg-gray-200" />
                  <div className="h-3 w-40 rounded bg-gray-100" />
                </div>
                <div className="h-6 w-20 rounded-full bg-gray-100" />
              </div>
            ))
          : contratos.map((c, i) => (
              <div
                key={i}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-4 last:border-none"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{c.titulo}</p>
                  <p className="text-xs text-gray-500">{c.detalle}</p>
                </div>
                <BadgeEstatus estatus={c.estatus} />
              </div>
            ))}

        {!cargando && contratos.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-gray-400">
            No hay contratos registrados.
          </p>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Seguimiento de regularización
// -----------------------------------------------------------------------

function SeguimientoRegularizacion({
  items,
  cargando,
}: {
  items: SeguimientoItem[];
  cargando: boolean;
}) {
  return (
    <div>
      <h3 className="mb-4 text-base font-bold text-gray-900">Seguimiento de regularización</h3>

      <div className="space-y-5">
        {cargando
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="mb-2 h-3 w-40 rounded bg-gray-200" />
                <div className="h-2 w-full rounded-full bg-gray-100" />
              </div>
            ))
          : items.map((item, i) => {
              const porcentaje = item.total > 0 ? (item.actual / item.total) * 100 : 0;
              const color = porcentaje >= 80 ? "#0D7716" : "#C6790D";
              return (
                <div key={i}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm text-gray-700">{item.label}</span>
                    <span className="text-xs font-medium text-gray-500">
                      {item.actual} / {item.total}
                    </span>
                  </div>
                  <div
                    className="h-2 w-full overflow-hidden rounded-full"
                    style={{ backgroundColor: "#EEDDE3" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${porcentaje}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
