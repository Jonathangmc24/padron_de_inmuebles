"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Plus } from "lucide-react";
import { Header } from "@/components/layout/Header";

// -----------------------------------------------------------------------
// Tipos — deben coincidir con la forma real de la respuesta del API
// -----------------------------------------------------------------------

interface KpisProteccionCivil {
  cedulasRiesgo: number;
  cedulasRiesgoDetalle: string;
  riesgoAlto: number;
  riesgoAltoDetalle: string;
  conAccesibilidad: number;
  conAccesibilidadDetalle: string;
  extintoresVigentes: number;
  extintoresVigentesDetalle: string;
}

type EstadoSeguridad = "apta" | "revision";
type EstadoExtintores = "vigente" | "por_vencer";
type EstadoMatPeligrosos = "no_aplica" | "aplica" | "pendiente";

interface FilaCumplimiento {
  inmueble: string;
  seguridadEstructural: EstadoSeguridad;
  extintoresHidrantes: EstadoExtintores;
  matPeligrosos: EstadoMatPeligrosos;
}

interface ProteccionCivilData {
  kpis: KpisProteccionCivil;
  cumplimiento: FilaCumplimiento[];
}

interface UsuarioActual {
  nombre: string;
  apellido: string;
}

const estadoSeguridadConfig: Record<EstadoSeguridad, { dot: string; text: string; label: string }> = {
  apta: { dot: "bg-emerald-500", text: "text-emerald-600", label: "Apta" },
  revision: { dot: "bg-amber-500", text: "text-amber-600", label: "Revisión" },
};

const estadoExtintoresConfig: Record<EstadoExtintores, { dot: string; text: string; label: string }> = {
  vigente: { dot: "bg-emerald-500", text: "text-emerald-600", label: "Vigente" },
  por_vencer: { dot: "bg-amber-500", text: "text-amber-600", label: "Por vencer" },
};

const estadoMatPeligrososConfig: Record<
  EstadoMatPeligrosos,
  { dot: string; text: string; label: string }
> = {
  no_aplica: { dot: "bg-gray-400", text: "text-gray-500", label: "No aplica" },
  aplica: { dot: "bg-emerald-500", text: "text-emerald-600", label: "Aplica" },
  pendiente: { dot: "bg-amber-500", text: "text-amber-600", label: "Pendiente" },
};

