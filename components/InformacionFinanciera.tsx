"use client";

import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";

// -----------------------------------------------------------------------
// Tipos — deben coincidir con la forma real de la respuesta del API
// -----------------------------------------------------------------------

interface KpisFinanciera {
  valorContableTotal: string;
  valorContableDetalle: string;
  avaluoTotal: string;
  avaluoTotalDetalle: string;
  avaluosPorActualizar: number;
  avaluosPorActualizarDetalle: string;
}

interface FilaValorInmueble {
  noControlGbi: string;
  inmueble: string;
  valorTerreno: string;
  valorConstruccion: string;
}

interface InformacionFinancieraData {
  kpis: KpisFinanciera;
  valoresPorInmueble: FilaValorInmueble[];
}

interface UsuarioActual {
  nombre: string;
  apellido: string;
}

// -----------------------------------------------------------------------
// Llamadas al API — AJUSTA estas rutas/URLs a tu backend real
// -----------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function fetchInformacionFinanciera(): Promise<InformacionFinancieraData> {
  const res = await fetch(`${API_BASE}/api/informacion-financiera`, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo obtener la información financiera");
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

export default function InformacionFinanciera() {
  const [usuario, setUsuario] = useState<UsuarioActual | null>(null);
  const [data, setData] = useState<InformacionFinancieraData | null>(null);
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

    fetchInformacionFinanciera()
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
      <Header title="Información financiera" iniciales={getIniciales(usuario)} />

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

        <TablaValores items={data?.valoresPorInmueble ?? []} cargando={cargando} />
      </main>
    </div>
  );
}

// -----------------------------------------------------------------------
// Encabezado (título + link de conciliación)
// -----------------------------------------------------------------------

function EncabezadoPagina() {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-extrabold text-gray-900">Información financiera</h2>
        <p className="mt-1 text-sm text-gray-500">
          Valores contables, Avalúos y costos de los inmuebles
        </p>
      </div>

      {/* Ajusta el destino cuando exista la vista de conciliación */}
      <a href="/informacion-financiera/conciliacion-dcaf" className="text-sm font-bold" style={{ color: "#7B2645" }}>
        Conciliación DCAF
      </a>
    </div>
  );
}

// -----------------------------------------------------------------------
// KPIs
// -----------------------------------------------------------------------

function KpiGrid({ kpis, cargando }: { kpis: KpisFinanciera | undefined; cargando: boolean }) {
  if (cargando || !kpis) {
    return (
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
            <div className="h-3 w-32 rounded bg-gray-200" />
            <div className="mt-3 h-8 w-24 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-28 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  const tarjetas = [
    {
      label: "VALOR CONTABLE TOTAL",
      valor: kpis.valorContableTotal,
      detalle: kpis.valorContableDetalle,
      color: "#6B1535",
    },
    {
      label: "AVALUO TOTAL",
      valor: kpis.avaluoTotal,
      detalle: kpis.avaluoTotalDetalle,
      color: "#0D7716",
    },
    {
      label: "AVALUOS POR ACTUALIZAR",
      valor: String(kpis.avaluosPorActualizar),
      detalle: kpis.avaluosPorActualizarDetalle,
      color: "#C57300",
    },
  ];

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {tarjetas.map((t, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {t.label}
          </p>
          <p className="mt-1 text-3xl font-extrabold" style={{ color: t.color }}>
            {t.valor}
          </p>
          <p className="mt-1 text-xs text-gray-500">{t.detalle}</p>
        </div>
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------
// Tabla de valores por inmueble
// -----------------------------------------------------------------------

function TablaValores({ items, cargando }: { items: FilaValorInmueble[]; cargando: boolean }) {
  const columnas = ["No. Control GBI", "Inmueble", "Valor de terreno", "Valor construcción"];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-bold text-gray-900">Valores por inmueble (Muestra)</h3>
        <span className="text-xs text-gray-400">Conciliación contable · DCAF</span>
      </div>

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
              : items.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100 text-gray-700 last:border-none hover:bg-gray-50">
                    <td className="whitespace-nowrap px-5 py-4 font-medium">{item.noControlGbi}</td>
                    <td className="whitespace-nowrap px-5 py-4">{item.inmueble}</td>
                    <td className="whitespace-nowrap px-5 py-4">{item.valorTerreno}</td>
                    <td className="whitespace-nowrap px-5 py-4">{item.valorConstruccion}</td>
                  </tr>
                ))}

            {!cargando && items.length === 0 && (
              <tr>
                <td colSpan={columnas.length} className="px-5 py-10 text-center text-gray-400">
                  No hay valores registrados en la muestra.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
