import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [total, vigentes, enProceso, bajas] = await Promise.all([
    prisma.inmueble.count(),
    prisma.inmueble.count({ where: { estatus: "VIGENTE" } }),
    prisma.inmueble.count({ where: { estatus: "EN_PROCESO" } }),
    prisma.inmueble.count({ where: { estatus: "BAJA" } }),
  ]);

  return NextResponse.json({
    kpis: [
      {
        label: "Total inmuebles",
        value: total,
        statusColor: "bg-emerald-500",
        statusLabel: "Registrados en el padrón",
      },
      {
        label: "Vigentes",
        value: vigentes,
        statusColor: "bg-emerald-500",
        statusLabel: "Estatus vigente",
      },
      {
        label: "En proceso",
        value: enProceso,
        statusColor: "bg-amber-500",
        statusLabel: "En trámite",
      },
      {
        label: "Bajas",
        value: bajas,
        statusColor: "bg-gray-400",
        statusLabel: "Dados de baja",
      },
    ],
    alertas: [],
    resumen: [],
  });
}
