"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { SelectPersonalizado } from "@/components/shared/SelectPersonalizado";
import { SelectorFecha } from "@/components/shared/SelectorFecha";

// -----------------------------------------------------------------------
// Tipos del formulario
// -----------------------------------------------------------------------

interface AltaInmuebleForm {
  identificacion: {
    noControlGbi: string;
    consecutivoAlfanumerico: string;
    direccionRegional: string;
    cuo: string;
    tipo: string;
    rfi: string;
  };
  regimenPropiedad: {
    regimen: string;
    documentoQueAcredita: string;
    numDocumento: string;
    fechaDocumento: string;
  };
  ubicacion: {
    entidadFederativa: string;
    municipio: string;
    tipoNombreVialidad: string;
    numeroExteriorInterior: string;
    colonia: string;
    cpDireccion: string;
  };
  datosTecnicos: {
    tipoInmueble: string;
    tipoOcupacionPrincipal: string;
    m2Terreno: string;
    m2Construccion: string;
    estadoFisico: string;
    ruralSemiurbanoUrbano: string;
  };
}

const formInicial: AltaInmuebleForm = {
  identificacion: {
    noControlGbi: "",
    consecutivoAlfanumerico: "",
    direccionRegional: "",
    cuo: "",
    tipo: "",
    rfi: "",
  },
  regimenPropiedad: {
    regimen: "",
    documentoQueAcredita: "",
    numDocumento: "",
    fechaDocumento: "",
  },
  ubicacion: {
    entidadFederativa: "",
    municipio: "",
    tipoNombreVialidad: "",
    numeroExteriorInterior: "",
    colonia: "",
    cpDireccion: "",
  },
  datosTecnicos: {
    tipoInmueble: "",
    tipoOcupacionPrincipal: "",
    m2Terreno: "",
    m2Construccion: "",
    estadoFisico: "",
    ruralSemiurbanoUrbano: "",
  },
};

// Opciones de ejemplo — reemplazar con catálogos reales del API (ej. /api/catalogos)
const OPCIONES_DIRECCION_REGIONAL = ["Centro", "Metropolitana", "Norte", "Sur"];
const OPCIONES_TIPO = ["Administración", "Sucursal", "COR", "CR"];
const OPCIONES_REGIMEN = ["Propiedad", "Arrendamiento", "Comodato", "Posesión"];
const OPCIONES_DOCUMENTO_ACREDITA = ["Escritura pública", "Contrato", "Constancia", "Otro"];
const OPCIONES_ENTIDAD_FEDERATIVA = [
  "Querétaro",
  "Ciudad de México",
  "Guanajuato",
  "Baja California",
  "Chihuahua",
  "Jalisco",
  "Coahuila",
  "San Luis Potosí",
  "Yucatán",
];
const OPCIONES_ESTADO_FISICO = ["Bueno", "Regular", "Malo"];
const OPCIONES_ZONA = ["Rural", "Semiurbano", "Urbano"];

// -----------------------------------------------------------------------
// Definición de pestañas y campos obligatorios por pestaña
// -----------------------------------------------------------------------

type TabKey = "identificacion" | "regimenPropiedad" | "ubicacion" | "datosTecnicos";

const TABS: { key: TabKey; label: string }[] = [
  { key: "identificacion", label: "Identificación" },
  { key: "regimenPropiedad", label: "Régimen y propiedad" },
  { key: "ubicacion", label: "Ubicación" },
  { key: "datosTecnicos", label: "Datos técnicos" },
];

// Campos obligatorios: [pestaña, campo, etiqueta a mostrar en el error]
const CAMPOS_REQUERIDOS: { tab: TabKey; campo: string; etiqueta: string }[] = [
  { tab: "identificacion", campo: "direccionRegional", etiqueta: "Dirección regional" },
  { tab: "identificacion", campo: "tipo", etiqueta: "Tipo" },
  { tab: "regimenPropiedad", campo: "regimen", etiqueta: "Régimen" },
  { tab: "regimenPropiedad", campo: "documentoQueAcredita", etiqueta: "Documento que acredita" },
  { tab: "ubicacion", campo: "entidadFederativa", etiqueta: "Entidad federativa" },
  { tab: "ubicacion", campo: "municipio", etiqueta: "Municipio" },
  { tab: "datosTecnicos", campo: "tipoInmueble", etiqueta: "Tipo de inmueble" },
  { tab: "datosTecnicos", campo: "estadoFisico", etiqueta: "Estado físico" },
];

