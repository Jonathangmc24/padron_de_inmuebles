"use client";

import { useEffect, useState } from "react";
import { Search, Download, Plus } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { guardarUltimoInmueble } from "@/lib/ultimoInmueble";
import { SelectPersonalizado } from "@/components/shared/SelectPersonalizado";

// -----------------------------------------------------------------------
// Tipos — deben coincidir con la forma real de la respuesta del API
// -----------------------------------------------------------------------

type Estatus = "vigente" | "en_proceso" | "baja" | "reclasificacion";

interface Inmueble {
  noControlGbi: string;
  consecutivo: string;
  dirRegional: string;
  tipo: string;
  entidad: string;
  tipoInmueble: string;
  estatus: Estatus;
}

interface Conteos {
  todos: number;
  vigentes: number;
  enProceso: number;
  bajas: number;
  reclasificacion: number;
}

interface PadronResponse {
  items: Inmueble[];
  total: number;
  totalPaginas: number;
  conteos: Conteos;
}

interface UsuarioActual {
  nombre: string;
  apellido: string;
}

type TabKey = "todos" | "vigentes" | "en_proceso" | "bajas" | "reclasificacion";

const estatusConfig: Record<Estatus, { dot: string; text: string; label: string }> = {
  vigente: { dot: "bg-emerald-500", text: "text-emerald-600", label: "Vigente" },
  en_proceso: { dot: "bg-amber-500", text: "text-amber-600", label: "En proceso" },
  baja: { dot: "bg-gray-400", text: "text-gray-500", label: "Baja" },
  reclasificacion: { dot: "bg-purple-500", text: "text-purple-600", label: "Reclasificación" },
};

const PAGE_SIZE = 10;

// -----------------------------------------------------------------------
// Llamadas al API — AJUSTA estas rutas/URLs a tu backend real
// -----------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function fetchUsuarioActual(): Promise<UsuarioActual> {
  const res = await fetch(`${API_BASE}/api/auth/me`, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo obtener el usuario actual");
  return res.json();
}

