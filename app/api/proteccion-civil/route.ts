import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const inmuebles = await prisma.inmueble.findMany({
    select: {
      noControlGbi: true,
      nombre: true,
      municipio: true,
      estadoFisico: true,
    },
  });

  const total = inmuebles.length;
  const riesgoAlto = inmuebles.filter((i) => (i.estadoFisico ?? "").toLowerCase() === "malo").length;

  // Cumplimiento por inmueble: "Seguridad estructural" usa un proxy real
  // (estado físico del inmueble). Extintores/hidrantes y materiales
  // peligrosos NO existen en tu Excel, así que se marcan honestamente
  // como "Sin dato" en vez de inventar un check verde.
  const cumplimiento = inmuebles.slice(0, 20).map((i) => {
    const fisico = (i.estadoFisico ?? "").toLowerCase();
    const seguridadEstructural = fisico === "bueno" ? "apta" : fisico ? "revision" : "sin_dato";

    return {
      inmueble: `${i.noControlGbi} - ${i.municipio ?? i.nombre ?? ""}`,
      seguridadEstructural: seguridadEstructural as "apta" | "revision" | "sin_dato",
      extintoresHidrantes: "sin_dato" as const,
      matPeligrosos: "sin_dato" as const,
    };
  });

  return NextResponse.json({
    kpis: {
      cedulasRiesgo: 0,
      cedulasRiesgoDetalle: "No hay cédulas de riesgo capturadas",
      riesgoAlto,
      riesgoAltoDetalle: "Estado físico: Malo",
      conAccesibilidad: 0,
      conAccesibilidadDetalle: "Dato no capturado en el padrón",
      extintoresVigentes: 0,
      extintoresVigentesDetalle: "Dato no capturado en el padrón",
    },
    cumplimiento,
  });
}
