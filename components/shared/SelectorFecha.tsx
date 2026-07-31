"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

interface SelectorFechaProps {
  /** Fecha en formato ISO "YYYY-MM-DD" */
  value: string;
  onChange: (v: string) => void;
}

const DIAS_SEMANA = ["D", "L", "M", "M", "J", "V", "S"];
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function formatearFecha(iso: string): string {
  if (!iso) return "";
  const [anio, mes, dia] = iso.split("-").map(Number);
  return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${anio}`;
}

function aIso(anio: number, mes: number, dia: number): string {
  return `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export function SelectorFecha({ value, onChange }: SelectorFechaProps) {
  const hoy = new Date();
  const seleccionada = value ? new Date(`${value}T00:00:00`) : null;

  const [mesVisible, setMesVisible] = useState(seleccionada ?? hoy);
  const [abierto, setAbierto] = useState(false);

  const anio = mesVisible.getFullYear();
  const mes = mesVisible.getMonth();

  const primerDiaSemana = new Date(anio, mes, 1).getDay();
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();

  const celdas: (number | null)[] = [
    ...Array(primerDiaSemana).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];

  function seleccionarDia(dia: number) {
    onChange(aIso(anio, mes, dia));
    setAbierto(false);
  }

  function esHoy(dia: number) {
    return hoy.getFullYear() === anio && hoy.getMonth() === mes && hoy.getDate() === dia;
  }

  function esSeleccionado(dia: number) {
    return (
      !!seleccionada &&
      seleccionada.getFullYear() === anio &&
      seleccionada.getMonth() === mes &&
      seleccionada.getDate() === dia
    );
  }

  return (
    <Popover.Root open={abierto} onOpenChange={setAbierto}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none transition-colors hover:border-gray-400"
        >
          {value ? (
            <span className="mr-auto text-gray-700">{formatearFecha(value)}</span>
          ) : (
            <span className="mr-auto text-gray-400">dd/mm/aaaa</span>
          )}
          <CalendarIcon className="ml-2 h-4 w-4 shrink-0 text-gray-400" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-50 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-xl"
        >
          {/* Encabezado: mes/año + navegación */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMesVisible(new Date(anio, mes - 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold capitalize text-gray-900">
              {MESES[mes]} {anio}
            </span>
            <button
              type="button"
              onClick={() => setMesVisible(new Date(anio, mes + 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Días de la semana */}
          <div className="mb-1 grid grid-cols-7 text-center text-xs font-medium text-gray-400">
            {DIAS_SEMANA.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>

          {/* Celdas de días */}
          <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
            {celdas.map((dia, i) => {
              if (dia === null) return <span key={i} />;
              const seleccionado = esSeleccionado(dia);
              const hoyDia = esHoy(dia);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => seleccionarDia(dia)}
                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                    seleccionado ? "font-semibold text-white" : hoyDia ? "font-semibold" : "text-gray-700 hover:bg-gray-100"
                  }`}
                  style={
                    seleccionado
                      ? { backgroundColor: "#611830" }
                      : hoyDia
                        ? { color: "#7B2645" }
                        : undefined
                  }
                >
                  {dia}
                </button>
              );
            })}
          </div>

          {/* Acceso rápido a "Hoy" */}
          <button
            type="button"
            onClick={() => {
              onChange(aIso(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
              setMesVisible(hoy);
              setAbierto(false);
            }}
            className="mt-3 w-full rounded-lg py-2 text-center text-sm font-medium"
            style={{ color: "#7B2645" }}
          >
            Hoy
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