function validar(form: AltaInmuebleForm): { tab: TabKey; etiqueta: string }[] {
  return CAMPOS_REQUERIDOS.filter(({ tab, campo }) => {
    const seccion = form[tab] as Record<string, string>;
    return !seccion[campo]?.trim();
  }).map(({ tab, etiqueta }) => ({ tab, etiqueta }));
}

interface UsuarioActual {
  nombre: string;
  apellido: string;
}

// -----------------------------------------------------------------------
// Llamadas al API — AJUSTA estas rutas/URLs a tu backend real
// -----------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function fetchUsuarioActual(): Promise<UsuarioActual> {
  const res = await fetch(`${API_BASE}/api/auth/me`, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo obtener el usuario actual");
  return res.json();
}

async function guardarBorrador(datos: AltaInmuebleForm) {
  const res = await fetch(`${API_BASE}/api/inmuebles/borrador`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  if (!res.ok) throw new Error("No se pudo guardar el borrador");
  return res.json();
}

async function crearExpediente(datos: AltaInmuebleForm) {
  const res = await fetch(`${API_BASE}/api/inmuebles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  if (!res.ok) throw new Error("No se pudo crear el expediente");
  return res.json();
}

function getIniciales(usuario: UsuarioActual | null): string {
  if (!usuario) return "";
  const inicialNombre = usuario.nombre?.trim().charAt(0) ?? "";
  const inicialApellido = usuario.apellido?.trim().charAt(0) ?? "";
  return `${inicialNombre}${inicialApellido}`.toUpperCase();
}

function formTieneCambios(form: AltaInmuebleForm): boolean {
  return JSON.stringify(form) !== JSON.stringify(formInicial);
}

// -----------------------------------------------------------------------
// Componente principal
// -----------------------------------------------------------------------

export default function AltaInmueble() {
  const [usuario] = useState<UsuarioActual | null>(null);
  const [form, setForm] = useState<AltaInmuebleForm>(formInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("identificacion");
  const [erroresValidacion, setErroresValidacion] = useState<{ tab: TabKey; etiqueta: string }[]>([]);

  const hayCambiosSinGuardar = formTieneCambios(form);

  // Prevención de pérdida de datos: advertir al cerrar/recargar la pestaña
  useEffect(() => {
    function alIntentarSalir(e: BeforeUnloadEvent) {
      if (!hayCambiosSinGuardar) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", alIntentarSalir);
    return () => window.removeEventListener("beforeunload", alIntentarSalir);
  }, [hayCambiosSinGuardar]);

  function actualizar<S extends keyof AltaInmuebleForm>(
    seccion: S,
    campo: keyof AltaInmuebleForm[S],
    valor: string
  ) {
    setForm((prev) => ({
      ...prev,
      [seccion]: { ...prev[seccion], [campo]: valor },
    }));
  }

  function onCancelar(e: React.MouseEvent) {
    if (hayCambiosSinGuardar) {
      const confirmar = window.confirm(
        "Tienes cambios sin guardar. Si sales ahora, se perderán. ¿Deseas continuar?"
      );
      if (!confirmar) {
        e.preventDefault();
      }
    }
  }

  async function onGuardarBorrador() {
    setGuardando(true);
    setError(null);
    try {
      await guardarBorrador(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error al guardar el borrador");
    } finally {
      setGuardando(false);
    }
  }

  async function onCrearExpediente() {
    const errores = validar(form);
    setErroresValidacion(errores);
    if (errores.length > 0) {
      setTab(errores[0].tab);
      setError(
        `Faltan campos obligatorios: ${errores.map((e) => e.etiqueta).join(", ")}`
      );
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const res = await crearExpediente(form);
      window.location.href = `/padron-inmuebles/${res.noControlGbi}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error al crear el expediente");
    } finally {
      setGuardando(false);
    }
  }

  const tieneErrorEnTab = (t: TabKey) => erroresValidacion.some((e) => e.tab === t);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F3F3F3" }}>
      <Header title="Alta de inmueble" iniciales={getIniciales(usuario)} />

      <main className="px-4 py-6 sm:px-8 sm:py-8 lg:px-[10mm] lg:py-[10mm]">
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <EncabezadoFormulario
          guardando={guardando}
          onGuardarBorrador={onGuardarBorrador}
          onCrearExpediente={onCrearExpediente}
          onCancelar={onCancelar}
        />

        <TabsFormulario tabActivo={tab} onTabChange={setTab} tieneErrorEnTab={tieneErrorEnTab} />

        <div className="min-h-[420px] rounded-xl rounded-tl-none border border-gray-200 bg-white p-6">
          {tab === "identificacion" && (
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              <CampoTexto
                label="No. Control GBI"
                value={form.identificacion.noControlGbi}
                onChange={(v) => actualizar("identificacion", "noControlGbi", v)}
                placeholder="Lo asigna la GBI"
                disabled
              />
              <CampoTexto
                label="Consecutivo alfanumérico"
                value={form.identificacion.consecutivoAlfanumerico}
                onChange={(v) => actualizar("identificacion", "consecutivoAlfanumerico", v)}
                placeholder="Lo asigna la GBI"
                disabled
              />
              <CampoSelect
                label="Dirección regional"
                value={form.identificacion.direccionRegional}
                onChange={(v) => actualizar("identificacion", "direccionRegional", v)}
                placeholder="Selecciona..."
                opciones={OPCIONES_DIRECCION_REGIONAL}
                requerido
              />
              <CampoTexto
                label="C.U.O."
                value={form.identificacion.cuo}
                onChange={(v) => actualizar("identificacion", "cuo", v)}
                placeholder="Clave única de ocupación"
              />
              <CampoSelect
                label="Tipo (Administración - Sucursal - COR - CR)"
                value={form.identificacion.tipo}
                onChange={(v) => actualizar("identificacion", "tipo", v)}
                placeholder="Selecciona..."
                opciones={OPCIONES_TIPO}
                requerido
              />
              <CampoTexto
                label="R.F.I."
                value={form.identificacion.rfi}
                onChange={(v) => actualizar("identificacion", "rfi", v)}
                placeholder="No R.F.I. (Si aplica)"
              />
            </div>
          )}

          {tab === "regimenPropiedad" && (
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              <CampoSelect
                label="Régimen"
                value={form.regimenPropiedad.regimen}
                onChange={(v) => actualizar("regimenPropiedad", "regimen", v)}
                placeholder="Selecciona..."
                opciones={OPCIONES_REGIMEN}
                requerido
              />
              <CampoSelect
                label="Documento que acredita"
                value={form.regimenPropiedad.documentoQueAcredita}
                onChange={(v) => actualizar("regimenPropiedad", "documentoQueAcredita", v)}
                placeholder="Selecciona..."
                opciones={OPCIONES_DOCUMENTO_ACREDITA}
                requerido
              />
              <CampoTexto
                label="Núm. de documento"
                value={form.regimenPropiedad.numDocumento}
                onChange={(v) => actualizar("regimenPropiedad", "numDocumento", v)}
                placeholder="Texto..."
              />
              <CampoFecha
                label="Fecha de documento"
                value={form.regimenPropiedad.fechaDocumento}
                onChange={(v) => actualizar("regimenPropiedad", "fechaDocumento", v)}
              />
            </div>
          )}

          {tab === "ubicacion" && (
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              <CampoSelect
                label="Entidad federativa"
                value={form.ubicacion.entidadFederativa}
                onChange={(v) => actualizar("ubicacion", "entidadFederativa", v)}
                placeholder="Selecciona..."
                opciones={OPCIONES_ENTIDAD_FEDERATIVA}
                requerido
              />
              <CampoTexto
                label="Municipio"
                value={form.ubicacion.municipio}
                onChange={(v) => actualizar("ubicacion", "municipio", v)}
                placeholder="Texto..."
                requerido
              />
              <CampoTexto
                label="Tipo y nombre de vialidad"
                value={form.ubicacion.tipoNombreVialidad}
                onChange={(v) => actualizar("ubicacion", "tipoNombreVialidad", v)}
                placeholder="Texto..."
              />
              <CampoTexto
                label="Numero exterior / interior"
                value={form.ubicacion.numeroExteriorInterior}
                onChange={(v) => actualizar("ubicacion", "numeroExteriorInterior", v)}
                placeholder="Texto..."
              />
              <CampoTexto
                label="Colonia"
                value={form.ubicacion.colonia}
                onChange={(v) => actualizar("ubicacion", "colonia", v)}
                placeholder="Texto..."
              />
              <CampoTexto
                label="C.P. Dirección"
                value={form.ubicacion.cpDireccion}
                onChange={(v) => actualizar("ubicacion", "cpDireccion", v)}
                placeholder="Texto..."
              />
            </div>
          )}

          {tab === "datosTecnicos" && (
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              <CampoTexto
                label="Tipo de inmueble"
                value={form.datosTecnicos.tipoInmueble}
                onChange={(v) => actualizar("datosTecnicos", "tipoInmueble", v)}
                placeholder="Texto..."
                requerido
              />
              <CampoTexto
                label="Tipo ocupación principal"
                value={form.datosTecnicos.tipoOcupacionPrincipal}
                onChange={(v) => actualizar("datosTecnicos", "tipoOcupacionPrincipal", v)}
                placeholder="Texto..."
              />
              <CampoTexto
                label="Metro cuadrado terreno"
                value={form.datosTecnicos.m2Terreno}
                onChange={(v) => actualizar("datosTecnicos", "m2Terreno", v)}
                placeholder="Texto..."
              />
              <CampoTexto
                label="Metro cuadrado construcción"
                value={form.datosTecnicos.m2Construccion}
                onChange={(v) => actualizar("datosTecnicos", "m2Construccion", v)}
                placeholder="Texto..."
              />
              <CampoSelect
                label="Estado físico"
                value={form.datosTecnicos.estadoFisico}
                onChange={(v) => actualizar("datosTecnicos", "estadoFisico", v)}
                placeholder="Selecciona..."
                opciones={OPCIONES_ESTADO_FISICO}
                requerido
              />
              <CampoSelect
                label="Rural / Semiurbano / Urbano"
                value={form.datosTecnicos.ruralSemiurbanoUrbano}
                onChange={(v) => actualizar("datosTecnicos", "ruralSemiurbanoUrbano", v)}
                placeholder="Selecciona..."
                opciones={OPCIONES_ZONA}
              />
            </div>
          )}
        </div>

        <div className="mt-6">
          <AccionesMovil
            guardando={guardando}
            onGuardarBorrador={onGuardarBorrador}
            onCrearExpediente={onCrearExpediente}
            onCancelar={onCancelar}
          />
        </div>
      </main>
    </div>
  );
}

