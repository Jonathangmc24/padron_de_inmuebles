"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Check, X, Minus, ChevronLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { guardarUltimoInmueble } from "@/lib/ultimoInmueble";

// -----------------------------------------------------------------------
// Tipos — deben coincidir con la forma real de la respuesta del API
// -----------------------------------------------------------------------

type ColorBadge = "verde" | "purpura" | "naranja" | "gris";
type EstadoCheck = "si" | "no" | "parcial";

interface Badge {
  label: string;
  color: ColorBadge;
}

interface Campo {
  label: string;
  value: string;
}

interface ChecklistItem {
  label: string;
  estado: EstadoCheck;
  detalle?: string;
}

interface EventoBitacora {
  fecha: string;
  evento: string;
  autor: string;
}

interface ExpedienteData {
  identidad: {
    noGbi: string;
    titulo: string;
    consecutivo: string;
    cuo: string;
    rfi: string;
    direccionRegional: string;
    badges: Badge[];
  };
  ubicacion: {
    domicilio: Campo[];
    claves: Campo[];
  };
  localizacionTecnicos: {
    datosTecnicos: Campo[];
    georreferencia: Campo[];
    nota?: string;
  };
  condicionesFisicas: {
    situacionGrafica: Campo[];
    servicios: ChecklistItem[];
  };
  documentosPropiedad: {
    documento: Campo[];
    inscripcionRegistral: Campo[];
    resguardo?: string;
  };
  catastroFederal: {
    datos: Campo[];
    planosDictamenes: ChecklistItem[];
  };
  catastroMunicipal: {
    datos: Campo[];
    conciliacionContable: Campo[];
  };
  situacionesEspeciales: {
    usoCompartido: Campo[];
    comentario: string;
  };
  historial: {
    bitacora: EventoBitacora[];
    fechasControl: Campo[];
  };
}

const badgeColores: Record<ColorBadge, string> = {
  verde: "bg-emerald-500",
  purpura: "bg-purple-500",
  naranja: "bg-amber-500",
  gris: "bg-gray-400",
};

