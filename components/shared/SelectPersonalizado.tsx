"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

interface SelectPersonalizadoProps {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  opciones: string[];
  /** "filtro" = fondo blanco con borde (para filtros de tablas). "formulario" = fondo guinda (para formularios). */
  variante?: "filtro" | "formulario";
  className?: string;
}

export function SelectPersonalizado({
  value,
  onChange,
  placeholder,
  opciones,
  variante = "filtro",
  className = "",
}: SelectPersonalizadoProps) {
  const esFormulario = variante === "formulario";

  return (
    <SelectPrimitive.Root value={value || undefined} onValueChange={onChange}>
      <SelectPrimitive.Trigger
        className={`flex w-full items-center justify-between gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm outline-none transition-colors ${
          esFormulario
            ? "text-white"
            : "border border-gray-300 bg-white text-gray-700 hover:border-gray-400"
        } ${className}`}
        style={esFormulario ? { backgroundColor: "#611830" } : undefined}
      >
        <SelectPrimitive.Value
          placeholder={placeholder}
          className="overflow-hidden truncate whitespace-nowrap"
        />
        <SelectPrimitive.Icon>
          {esFormulario ? (
            <span
              className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: "#B53867" }}
            >
              <ChevronDown className="h-4 w-4 text-white" />
            </span>
          ) : (
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-gray-400" />
          )}
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          side="bottom"
          avoidCollisions={false}
          sideOffset={6}
          className="z-50 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
        >
          <SelectPrimitive.Viewport className="p-1.5">
            {opciones.map((op) => (
              <SelectPrimitive.Item
                key={op}
                value={op}
                className="relative mb-0.5 flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 pr-8 text-sm text-gray-700 outline-none transition-colors data-[highlighted]:bg-gray-100 data-[state=checked]:font-semibold data-[state=checked]:text-[#7B2645]"
              >
                <SelectPrimitive.ItemText>{op}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-2.5">
                  <Check className="h-4 w-4" style={{ color: "#7B2645" }} />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
