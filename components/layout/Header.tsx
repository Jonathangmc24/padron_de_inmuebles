"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Rutas del menú de navegación — ajustar a las rutas reales del proyecto
const navGroups = [
  {
    label: "PRINCIPAL",
    items: [
      { label: "Panel de inicio", href: "/" },
      { label: "Padron de inmuebles", href: "/padron-inmuebles" },
      { label: "Expediente", href: "/expediente" },
    ],
  },
  {
    label: "GESTIÓN",
    items: [
      { label: "Jurídico y regularización", href: "/juridico-regularizacion" },
      { label: "Mantenimiento y gastos", href: "/mantenimiento-gastos" },
      { label: "Protección civil y riesgos", href: "/proteccion-civil" },
      { label: "Información financiera", href: "/informacion-financiera" },
    ],
  },
];

const capturaAction = { label: "+ Alta de inmueble", href: "/inmuebles/nuevo" };

interface HeaderProps {
  title: string;
  /** Ya no se muestra en el header, se deja por compatibilidad con las pantallas que lo pasan */
  iniciales?: string;
}

export function Header({ title }: HeaderProps) {
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <header
      className="relative flex items-center justify-between px-4 py-5 sm:px-6 sm:py-6"
      style={{ backgroundColor: "#611830" }}
    >
      {menuAbierto && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={() => setMenuAbierto(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex items-center gap-2">
        <div className="relative h-11 w-25 shrink-0 sm:overflow-hidden sm:rounded-full">
          {/* Coloca tu archivo en /public (ej. /public/logo-favicon.png) y ajusta el src */}
          <Image
            src="/logo_gob_mx.png"
            alt="Gobierno de México"
            fill
            sizes="44px"
            className="object-contain"
          />
        </div>
        <span className="hidden text-sm font-medium text-white sm:inline">
          Gobierno de <strong>México</strong>
        </span>
      </div>

      <h1 className="absolute left-1/2 max-w-[55vw] -translate-x-1/2 truncate px-2 text-sm font-semibold text-white sm:max-w-none sm:text-base lg:text-lg">
        {title}
      </h1>

      <div className="relative z-50 flex items-center gap-4">
        <DropdownMenu open={menuAbierto} onOpenChange={setMenuAbierto}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Abrir menú de navegación"
              className="text-white/90 transition hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={10}
            className="z-50 w-72 max-w-[85vw] rounded-2xl border-none p-3 shadow-2xl"
            style={{ backgroundColor: "#6B1535" }}
          >
            {navGroups.map((group, gi) => (
              <div key={group.label} className={gi > 0 ? "mt-4" : ""}>
                <p
                  className="px-3 pb-1.5 text-[11px] font-bold tracking-wider"
                  style={{ color: "#E1B9C7" }}
                >
                  {group.label}
                </p>
                {group.items.map((item) => {
                  const activo = pathname === item.href;
                  return (
                    <DropdownMenuItem
                      key={item.href}
                      asChild
                      className="mb-0.5 cursor-pointer rounded-lg p-0 focus:bg-transparent"
                    >
                      <a
                        href={item.href}
                        className="block rounded-lg px-3 py-2.5 text-sm transition-colors"
                        style={
                          activo
                            ? { backgroundColor: "#EEE4E7", color: "#7B2645", fontWeight: 600 }
                            : { color: "#FFFFFF" }
                        }
                      >
                        {item.label}
                      </a>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            ))}

            <div className="mt-4">
              <p
                className="px-3 pb-2 text-[11px] font-bold tracking-wider"
                style={{ color: "#E1B9C7" }}
              >
                CAPTURA
              </p>
              <DropdownMenuItem asChild className="cursor-pointer rounded-full p-0 focus:bg-transparent">
                <a
                  href={capturaAction.href}
                  className="block rounded-full px-4 py-2.5 text-center text-sm font-semibold"
                  style={{ backgroundColor: "#E1D0D7", color: "#6B1535" }}
                >
                  {capturaAction.label}
                </a>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