const TABS = [
  { key: "ubicacion", label: "Ubicación" },
  { key: "localizacion_tecnicos", label: "Localización y técnicos" },
  { key: "condiciones_fisicas", label: "Condiciones físicas" },
  { key: "documentos_propiedad", label: "Documentos de propiedad" },
  { key: "catastro_federal", label: "Catastro federal" },
  { key: "catastro_municipal", label: "Catastro municipal" },
  { key: "situaciones_especiales", label: "Situaciones especiales" },
  { key: "historial", label: "Historial" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

interface UsuarioActual {
  nombre: string;
  apellido: string;
}

// -----------------------------------------------------------------------
// Llamadas al API — AJUSTA estas rutas/URLs a tu backend real
// -----------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function fetchExpediente(id: string): Promise<ExpedienteData> {
  const res = await fetch(`${API_BASE}/api/inmuebles/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo obtener el expediente");
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

export default function Expediente() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [usuario, setUsuario] = useState<UsuarioActual | null>(null);
  const [data, setData] = useState<ExpedienteData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("ubicacion");

  useEffect(() => {
    fetchUsuarioActual()
      .then(setUsuario)
      .catch(() => setUsuario(null));
  }, []);

  useEffect(() => {
    if (!id) return;
    guardarUltimoInmueble(id);
    let activo = true;
    setCargando(true);

    fetchExpediente(id)
      .then((res) => {
        if (!activo) return;
        setData(res);
        setError(null);
      })
      .catch((err: Error) => {
        if (!activo) return;
        setError(err.message ?? "Ocurrió un error al cargar el expediente");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F3F3F3" }}>
      <Header title="Expediente" iniciales={getIniciales(usuario)} />

      <main className="mx-auto max-w-7xl px-6 py-8 sm:px-10 sm:py-10">
        {error && (
          <p className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <Breadcrumb />

        {cargando ? (
          <TarjetaIdentidadSkeleton />
        ) : data ? (
          <TarjetaIdentidad identidad={data.identidad} />
        ) : null}

        <TabsExpediente tabActivo={tab} onTabChange={setTab} />

        {cargando ? (
          <ContenidoSkeleton />
        ) : data ? (
          <ContenidoTab tab={tab} data={data} />
        ) : null}
      </main>
    </div>
  );
}

// -----------------------------------------------------------------------
// Breadcrumb
// -----------------------------------------------------------------------

function Breadcrumb() {
  return (
    <div className="mb-4">
      <p className="text-xs text-gray-400">Padrón de inmuebles · Expediente</p>
      <a
        href="/padron-inmuebles"
        className="mt-1 inline-flex items-center gap-1 text-sm font-medium"
        style={{ color: "#7B2645" }}
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al padrón
      </a>
    </div>
  );
}

// -----------------------------------------------------------------------
// Tarjeta de identidad del inmueble
// -----------------------------------------------------------------------

function TarjetaIdentidad({ identidad }: { identidad: ExpedienteData["identidad"] }) {
  return (
    <div className="mb-6 flex flex-wrap items-start gap-4 rounded-xl border border-gray-200 bg-white p-5">
      <div
        className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg text-white"
        style={{ backgroundColor: "#611830" }}
      >
        <span className="text-xl font-medium leading-none">{identidad.noGbi}</span>
        <span className="text-[10px] font-medium tracking-wide">GBI</span>
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-medium text-gray-900">{identidad.titulo}</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Consecutivo {identidad.consecutivo} · C.U.O. {identidad.cuo} · R.F.I. {identidad.rfi} ·
          {" "}{identidad.direccionRegional}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-4">
          {identidad.badges.map((b, i) => (
            <div key={i} className="flex items-center gap-1.5 text-sm">
              <span className={`h-2 w-2 rounded-full ${badgeColores[b.color]}`} />
              <span className="text-gray-600">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TarjetaIdentidadSkeleton() {
  return (
    <div className="mb-6 flex animate-pulse items-start gap-4 rounded-xl border border-gray-200 bg-white p-5">
      <div className="h-16 w-16 shrink-0 rounded-lg bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-5 w-64 rounded bg-gray-200" />
        <div className="h-4 w-96 rounded bg-gray-100" />
        <div className="h-4 w-48 rounded bg-gray-100" />
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Tabs
// -----------------------------------------------------------------------

function TabsExpediente({
  tabActivo,
  onTabChange,
}: {
  tabActivo: TabKey;
  onTabChange: (t: TabKey) => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap gap-1  border-b border-gray-300">
      {TABS.map((t) => {
        const activo = t.key === tabActivo;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onTabChange(t.key)}
            className={`sin-sombra-hover whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm transition-colors ${
              activo ? "font-medium" : "font-medium"
            }`}
            style={activo ? { backgroundColor: "#EEE4E7", color: "#7B2645" } : { color: "#9C6B7A" }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// -----------------------------------------------------------------------
// Bloques reutilizables de contenido
// -----------------------------------------------------------------------

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-3">
        <h3 className="whitespace-nowrap text-xs font-medium uppercase tracking-wider" style={{ color: "#7B2645" }}>
          {titulo}
        </h3>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
      {children}
    </div>
  );
}

function CampoGrid({ campos }: { campos: Campo[] }) {
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 sm:grid-cols-3">
      {campos.map((c, i) => (
        <div key={i} className="bg-white p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "#7B2645" }}>
            {c.label}
          </p>
          <p className="mt-1 text-sm font-medium text-gray-900">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

const checklistIcono: Record<EstadoCheck, { Icono: typeof Check; color: string }> = {
  si: { Icono: Check, color: "text-emerald-600" },
  no: { Icono: X, color: "text-red-500" },
  parcial: { Icono: Minus, color: "text-amber-500" },
};

function Checklist({ items }: { items: ChecklistItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item, i) => {
        const { Icono, color } = checklistIcono[item.estado];
        return (
          <div key={i} className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4">
            <Icono className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
            <div>
              <p className="text-sm font-medium text-gray-900">{item.label}</p>
              {item.detalle && <p className="text-xs text-gray-500">{item.detalle}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InfoBox({ texto }: { texto: string }) {
  return (
    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      {texto}
    </div>
  );
}

function Timeline({ eventos }: { eventos: EventoBitacora[] }) {
  return (
    <ol className="relative space-y-6 border-l-2 border-gray-200 pl-6">
      {eventos.map((ev, i) => (
        <li key={i} className="relative">
          <span
            className="absolute -left-[29px] top-0.5 h-3 w-3 rounded-full border-2 bg-white"
            style={{ borderColor: "#7B2645" }}
          />
          <p className="text-xs font-medium text-gray-400">{ev.fecha}</p>
          <p className="text-sm font-medium text-gray-900">{ev.evento}</p>
          <p className="text-xs text-gray-500">{ev.autor}</p>
        </li>
      ))}
    </ol>
  );
}

// -----------------------------------------------------------------------
// Contenido por pestaña
// -----------------------------------------------------------------------

function ContenidoTab({ tab, data }: { tab: TabKey; data: ExpedienteData }) {
  switch (tab) {
    case "ubicacion":
      return (
        <>
          <Seccion titulo="Domicilio">
            <CampoGrid campos={data.ubicacion.domicilio} />
          </Seccion>
          <Seccion titulo="Claves">
            <CampoGrid campos={data.ubicacion.claves} />
          </Seccion>
        </>
      );

    case "localizacion_tecnicos":
      return (
        <>
          <Seccion titulo="Datos técnicos">
            <CampoGrid campos={data.localizacionTecnicos.datosTecnicos} />
          </Seccion>
          <Seccion titulo="Georreferencia">
            <CampoGrid campos={data.localizacionTecnicos.georreferencia} />
            {data.localizacionTecnicos.nota && <InfoBox texto={data.localizacionTecnicos.nota} />}
          </Seccion>
        </>
      );

    case "condiciones_fisicas":
      return (
        <>
          <Seccion titulo="Situación gráfica y condiciones">
            <CampoGrid campos={data.condicionesFisicas.situacionGrafica} />
          </Seccion>
          <Seccion titulo="Servicios e instalaciones">
            <Checklist items={data.condicionesFisicas.servicios} />
          </Seccion>
        </>
      );

    case "documentos_propiedad":
      return (
        <>
          <Seccion titulo="Documento de propiedad">
            <CampoGrid campos={data.documentosPropiedad.documento} />
          </Seccion>
          <Seccion titulo="Inscripción registral">
            <CampoGrid campos={data.documentosPropiedad.inscripcionRegistral} />
            {data.documentosPropiedad.resguardo && <InfoBox texto={data.documentosPropiedad.resguardo} />}
          </Seccion>
        </>
      );

    case "catastro_federal":
      return (
        <>
          <Seccion titulo="Datos de catastro (INDAABIN)">
            <CampoGrid campos={data.catastroFederal.datos} />
          </Seccion>
          <Seccion titulo="Planos y dictámenes">
            <Checklist items={data.catastroFederal.planosDictamenes} />
          </Seccion>
        </>
      );

    case "catastro_municipal":
      return (
        <>
          <Seccion titulo="Datos del catastro municipal">
            <CampoGrid campos={data.catastroMunicipal.datos} />
          </Seccion>
          <Seccion titulo="Conciliación contable (DCAF)">
            <CampoGrid campos={data.catastroMunicipal.conciliacionContable} />
          </Seccion>
        </>
      );

    case "situaciones_especiales":
      return (
        <>
          <Seccion titulo="Uso compartido y situaciones especiales">
            <CampoGrid campos={data.situacionesEspeciales.usoCompartido} />
          </Seccion>
          <Seccion titulo="Observaciones">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "#7B2645" }}>
                Comentario
              </p>
              <p className="mt-1 text-sm text-gray-700">{data.situacionesEspeciales.comentario}</p>
            </div>
          </Seccion>
        </>
      );

    case "historial":
      return (
        <>
          <Seccion titulo="Bitácora del expediente">
            <Timeline eventos={data.historial.bitacora} />
          </Seccion>
          <Seccion titulo="Fechas de control">
            <CampoGrid campos={data.historial.fechasControl} />
          </Seccion>
        </>
      );

    default:
      return null;
  }
}

function ContenidoSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 w-40 rounded bg-gray-200" />
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2 bg-white p-4">
            <div className="h-3 w-24 rounded bg-gray-200" />
            <div className="h-4 w-32 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
