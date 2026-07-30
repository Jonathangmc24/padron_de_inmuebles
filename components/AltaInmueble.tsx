"use client";

import { useState } from "react";
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

// -----------------------------------------------------------------------
// Componente principal
// -----------------------------------------------------------------------

export default function AltaInmueble() {
  const [usuario] = useState<UsuarioActual | null>(null);
  const [form, setForm] = useState<AltaInmuebleForm>(formInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F3F3F3" }}>
      <Header title="Alta de inmueble" iniciales={getIniciales(usuario)} />

      <main style={{ padding: "10mm" }}>
        {error && (
          <p className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <EncabezadoFormulario guardando={guardando} onGuardarBorrador={onGuardarBorrador} onCrearExpediente={onCrearExpediente} />

        <SeccionCard titulo="Identificación">
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
          />
          <CampoTexto
            label="R.F.I."
            value={form.identificacion.rfi}
            onChange={(v) => actualizar("identificacion", "rfi", v)}
            placeholder="No R.F.I. (Si aplica)"
          />
        </SeccionCard>

        <SeccionCard titulo="Régimen y propiedad">
          <CampoSelect
            label="Régimen"
            value={form.regimenPropiedad.regimen}
            onChange={(v) => actualizar("regimenPropiedad", "regimen", v)}
            placeholder="Selecciona..."
            opciones={OPCIONES_REGIMEN}
          />
          <CampoSelect
            label="Documento que acredita"
            value={form.regimenPropiedad.documentoQueAcredita}
            onChange={(v) => actualizar("regimenPropiedad", "documentoQueAcredita", v)}
            placeholder="Selecciona..."
            opciones={OPCIONES_DOCUMENTO_ACREDITA}
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
        </SeccionCard>

        <SeccionCard titulo="Ubicación">
          <CampoSelect
            label="Entidad federativa"
            value={form.ubicacion.entidadFederativa}
            onChange={(v) => actualizar("ubicacion", "entidadFederativa", v)}
            placeholder="Selecciona..."
            opciones={OPCIONES_ENTIDAD_FEDERATIVA}
          />
          <CampoTexto
            label="Municipio"
            value={form.ubicacion.municipio}
            onChange={(v) => actualizar("ubicacion", "municipio", v)}
            placeholder="Texto..."
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
        </SeccionCard>

        <SeccionCard titulo="Datos técnicos">
          <CampoTexto
            label="Tipo de inmueble"
            value={form.datosTecnicos.tipoInmueble}
            onChange={(v) => actualizar("datosTecnicos", "tipoInmueble", v)}
            placeholder="Texto..."
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
          />
          <CampoSelect
            label="Rural / Semiurbano / Urbano"
            value={form.datosTecnicos.ruralSemiurbanoUrbano}
            onChange={(v) => actualizar("datosTecnicos", "ruralSemiurbanoUrbano", v)}
            placeholder="Selecciona..."
            opciones={OPCIONES_ZONA}
          />
        </SeccionCard>

        {/* Aquí seguirán las siguientes secciones del formulario */}
      </main>
    </div>
  );
}

// -----------------------------------------------------------------------
// Encabezado del formulario (título, flujograma, acciones)
// -----------------------------------------------------------------------

function EncabezadoFormulario({
  guardando,
  onGuardarBorrador,
  onCrearExpediente,
}: {
  guardando: boolean;
  onGuardarBorrador: () => void;
  onCrearExpediente: () => void;
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

        <a
          href="/informacion-financiera/conciliacion-dcaf"
          className="text-sm font-bold"
          style={{ color: "#7B2645" }}
        >
          Conciliación DCAF
        </a>
      </div>

      <div
        className="mt-4 inline-block rounded-full border px-4 py-2 text-xs font-medium"
        style={{ borderColor: "#C57300", color: "#C57300" }}
      >
        <span className="font-bold">Flujograma inicial:</span> 1.1 R.F.I. - 1.2 Regimen
        (Documentado de propiedad) - 1.3 Ubicación (Georreferencia y constancia de aliniamiento)
      </div>

      <div className="mt-4 flex items-center justify-end gap-4">
        <a href="/padron-inmuebles" className="text-sm font-medium text-gray-500 hover:text-gray-700">
          Cancelar
        </a>
        <button
          type="button"
          disabled={guardando}
          onClick={onGuardarBorrador}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: "#C57300" }}
        >
          Guardar borrador
        </button>
        <button
          type="button"
          disabled={guardando}
          onClick={onCrearExpediente}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: "#7B2645" }}
        >
          Crear expediente
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Tarjeta de sección
// -----------------------------------------------------------------------

function SeccionCard({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="mb-5 text-sm font-bold uppercase tracking-wide" style={{ color: "#7B2645" }}>
        {titulo}
      </h3>
      <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Campos reutilizables
// -----------------------------------------------------------------------

function CampoTexto({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-gray-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-lg border-2 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
        style={{ borderColor: "#6B1535" }}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  opciones: string[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-gray-700">{label}</label>
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
      <label className="mb-1.5 block text-sm text-gray-700">{label}</label>
      <SelectorFecha value={value} onChange={onChange} />
    </div>
  );
}
