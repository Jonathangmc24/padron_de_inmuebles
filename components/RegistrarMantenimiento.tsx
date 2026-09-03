"use client";

import { useState } from "react";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { SelectPersonalizado } from "@/components/shared/SelectPersonalizado";
import { SelectorFecha } from "@/components/shared/SelectorFecha";
import { SelectorInmueble } from "@/components/shared/SelectorInmueble";

interface FormMantenimiento {
  inmuebleId: string;
  tipo: string;
  descripcion: string;
  costo: string;
  fecha: string;
}

const formInicial: FormMantenimiento = {
  inmuebleId: "",
  tipo: "",
  descripcion: "",
  costo: "",
  fecha: "",
};

const OPCIONES_TIPO = ["PREVENTIVO", "CORRECTIVO"];
const ETIQUETAS_TIPO: Record<string, string> = {
  PREVENTIVO: "Preventivo",
  CORRECTIVO: "Correctivo",
};

export default function RegistrarMantenimiento() {
  const [form, setForm] = useState<FormMantenimiento>(formInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function actualizar<K extends keyof FormMantenimiento>(campo: K, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function onGuardar() {
    if (!form.inmuebleId || !form.tipo || !form.descripcion || !form.fecha) {
      setError("Completa inmueble, tipo, descripción y fecha — son obligatorios.");
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const res = await fetch("/api/mantenimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("No se pudo guardar el mantenimiento");
      window.location.href = "/mantenimiento-gastos";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F3F3F3" }}>
      <Header title="Registrar mantenimiento" />

      <main className="px-4 py-6 sm:px-8 sm:py-8 lg:px-[10mm] lg:py-[10mm]">
        <a
          href="/mantenimiento-gastos"
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold"
          style={{ color: "#7B2645" }}
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a Mantenimiento y gastos
        </a>

        <h2 className="mb-6 text-xl font-extrabold text-gray-900">Registrar mantenimiento</h2>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <SelectorInmueble
              value={form.inmuebleId}
              onChange={(id) => actualizar("inmuebleId", id)}
              requerido
            />

            <div>
              <label className="mb-1.5 block text-sm text-gray-700">
                Tipo de mantenimiento<span className="ml-0.5 text-red-500">*</span>
              </label>
              <SelectPersonalizado
                value={form.tipo ? ETIQUETAS_TIPO[form.tipo] : ""}
                onChange={(etiqueta) => {
                  const valor = Object.entries(ETIQUETAS_TIPO).find(([, v]) => v === etiqueta)?.[0] ?? "";
                  actualizar("tipo", valor);
                }}
                placeholder="Selecciona..."
                opciones={OPCIONES_TIPO.map((t) => ETIQUETAS_TIPO[t])}
                variante="filtro"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-gray-700">
                Fecha<span className="ml-0.5 text-red-500">*</span>
              </label>
              <SelectorFecha value={form.fecha} onChange={(v) => actualizar("fecha", v)} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-gray-700">Costo (MXN)</label>
              <input
                type="number"
                value={form.costo}
                onChange={(e) => actualizar("costo", e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-gray-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm text-gray-700">
                Descripción<span className="ml-0.5 text-red-500">*</span>
              </label>
              <textarea
                value={form.descripcion}
                onChange={(e) => actualizar("descripcion", e.target.value)}
                rows={3}
                placeholder="Qué se hizo, quién lo realizó, etc."
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-gray-400"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <a href="/mantenimiento-gastos" className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700">
            Cancelar
          </a>
          <button
            type="button"
            disabled={guardando}
            onClick={onGuardar}
            className="rounded-full px-6 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            style={{ backgroundColor: "#7B2645" }}
          >
            {guardando ? "Guardando…" : "Guardar mantenimiento"}
          </button>
        </div>
      </main>
    </div>
  );
}
