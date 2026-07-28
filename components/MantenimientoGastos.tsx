"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Plus, Check, AlertTriangle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { SelectPersonalizado } from "@/components/shared/SelectPersonalizado";

// -----------------------------------------------------------------------
// Tipos — deben coincidir con la forma real de la respuesta del API
// -----------------------------------------------------------------------

interface KpisMantenimiento {
  gastoAnualEstimado: string;
  gastoAnualDetalle: string;
  serviciosAlCorriente: number;
  serviciosAlCorrienteDetalle: string;
  mantenimientosPendientes: number;
  mantenimientosPendientesDetalle: string;
  inmueblesAsegurados: number;
  inmueblesAseguradosDetalle: string;
}

interface MantenimientoHistorialItem {
  titulo: string;
  detalle: string;
  monto: string;
}

type EstadoServicio = "al_corriente" | "atencion";

interface ServicioEstatus {
  titulo: string;
  detalle: string;
  estado: EstadoServicio;
}

interface MantenimientoData {
  kpis: KpisMantenimiento;
  historial: MantenimientoHistorialItem[];
  serviciosEstatus: ServicioEstatus[];
  programas: string[];
}

interface UsuarioActual {
  nombre: string;
  apellido: string;
}

const estadoServicioConfig: Record<
  EstadoServicio,
  { Icono: typeof Check; iconoColor: string; iconoBg: string; borde: string }
> = {
  al_corriente: {
    Icono: Check,
    iconoColor: "text-emerald-600",
    iconoBg: "bg-emerald-50",
    borde: "#33893B",
  },
  atencion: {
    Icono: AlertTriangle,
    iconoColor: "text-amber-600",
    iconoBg: "bg-amber-50",
    borde: "#E3C687",
  },
};

// -----------------------------------------------------------------------
// Llamadas al API — AJUSTA estas rutas/URLs a tu backend real
// -----------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function fetchMantenimiento(programa: string): Promise<MantenimientoData> {
  const query = new URLSearchParams({ programa });
  const res = await fetch(`${API_BASE}/api/mantenimiento-gastos?${query.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("No se pudo obtener la información de mantenimiento");
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

export default function MantenimientoGastos() {
  const [usuario, setUsuario] = useState<UsuarioActual | null>(null);
  const [data, setData] = useState<MantenimientoData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [programa, setPrograma] = useState("Programa anual");

  useEffect(() => {
    fetchUsuarioActual()
      .then(setUsuario)
      .catch(() => setUsuario(null));
  }, []);

  useEffect(() => {
    let activo = true;
    setCargando(true);

    fetchMantenimiento(programa)
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
  }, [programa]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F3F3F3" }}>
      <Header title="Mantenimiento y gastos" iniciales={getIniciales(usuario)} />

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

        <EncabezadoPagina
          programa={programa}
          onProgramaChange={setPrograma}
          opciones={data?.programas ?? ["Programa anual"]}
        />

        <KpiGrid kpis={data?.kpis} cargando={cargando} />

        <HistorialMantenimientos items={data?.historial ?? []} cargando={cargando} />

        <EstatusServicios items={data?.serviciosEstatus ?? []} cargando={cargando} />
      </main>
    </div>
  );
}

// -----------------------------------------------------------------------
// Encabezado (título + filtro + botón)
// -----------------------------------------------------------------------

function EncabezadoPagina({
  programa,
  onProgramaChange,
  opciones,
}: {
  programa: string;
  onProgramaChange: (v: string) => void;
  opciones: string[];
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-extrabold text-gray-900">Mantenimiento y gastos operativos</h2>
        <p className="mt-1 text-sm text-gray-500">Programa anual, historial y pagos de servicios</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-44">
          <SelectPersonalizado
            value={programa}
            onChange={onProgramaChange}
            placeholder="Programa anual"
            opciones={opciones}
            variante="filtro"
          />
        </div>

        <button
          type="button"
          className="flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: "#611830" }}
          onClick={() => {
            // TODO: conectar al flujo real de registro de mantenimiento
            window.location.href = "/mantenimiento-gastos/nuevo";
          }}
        >
          <Plus className="h-4 w-4" />
          Registrar mantenimiento
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// KPIs
// -----------------------------------------------------------------------

function KpiGrid({ kpis, cargando }: { kpis: KpisMantenimiento | undefined; cargando: boolean }) {
  if (cargando || !kpis) {
    return (
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
            <div className="h-3 w-20 rounded bg-gray-200" />
            <div className="mt-3 h-7 w-16 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-24 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  const tarjetas = [
    {
      label: "GASTO ANUAL ESTIMADO",
      valor: kpis.gastoAnualEstimado,
      detalle: kpis.gastoAnualDetalle,
      color: "#6B1535",
    },
    {
      label: "SERVICIOS AL CORRIENTE",
      valor: String(kpis.serviciosAlCorriente),
      detalle: kpis.serviciosAlCorrienteDetalle,
      color: "#0D7716",
    },
    {
      label: "MANTENIMIENTOS PENDIENTES",
      valor: String(kpis.mantenimientosPendientes),
      detalle: kpis.mantenimientosPendientesDetalle,
      color: "#C57300",
    },
    {
      label: "INMUEBLES ASEGURADOS",
      valor: String(kpis.inmueblesAsegurados),
      detalle: kpis.inmueblesAseguradosDetalle,
      color: "#A01448",
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
// Historial de mantenimientos
// -----------------------------------------------------------------------

function HistorialMantenimientos({
  items,
  cargando,
}: {
  items: MantenimientoHistorialItem[];
  cargando: boolean;
}) {
  return (
    <div className="mb-8">
      <h3 className="mb-3 text-base font-bold text-gray-900">Historial de mantenimientos</h3>

      <div className="divide-y divide-gray-200">
        {cargando
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex animate-pulse items-center justify-between py-4">
                <div className="space-y-2">
                  <div className="h-4 w-48 rounded bg-gray-200" />
                  <div className="h-3 w-40 rounded bg-gray-100" />
                </div>
                <div className="h-4 w-16 rounded bg-gray-200" />
              </div>
            ))
          : items.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.titulo}</p>
                  <p className="text-xs text-gray-500">{item.detalle}</p>
                </div>
                <span className="text-sm font-bold" style={{ color: "#6B1535" }}>
                  {item.monto}
                </span>
              </div>
            ))}

        {!cargando && items.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">
            No hay mantenimientos registrados.
          </p>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Estatus de servicios públicos y seguros
// -----------------------------------------------------------------------

function EstatusServicios({ items, cargando }: { items: ServicioEstatus[]; cargando: boolean }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-bold text-gray-900">
        Estatus de servicios públicos y seguros
      </h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {cargando
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-3 rounded-lg border border-gray-200 p-3">
                <div className="h-8 w-8 shrink-0 rounded-md bg-gray-200" />
                <div className="space-y-1.5">
                  <div className="h-3 w-28 rounded bg-gray-200" />
                  <div className="h-3 w-36 rounded bg-gray-100" />
                </div>
              </div>
            ))
          : items.map((item, i) => {
              const cfg = estadoServicioConfig[item.estado];
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border-2 border-l-4 border-gray-200 p-3"
                  style={{ borderLeftColor: cfg.borde }}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${cfg.iconoBg}`}>
                    <cfg.Icono className={`h-4 w-4 ${cfg.iconoColor}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.titulo}</p>
                    <p className="text-xs text-gray-500">{item.detalle}</p>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