// -----------------------------------------------------------------------
// Llamadas al API — AJUSTA estas rutas/URLs a tu backend real
// -----------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function fetchProteccionCivil(): Promise<ProteccionCivilData> {
  const res = await fetch(`${API_BASE}/api/proteccion-civil`, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo obtener la información de protección civil");
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

export default function ProteccionCivilRiesgos() {
  const [usuario, setUsuario] = useState<UsuarioActual | null>(null);
  const [data, setData] = useState<ProteccionCivilData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsuarioActual()
      .then(setUsuario)
      .catch(() => setUsuario(null));
  }, []);

  useEffect(() => {
    let activo = true;
    setCargando(true);

    fetchProteccionCivil()
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
      <Header title="Protección civil y riesgos" iniciales={getIniciales(usuario)} />

      <main className="mx-auto max-w-7xl px-6 py-8 sm:px-10 sm:py-10">
        {error && (
          <p className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <a
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold"
          style={{ color: "#7B2645" }}
        >
          <ChevronLeft className="h-4 w-4" />
          Volver al panel de inicio
        </a>

        <EncabezadoPagina />

        <KpiGrid kpis={data?.kpis} cargando={cargando} />

        <TablaCumplimiento items={data?.cumplimiento ?? []} cargando={cargando} />
      </main>
    </div>
  );
}

// -----------------------------------------------------------------------
// Encabezado (título + botón)
// -----------------------------------------------------------------------

function EncabezadoPagina() {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-extrabold text-gray-900">Protección civil y riesgos</h2>
        <p className="mt-1 text-sm text-gray-500">
          Cédulas de riesgo, seguridad estructural y accesibilidad
        </p>
      </div>

      <button
        type="button"
        className="flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold text-white"
        style={{ backgroundColor: "#611830" }}
        onClick={() => {
          // TODO: conectar al flujo real de alta de cédula de riesgo
          window.location.href = "/proteccion-civil/nueva-cedula";
        }}
      >
        <Plus className="h-4 w-4" />
        Nueva cédula de riesgo
      </button>
    </div>
  );
}

// -----------------------------------------------------------------------
// KPIs
// -----------------------------------------------------------------------

function KpiGrid({ kpis, cargando }: { kpis: KpisProteccionCivil | undefined; cargando: boolean }) {
  if (cargando || !kpis) {
    return (
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
            <div className="h-3 w-20 rounded bg-gray-200" />
            <div className="mt-3 h-7 w-14 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-24 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  const tarjetas = [
    {
      label: "CÉDULAS DE RIESGO",
      valor: String(kpis.cedulasRiesgo),
      detalle: kpis.cedulasRiesgoDetalle,
      color: "#0D7716",
    },
    {
      label: "RIESGO ALTO",
      valor: String(kpis.riesgoAlto),
      detalle: kpis.riesgoAltoDetalle,
      color: "#C57300",
    },
    {
      label: "CON ACCESIBILIDAD",
      valor: String(kpis.conAccesibilidad),
      detalle: kpis.conAccesibilidadDetalle,
      color: "#6B1535",
    },
    {
      label: "EXTINTORES VIGENTES",
      valor: String(kpis.extintoresVigentes),
      detalle: kpis.extintoresVigentesDetalle,
      color: "#0D7716",
    },
  ];

  return (
    <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
      {tarjetas.map((t, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {t.label}
          </p>
          <p className="mt-1 text-2xl font-extrabold sm:text-3xl" style={{ color: t.color }}>
            {t.valor}
          </p>
          <p className="mt-1 text-xs text-gray-500">{t.detalle}</p>
        </div>
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------
// Tabla de cumplimiento por inmueble
// -----------------------------------------------------------------------

function EstadoBadge({
  dot,
  text,
  label,
}: {
  dot: string;
  text: string;
  label: string;
}) {
  return (
    <span className={`flex items-center gap-1.5 text-xs font-semibold ${text}`}>
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function TablaCumplimiento({ items, cargando }: { items: FilaCumplimiento[]; cargando: boolean }) {
  const columnas = ["Inmueble", "Seguridad estructural", "Extintores / hidrantes", "Mat. peligrosos"];

  return (
    <div>
      <h3 className="mb-3 text-base font-bold text-gray-900">
        Cumplimiento por inmueble (Muestra)
      </h3>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead style={{ backgroundColor: "#611830" }}>
            <tr>
              {columnas.map((col) => (
                <th
                  key={col}
                  className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-white"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-gray-100 last:border-none">
                    <td className="px-5 py-4" colSpan={columnas.length}>
                      <div className="h-4 w-full max-w-md rounded bg-gray-200" />
                    </td>
                  </tr>
                ))
              : items.map((item, i) => {
                  const seg = estadoSeguridadConfig[item.seguridadEstructural];
                  const ext = estadoExtintoresConfig[item.extintoresHidrantes];
                  const mat = estadoMatPeligrososConfig[item.matPeligrosos];
                  return (
                    <tr key={i} className="border-b border-gray-100 text-gray-700 last:border-none hover:bg-gray-50">
                      <td className="whitespace-nowrap px-5 py-4 font-medium">{item.inmueble}</td>
                      <td className="px-5 py-4">
                        <EstadoBadge dot={seg.dot} text={seg.text} label={seg.label} />
                      </td>
                      <td className="px-5 py-4">
                        <EstadoBadge dot={ext.dot} text={ext.text} label={ext.label} />
                      </td>
                      <td className="px-5 py-4">
                        <EstadoBadge dot={mat.dot} text={mat.text} label={mat.label} />
                      </td>
                    </tr>
                  );
                })}

            {!cargando && items.length === 0 && (
              <tr>
                <td colSpan={columnas.length} className="px-5 py-10 text-center text-gray-400">
                  No hay inmuebles en la muestra.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
