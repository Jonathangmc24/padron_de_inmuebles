import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function esSi(valor: string | null): boolean {
  const t = (valor ?? "").toLowerCase().trim();
  return t === "si" || t === "sí";
}

function formatoMonto(valor: number): string {
  if (valor >= 1_000_000) return `$${(valor / 1_000_000).toFixed(1)}M`;
  if (valor >= 1_000) return `$${(valor / 1_000).toFixed(1)}K`;
  return `$${valor.toLocaleString("es-MX")}`;
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
  const serviciosAlCorriente = inmuebles.filter((i) => esSi(i.luz)).length;
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

  // Mantenimientos reales, capturados desde "Registrar mantenimiento"
  const mantenimientosReales = await prisma.mantenimiento.findMany({
    include: { inmueble: { select: { noControlGbi: true, nombre: true } } },
    orderBy: { fecha: "desc" },
    take: 20,
  });

  const historial = mantenimientosReales.map((m) => ({
    titulo: m.descripcion,
    detalle: `${m.inmueble.nombre ?? m.inmueble.noControlGbi} · ${m.fecha.toLocaleDateString("es-MX")} · ${
      m.tipo === "PREVENTIVO" ? "preventivo" : "correctivo"
    }`,
    monto: m.costo != null ? `$${m.costo.toLocaleString("es-MX")}` : "Sin costo capturado",
  }));

  const inicioAnio = new Date(new Date().getFullYear(), 0, 1);
  const gastoAnioActual = mantenimientosReales
    .filter((m) => m.fecha >= inicioAnio)
    .reduce((acc, m) => acc + (m.costo ?? 0), 0);

  return NextResponse.json({
    kpis: {
      gastoAnualEstimado: gastoAnioActual > 0 ? formatoMonto(gastoAnioActual) : "No disponible",
      gastoAnualDetalle:
        gastoAnioActual > 0 ? "Suma de mantenimientos capturados este año" : "Sin mantenimientos capturados este año",
      serviciosAlCorriente,
      serviciosAlCorrienteDetalle: `De ${total} inmuebles`,
      mantenimientosPendientes,
      mantenimientosPendientesDetalle: "Estado físico distinto de 'Bueno'",
      inmueblesAsegurados: 0,
      inmueblesAseguradosDetalle: "Sin datos de pólizas registrados",
    },
    historial,
    serviciosEstatus,
    programas: ["Programa anual"],
  });
}