async function fetchPadron(params: {
  tab: TabKey;
  page: number;
  busqueda: string;
  region: string;
  entidad: string;
  tipo: string;
}): Promise<PadronResponse> {
  const query = new URLSearchParams({
    tab: params.tab,
    page: String(params.page),
    pageSize: String(PAGE_SIZE),
    busqueda: params.busqueda,
    region: params.region,
    entidad: params.entidad,
    tipo: params.tipo,
  });

  const res = await fetch(`${API_BASE}/api/padron-inmuebles?${query.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("No se pudo obtener el padrón de inmuebles");
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

export default function PadronInmuebles() {
  const [usuario, setUsuario] = useState<UsuarioActual | null>(null);
  const [data, setData] = useState<PadronResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<TabKey>("todos");
  const [pagina, setPagina] = useState(1);
  const [busquedaInput, setBusquedaInput] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [region, setRegion] = useState("");
  const [entidad, setEntidad] = useState("");
  const [tipo, setTipo] = useState("");

  // Usuario actual (para las iniciales del header) — se carga una sola vez
  useEffect(() => {
    fetchUsuarioActual()
      .then(setUsuario)
      .catch(() => setUsuario(null));
  }, []);

  // Debounce simple del texto de búsqueda
  useEffect(() => {
    const timeout = setTimeout(() => {
      setBusqueda(busquedaInput);
      setPagina(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [busquedaInput]);

  // Recarga la tabla cuando cambia el tab, la página, la búsqueda o los filtros
  useEffect(() => {
    let activo = true;
    setCargando(true);

    fetchPadron({ tab, page: pagina, busqueda, region, entidad, tipo })
      .then((res) => {
        if (!activo) return;
        setData(res);
        setError(null);
      })
      .catch((err: Error) => {
        if (!activo) return;
        setError(err.message ?? "Ocurrió un error al cargar el padrón");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [tab, pagina, busqueda, region, entidad, tipo]);

  const totalPaginas = data?.totalPaginas ?? 1;
  const total = data?.total ?? 0;
  const conteos = data?.conteos;

  const tabs: { key: TabKey; label: string; count: number | undefined }[] = [
    { key: "todos", label: "Todos", count: conteos?.todos },
    { key: "vigentes", label: "Vigentes", count: conteos?.vigentes },
    { key: "en_proceso", label: "En proceso", count: conteos?.enProceso },
    { key: "bajas", label: "Bajas", count: conteos?.bajas },
    { key: "reclasificacion", label: "Reclasificación", count: conteos?.reclasificacion },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F3F3F3" }}>
      <Header title="Padrón de inmuebles" iniciales={getIniciales(usuario)} />

      <main className="mx-auto max-w-7xl px-6 py-8 sm:px-10 sm:py-10">
        {error && (
          <p className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <EncabezadoPagina />

        <BarraBusquedaYAlta busqueda={busquedaInput} onBusquedaChange={setBusquedaInput} />

        <Tabs tabs={tabs} tabActivo={tab} onTabChange={(t) => { setTab(t); setPagina(1); }} />

        <FiltrosYExportar
          region={region}
          entidad={entidad}
          tipo={tipo}
          onRegionChange={(v) => { setRegion(v); setPagina(1); }}
          onEntidadChange={(v) => { setEntidad(v); setPagina(1); }}
          onTipoChange={(v) => { setTipo(v); setPagina(1); }}
        />

        <TablaInmuebles items={data?.items ?? []} cargando={cargando} />

        <Paginacion
          pagina={pagina}
          totalPaginas={totalPaginas}
          total={total}
          pageSize={PAGE_SIZE}
          onPaginaChange={setPagina}
        />
      </main>
    </div>
  );
}

// -----------------------------------------------------------------------
// Breadcrumb + insignia del año
// -----------------------------------------------------------------------

function EncabezadoPagina() {
  return (
    <div className="mb-6">
      <a
        href="/"
        className="inline-block border-b-2 border-gray-800 pb-1 text-sm font-medium text-gray-800 hover:text-gray-600"
      >
        Panel de inicio
      </a>
    </div>
  );
}

// -----------------------------------------------------------------------
// Barra de búsqueda + botón de alta
// -----------------------------------------------------------------------

function BarraBusquedaYAlta({
  busqueda,
  onBusquedaChange,
}: {
  busqueda: string;
  onBusquedaChange: (v: string) => void;
}) {
  return (
    <div
      className="mb-6 flex flex-col gap-3 rounded-xl p-3 sm:flex-row sm:items-center"
      style={{ background: "linear-gradient(to right, #611830, #A8144B)" }}
    >
      <div className="flex flex-1 items-center gap-2 rounded-full bg-white px-4 py-2.5">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          placeholder="Buscar por No. de control GBI, dirección, municipio."
          className="flex-1 border-none bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
        />
        <button
          type="button"
          aria-label="Buscar"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: "#611830" }}
        >
          <Search className="h-4 w-4 text-white" />
        </button>
      </div>

      <button
        type="button"
        className="flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-3 text-sm font-medium text-white"
        style={{ backgroundColor: "#611830" }}
        onClick={() => {
          window.location.href = "/inmuebles/nuevo";
        }}
      >
        <Plus className="h-4 w-4" />
        Alta de inmueble
      </button>
    </div>
  );
}

// -----------------------------------------------------------------------
// Tabs de estatus
// -----------------------------------------------------------------------

function Tabs({
  tabs,
  tabActivo,
  onTabChange,
}: {
  tabs: { key: TabKey; label: string; count: number | undefined }[];
  tabActivo: TabKey;
  onTabChange: (t: TabKey) => void;
}) {
  return (
    <div className="mb-4 flex flex-nowrap gap-1 overflow-x-auto border-b border-gray-300 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
      {tabs.map((t) => {
        const activo = t.key === tabActivo;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onTabChange(t.key)}
            className={`sin-sombra-hover whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm transition-colors ${
              activo ? "font-medium" : "font-medium"
            }`}
            style={
              activo
                ? { backgroundColor: "#EEE4E7", color: "#7B2645" }
                : { color: "#9C6B7A" }
            }
          >
            {t.label} {t.count !== undefined ? `(${t.count})` : ""}
          </button>
        );
      })}
    </div>
  );
}

// -----------------------------------------------------------------------
// Filtros + exportar
// -----------------------------------------------------------------------

function FiltroSelect({
  placeholder,
  value,
  onChange,
  opciones,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  opciones: string[];
}) {
  return (
    <SelectPersonalizado
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      opciones={opciones}
      variante="filtro"
    />
  );
}

function FiltrosYExportar({
  region,
  entidad,
  tipo,
  onRegionChange,
  onEntidadChange,
  onTipoChange,
}: {
  region: string;
  entidad: string;
  tipo: string;
  onRegionChange: (v: string) => void;
  onEntidadChange: (v: string) => void;
  onTipoChange: (v: string) => void;
}) {
  // Opciones de ejemplo — reemplazar con las que devuelva tu API (ej. /api/catalogos)
  const regiones = ["Centro", "Metropolitana", "Norte", "Sur"];
  const entidades = ["CDMX", "QRO.", "GTO.", "BC.", "CHIH", "JC", "CS", "SL", "YN"];
  const tipos = ["Administración", "Sucursal", "COR", "CR"];

  return (
    <div className="mb-6 flex flex-nowrap items-center gap-3 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
      <button
        type="button"
        className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700"
      >
        Exportar
        <Download className="h-4 w-4" />
      </button>

      <div className="w-44 shrink-0">
        <FiltroSelect
          placeholder="Todas las regiones"
          value={region}
          onChange={onRegionChange}
          opciones={regiones}
        />
      </div>
      <div className="w-48 shrink-0">
        <FiltroSelect
          placeholder="Todas las entidades"
          value={entidad}
          onChange={onEntidadChange}
          opciones={entidades}
        />
      </div>
      <div className="w-44 shrink-0">
        <FiltroSelect
          placeholder="Todos los tipos"
          value={tipo}
          onChange={onTipoChange}
          opciones={tipos}
        />
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Tabla
// -----------------------------------------------------------------------

function TablaInmuebles({ items, cargando }: { items: Inmueble[]; cargando: boolean }) {
  const columnas = [
    "No. Control GBI",
    "Consecutivo",
    "Dir. Regional",
    "Tipo",
    "Entidad",
    "Tipo de inmueble",
    "Estatus",
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead style={{ backgroundColor: "#611830" }}>
          <tr>
            {columnas.map((col) => (
              <th key={col} className="whitespace-nowrap px-5 py-4 font-medium text-white">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cargando
            ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <tr key={i} className="animate-pulse border-b border-gray-100 last:border-none">
                  <td className="px-5 py-4" colSpan={columnas.length}>
                    <div className="h-4 w-full max-w-md rounded bg-gray-200" />
                  </td>
                </tr>
              ))
            : items.map((item, i) => {
                const cfg = estatusConfig[item.estatus];
                return (
                  <tr
                    key={i}
                    onClick={() => {
                      guardarUltimoInmueble(item.noControlGbi);
                      window.location.href = `/padron-inmuebles/${item.noControlGbi}`;
                    }}
                    className="cursor-pointer border-b border-gray-100 text-gray-700 last:border-none hover:bg-gray-50"
                  >
                    <td className="px-5 py-4 font-medium">{item.noControlGbi}</td>
                    <td className="px-5 py-4">{item.consecutivo}</td>
                    <td className="px-5 py-4">{item.dirRegional}</td>
                    <td className="px-5 py-4">{item.tipo}</td>
                    <td className="px-5 py-4">{item.entidad}</td>
                    <td className="px-5 py-4">{item.tipoInmueble}</td>
                    <td className="px-5 py-4">
                      <div className={`flex items-center gap-1.5 font-medium ${cfg.text}`}>
                        <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </div>
                    </td>
                  </tr>
                );
              })}

          {!cargando && items.length === 0 && (
            <tr>
              <td colSpan={columnas.length} className="px-5 py-10 text-center text-gray-400">
                No se encontraron inmuebles con estos criterios.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// -----------------------------------------------------------------------
// Paginación
// -----------------------------------------------------------------------

function Paginacion({
  pagina,
  totalPaginas,
  total,
  pageSize,
  onPaginaChange,
}: {
  pagina: number;
  totalPaginas: number;
  total: number;
  pageSize: number;
  onPaginaChange: (p: number) => void;
}) {
  const desde = total === 0 ? 0 : (pagina - 1) * pageSize + 1;
  const hasta = Math.min(pagina * pageSize, total);

  // Muestra un rango acotado de páginas alrededor de la actual
  const paginasVisibles = Array.from({ length: totalPaginas }, (_, i) => i + 1).slice(0, 7);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
      <p>
        Mostrando {desde}-{hasta} de {total} inmuebles
      </p>

      <div className="flex items-center gap-1">
        {paginasVisibles.map((p) => {
          const activo = p === pagina;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPaginaChange(p)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors"
              style={
                activo
                  ? { backgroundColor: "#611830", color: "#FFFFFF" }
                  : { color: "#611830" }
              }
            >
              {p}
            </button>
          );
        })}
      </div>
    </div>
  );
}
