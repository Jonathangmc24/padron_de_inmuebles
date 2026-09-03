"use client";

import { useEffect, useState } from "react";
import { SelectPersonalizado } from "@/components/shared/SelectPersonalizado";

interface OpcionInmueble {
  id: string;
  etiqueta: string;
}

export function SelectorInmueble({
  value,
  onChange,
  requerido,
}: {
  /** id real del inmueble seleccionado */
  value: string;
  /** recibe el id real del inmueble, no la etiqueta visible */
  onChange: (id: string) => void;
  requerido?: boolean;
}) {
  const [opciones, setOpciones] = useState<OpcionInmueble[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("/api/inmuebles/lista")
      .then((res) => res.json())
      .then((data: OpcionInmueble[]) => setOpciones(data))
      .catch(() => setOpciones([]))
      .finally(() => setCargando(false));
  }, []);

  const etiquetaSeleccionada = opciones.find((o) => o.id === value)?.etiqueta ?? "";

  function alSeleccionarEtiqueta(etiqueta: string) {
    const encontrado = opciones.find((o) => o.etiqueta === etiqueta);
    onChange(encontrado?.id ?? "");
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm text-gray-700">
        Inmueble
        {requerido && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <SelectPersonalizado
        value={etiquetaSeleccionada}
        onChange={alSeleccionarEtiqueta}
        placeholder={cargando ? "Cargando inmuebles..." : "Selecciona un inmueble..."}
        opciones={opciones.map((o) => o.etiqueta)}
        variante="filtro"
      />
    </div>
  );
}
