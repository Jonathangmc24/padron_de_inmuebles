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

  const riesgoAltoProxy = inmuebles.filter((i) => (i.estadoFisico ?? "").toLowerCase() === "malo").length;

  // Cédulas de riesgo reales, capturadas desde "Nueva cédula de riesgo"
  const cedulas = await prisma.cedulaRiesgo.findMany({
    include: { inmueble: { select: { id: true, noControlGbi: true, nombre: true, municipio: true } } },
    orderBy: { creadoEn: "desc" },
  });

  const riesgoAlto = cedulas.filter((c) => c.nivelRiesgo === "ALTO").length;
  const conAccesibilidad = cedulas.filter((c) => c.accesibilidad).length;
  const extintoresVigentes = cedulas.filter((c) => c.extintoresVigentes).length;

  // Cumplimiento: una fila por cada inmueble que YA tiene cédula real capturada
  const cumplimientoReal = cedulas.map((c) => ({
    inmueble: `${c.inmueble.noControlGbi} - ${c.inmueble.municipio ?? c.inmueble.nombre ?? ""}`,
    seguridadEstructural:
      c.nivelRiesgo === "BAJO" ? ("apta" as const) : c.nivelRiesgo === "MEDIO" ? ("revision" as const) : ("revision" as const),
    extintoresHidrantes: c.extintoresVigentes ? ("vigente" as const) : ("por_vencer" as const),
    matPeligrosos: c.materialesPeligrosos ? ("aplica" as const) : ("no_aplica" as const),
  }));

  // El resto de inmuebles (sin cédula capturada todavía) se muestran honestamente sin dato
  const idsConCedula = new Set(cedulas.map((c) => c.inmueble.id));
  const sinCedula = await prisma.inmueble.findMany({
    where: { id: { notIn: Array.from(idsConCedula) } },
    select: { noControlGbi: true, nombre: true, municipio: true, estadoFisico: true },
    take: 20,
  });

  const cumplimientoSinDato = sinCedula.map((i) => {
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
      cedulasRiesgo: cedulas.length,
      cedulasRiesgoDetalle: cedulas.length > 0 ? "Capturadas en el sistema" : "No hay cédulas capturadas",
      riesgoAlto: cedulas.length > 0 ? riesgoAlto : riesgoAltoProxy,
      riesgoAltoDetalle: cedulas.length > 0 ? "Nivel de riesgo alto" : "Estado físico: Malo (proxy, sin cédula capturada)",
      conAccesibilidad,
      conAccesibilidadDetalle: cedulas.length > 0 ? "Con accesibilidad confirmada" : "Dato no capturado en el padrón",
      extintoresVigentes,
      extintoresVigentesDetalle: cedulas.length > 0 ? "Con extintores vigentes" : "Dato no capturado en el padrón",
    },
    cumplimiento: [...cumplimientoReal, ...cumplimientoSinDato],
  });
}
