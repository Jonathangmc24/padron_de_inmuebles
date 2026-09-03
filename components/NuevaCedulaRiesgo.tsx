"use client";

import { useState } from "react";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { SelectPersonalizado } from "@/components/shared/SelectPersonalizado";
import { SelectorInmueble } from "@/components/shared/SelectorInmueble";

interface FormCedula {
  inmuebleId: string;
  nivelRiesgo: string;
  extintoresVigentes: boolean;
  hidrantesVigentes: boolean;
  materialesPeligrosos: boolean;
  accesibilidad: boolean;
  observaciones: string;
}

const formInicial: FormCedula = {
  inmuebleId: "",
  nivelRiesgo: "",
  extintoresVigentes: false,
  hidrantesVigentes: false,
  materialesPeligrosos: false,
  accesibilidad: false,
  observaciones: "",
};

const OPCIONES_NIVEL = ["BAJO", "MEDIO", "ALTO"];
const ETIQUETAS_NIVEL: Record<string, string> = {
  BAJO: "Bajo",
  MEDIO: "Medio",
  ALTO: "Alto",
};

function CampoCheckbox({
  etiqueta,
  detalle,
  valor,
  onChange,
}: {
  etiqueta: string;
  detalle: string;
  valor: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <input
        type="checkbox"
        checked={valor}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[#7B2645]"
      />
      <div>
        <p className="text-sm font-semibold text-gray-900">{etiqueta}</p>
        <p className="text-xs text-gray-500">{detalle}</p>
      </div>
    </label>
  );
}

export default function NuevaCedulaRiesgo() {
  const [form, setForm] = useState<FormCedula>(formInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function actualizar<K extends keyof FormCedula>(campo: K, valor: FormCedula[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function onGuardar() {
    if (!form.inmuebleId || !form.nivelRiesgo) {
      setError("Selecciona un inmueble y el nivel de riesgo.");
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const res = await fetch("/api/cedulas-riesgo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("No se pudo guardar la cédula de riesgo");
      window.location.href = "/proteccion-civil";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F3F3F3" }}>
      <Header title="Nueva cédula de riesgo" />

      <main className="px-4 py-6 sm:px-8 sm:py-8 lg:px-[10mm] lg:py-[10mm]">
        <a
          href="/proteccion-civil"
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold"
          style={{ color: "#7B2645" }}
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a Protección civil y riesgos
        </a>

        <h2 className="mb-6 text-xl font-extrabold text-gray-900">Nueva cédula de riesgo</h2>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <SelectorInmueble
              value={form.inmuebleId}
              onChange={(id) => actualizar("inmuebleId", id)}
              requerido
            />

            <div>
              <label className="mb-1.5 block text-sm text-gray-700">
                Nivel de riesgo<span className="ml-0.5 text-red-500">*</span>
              </label>
              <SelectPersonalizado
                value={form.nivelRiesgo ? ETIQUETAS_NIVEL[form.nivelRiesgo] : ""}
                onChange={(etiqueta) => {
                  const valor = Object.entries(ETIQUETAS_NIVEL).find(([, v]) => v === etiqueta)?.[0] ?? "";
                  actualizar("nivelRiesgo", valor);
                }}
                placeholder="Selecciona..."
                opciones={OPCIONES_NIVEL.map((n) => ETIQUETAS_NIVEL[n])}
                variante="filtro"
              />
            </div>
          </div>
        </div>

        <h3 className="mb-3 text-sm font-bold text-gray-900">Checklist</h3>
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CampoCheckbox
            etiqueta="Extintores vigentes"
            detalle="Recarga al corriente"
            valor={form.extintoresVigentes}
            onChange={(v) => actualizar("extintoresVigentes", v)}
          />
          <CampoCheckbox
            etiqueta="Hidrantes vigentes"
            detalle="Funcionando correctamente"
            valor={form.hidrantesVigentes}
            onChange={(v) => actualizar("hidrantesVigentes", v)}
          />
          <CampoCheckbox
            etiqueta="Materiales peligrosos"
            detalle="Se manejan o almacenan en el inmueble"
            valor={form.materialesPeligrosos}
            onChange={(v) => actualizar("materialesPeligrosos", v)}
          />
          <CampoCheckbox
            etiqueta="Accesibilidad"
            detalle="Cuenta con accesos para personas con discapacidad"
            valor={form.accesibilidad}
            onChange={(v) => actualizar("accesibilidad", v)}
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <label className="mb-1.5 block text-sm text-gray-700">Observaciones</label>
          <textarea
            value={form.observaciones}
            onChange={(e) => actualizar("observaciones", e.target.value)}
            rows={3}
            placeholder="Detalles adicionales sobre la cédula..."
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-gray-400"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <a href="/proteccion-civil" className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700">
            Cancelar
          </a>
          <button
            type="button"
            disabled={guardando}
            onClick={onGuardar}
            className="rounded-full px-6 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            style={{ backgroundColor: "#7B2645" }}
          >
            {guardando ? "Guardando…" : "Guardar cédula"}
          </button>
        </div>
      </main>
    </div>
  );
}