// -----------------------------------------------------------------------
// Encabezado del formulario (título, acciones — versión escritorio)
// -----------------------------------------------------------------------

function EncabezadoFormulario({
  guardando,
  onGuardarBorrador,
  onCrearExpediente,
  onCancelar,
}: {
  guardando: boolean;
  onGuardarBorrador: () => void;
  onCrearExpediente: () => void;
  onCancelar: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Alta de inmueble</h2>
          <p className="mt-1 text-sm text-gray-500">
            Apertura de expediente y carga e información (Flujograma inicial - DCAF - SRM - GBI)
          </p>
        </div>
      </div>

      <div className="mt-4 hidden flex-wrap items-center justify-end gap-3 sm:flex sm:gap-4">
        <a
          href="/padron-inmuebles"
          onClick={onCancelar}
          className="text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          Cancelar
        </a>
        <button
          type="button"
          disabled={guardando}
          onClick={onGuardarBorrador}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: "#C57300" }}
        >
          {guardando ? "Guardando…" : "Guardar borrador"}
        </button>
        <button
          type="button"
          disabled={guardando}
          onClick={onCrearExpediente}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: "#7B2645" }}
        >
          {guardando ? "Creando…" : "Crear expediente"}
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Pestañas del formulario
// -----------------------------------------------------------------------

