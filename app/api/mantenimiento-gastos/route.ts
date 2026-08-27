import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function esSi(valor: string | null): boolean {
  const t = (valor ?? "").toLowerCase().trim();
  return t === "si" || t === "sí";
}

export async function GET() {
  const inmuebles = await prisma.inmueble.findMany({
    select: {
      estadoFisico: true,
      luz: true,
      aguaPotableHoras: true,
      drenajeAlcantarillado: true,
      gas: true,
      aireAcondicionado: true,
      calefaccion: true,
      telefono: true,
      internet: true,
      cctv: true,
      alumbradoPublico: true,
      pavimentacion: true,
    },
  });

  const total = inmuebles.length;

  // "Servicios al corriente" = inmuebles con luz activa (dato real de tu Excel)
  const serviciosAlCorriente = inmuebles.filter((i) => esSi(i.luz)).length;

  // "Mantenimientos pendientes" = proxy real: inmuebles cuyo estado físico
  // NO es "Bueno" (no existe un log de mantenimientos realizados en tu Excel)
  const mantenimientosPendientes = inmuebles.filter(
    (i) => i.estadoFisico && i.estadoFisico.toLowerCase() !== "bueno"
  ).length;

  function contarSi(campo: keyof (typeof inmuebles)[number]) {
    return inmuebles.filter((i) => esSi(i[campo] as string | null)).length;
  }

  const serviciosEstatus = [
    { titulo: "Energía eléctrica", campo: "luz" as const },
    { titulo: "Agua potable", campo: "aguaPotableHoras" as const },
    { titulo: "Drenaje y alcantarillado", campo: "drenajeAlcantarillado" as const },
    { titulo: "Alumbrado público", campo: "alumbradoPublico" as const },
    { titulo: "Pavimentación", campo: "pavimentacion" as const },
    { titulo: "Gas", campo: "gas" as const },
    { titulo: "Aire acondicionado", campo: "aireAcondicionado" as const },
    { titulo: "Calefacción", campo: "calefaccion" as const },
    { titulo: "Teléfono", campo: "telefono" as const },
    { titulo: "Internet", campo: "internet" as const },
    { titulo: "CCTV", campo: "cctv" as const },
  ].map(({ titulo, campo }) => {
    const conServicio = contarSi(campo);
    return {
      titulo,
      detalle: `${conServicio} de ${total} inmuebles`,
      estado: conServicio === total ? ("al_corriente" as const) : ("atencion" as const),
    };
  });

  return NextResponse.json({
    kpis: {
      // No existe un campo de presupuesto/gasto de mantenimiento en tu Excel —
      // se deja en 0 en vez de inventar una cifra.
      gastoAnualEstimado: "No disponible",
      gastoAnualDetalle: "Sin presupuesto capturado en el padrón",
      serviciosAlCorriente,
      serviciosAlCorrienteDetalle: `De ${total} inmuebles`,
      mantenimientosPendientes,
      mantenimientosPendientesDetalle: "Estado físico distinto de 'Bueno'",
      inmueblesAsegurados: 0,
      inmueblesAseguradosDetalle: "Sin datos de pólizas registrados",
    },
    // No existe una bitácora de mantenimientos realizados en tu Excel todavía
    historial: [],
    serviciosEstatus,
    programas: ["Programa anual"],
  });
}
