import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const mapaEstatus: Record<string, "vigente" | "en_proceso" | "baja" | "reclasificacion"> = {
  VIGENTE: "vigente",
  EN_PROCESO: "en_proceso",
  BAJA: "baja",
  RECLASIFICACION: "reclasificacion",
};

export async function GET() {
  const [total, vigentes, enProceso, bajas, inmuebles] = await Promise.all([
    prisma.inmueble.count(),
    prisma.inmueble.count({ where: { estatus: "VIGENTE" } }),
    prisma.inmueble.count({ where: { estatus: "EN_PROCESO" } }),
    prisma.inmueble.count({ where: { estatus: "BAJA" } }),
    prisma.inmueble.findMany({
      select: {
        noControlGbi: true,
        nombre: true,
        latitud: true,
        longitud: true,
        estatus: true,
        regimen: true,
        montoRenta: true,
        tieneDocumento: true,
        tieneValorCatastral: true,
        cedulaInventario: true,
      },
    }),
  ]);

  const ubicaciones = inmuebles
    .filter((i) => i.latitud != null && i.longitud != null)
    .map((i) => ({
      noControlGbi: i.noControlGbi,
      nombre: i.nombre ?? i.noControlGbi,
      latitud: i.latitud as number,
      longitud: i.longitud as number,
      estatus: mapaEstatus[i.estatus] ?? "vigente",
    }));

  const arrendamientos = inmuebles.filter((i) => (i.regimen ?? "").toLowerCase() === "arrendamiento");
  const sinDocumento = inmuebles.filter((i) => (i.tieneDocumento ?? "").toLowerCase() === "no");
  const sinValorCatastral = inmuebles.filter(
    (i) => (i.tieneValorCatastral ?? "").toLowerCase() === "no"
  );
  const sinCedulaInventario = inmuebles.filter((i) => !i.cedulaInventario);

  const alertas = [
    arrendamientos.length > 0 && {
      titulo: "Inmuebles en arrendamiento",
      detalle: `${arrendamientos.length} inmuebles con régimen de arrendamiento`,
      accion: "Revisar vigencia de contratos",
    },
    sinDocumento.length > 0 && {
      titulo: "Sin documento de propiedad",
      detalle: `${sinDocumento.length} inmuebles sin documento que acredite la propiedad`,
      accion: "Regularización pendiente",
    },
    sinValorCatastral.length > 0 && {
      titulo: "Sin valor catastral",
      detalle: `${sinValorCatastral.length} inmuebles sin valor catastral registrado`,
      accion: "Actualizar catastro",
    },
    sinCedulaInventario.length > 0 && {
      titulo: "Sin cédula de inventario",
      detalle: `${sinCedulaInventario.length} inmuebles sin cédula INDAABIN`,
      accion: "Trámite pendiente",
    },
  ].filter((a): a is { titulo: string; detalle: string; accion: string } => Boolean(a));

  return NextResponse.json({
    kpis: [
      { label: "Total inmuebles", value: total, statusColor: "bg-emerald-500", statusLabel: "Registrados en el padrón" },
      { label: "Vigentes", value: vigentes, statusColor: "bg-emerald-500", statusLabel: "Estatus vigente" },
      { label: "En proceso", value: enProceso, statusColor: "bg-amber-500", statusLabel: "En trámite" },
      { label: "Bajas", value: bajas, statusColor: "bg-gray-400", statusLabel: "Dados de baja" },
    ],
    alertas,
    resumen: [],
    ubicaciones,
  });
}