function TabsFormulario({
  tabActivo,
  onTabChange,
  tieneErrorEnTab,
}: {
  tabActivo: TabKey;
  onTabChange: (t: TabKey) => void;
  tieneErrorEnTab: (t: TabKey) => boolean;
}) {
  return (
    <div className="flex flex-nowrap gap-1 overflow-x-auto sm:flex-wrap sm:overflow-visible">
      {TABS.map((t) => {
        const activo = t.key === tabActivo;
        const conError = tieneErrorEnTab(t.key);
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onTabChange(t.key)}
            className="sin-sombra-hover flex items-center gap-1.5 whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm transition-colors"
            style={
              activo
                ? { backgroundColor: "#FFFFFF", color: "#7B2645", fontWeight: 600 }
                : { backgroundColor: "#EEE4E7", color: conError ? "#DC2626" : "#9C6B7A" }
            }
          >
            {conError && <AlertTriangle className="h-3.5 w-3.5" />}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// -----------------------------------------------------------------------
// Botones de acción — versión móvil, apilados y full width
// -----------------------------------------------------------------------

function AccionesMovil({
  guardando,
  onGuardarBorrador,
  onCrearExpediente,
  onCancelar,
}: {
  guardando: boolean;
  onGuardarBorrador: () => void;
  onCrearExpediente: () => void;
  onCancelar: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:hidden">
      <button
        type="button"
        disabled={guardando}
        onClick={onCrearExpediente}
        className="w-full rounded-full px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        style={{ backgroundColor: "#7B2645" }}
      >
        {guardando ? "Creando…" : "Crear expediente"}
      </button>
      <button
        type="button"
        disabled={guardando}
        onClick={onGuardarBorrador}
        className="w-full rounded-full px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        style={{ backgroundColor: "#C57300" }}
      >
        {guardando ? "Guardando…" : "Guardar borrador"}
      </button>
      <a
        href="/padron-inmuebles"
        onClick={onCancelar}
        className="w-full py-1 text-center text-sm font-medium text-gray-500 hover:text-gray-700"
      >
        Cancelar
      </a>
    </div>
  );
}

// -----------------------------------------------------------------------
// Campos reutilizables
// -----------------------------------------------------------------------

function Etiqueta({ texto, requerido }: { texto: string; requerido?: boolean }) {
  return (
    <label className="mb-1.5 block text-sm text-gray-700">
      {texto}
      {requerido && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

function CampoTexto({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  requerido,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  requerido?: boolean;
}) {
  const vacioYRequerido = requerido && !value.trim();
  return (
    <div>
      <Etiqueta texto={label} requerido={requerido} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-700 outline-none placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400 ${
          vacioYRequerido ? "border-red-300 focus:border-red-400" : "border-gray-300 focus:border-gray-400"
        }`}
      />
    </div>
  );
}

function CampoSelect({
  label,
  value,
  onChange,
  placeholder,
  opciones,
  requerido,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  opciones: string[];
  requerido?: boolean;
}) {
  return (
    <div>
      <Etiqueta texto={label} requerido={requerido} />
      <SelectPersonalizado
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        opciones={opciones}
        variante="filtro"
      />
    </div>
  );
}

function CampoFecha({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Etiqueta texto={label} />
      <SelectorFecha value={value} onChange={onChange} />
    </div>
  );
}
