import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function formatoMonto(valor: number): string {
  if (valor >= 1_000_000) return `$${(valor / 1_000_000).toFixed(1)}M`;
  if (valor >= 1_000) return `$${(valor / 1_000).toFixed(1)}K`;
  return `$${valor.toLocaleString("es-MX")}`;
}

function formatoMontoCompleto(valor: number | null): string {
  if (valor == null) return "Sin dato";
  return `$${valor.toLocaleString("es-MX")} MXN`;
}

export async function GET() {
  const inmuebles = await prisma.inmueble.findMany({
    select: {
      noControlGbi: true,
      nombre: true,
      valorContable: true,
      avaluo: true,
      valorTerreno: true,
      valorConstruccion: true,
      fechaValorCatastral: true,
    },
  });

  const valorContableTotal = inmuebles.reduce((acc, i) => acc + (i.valorContable ?? 0), 0);
  const avaluoTotal = inmuebles.reduce((acc, i) => acc + (i.avaluo ?? 0), 0);

  const hace12Meses = new Date();
  hace12Meses.setFullYear(hace12Meses.getFullYear() - 1);

  const avaluosPorActualizar = inmuebles.filter(
    (i) => !i.fechaValorCatastral || i.fechaValorCatastral < hace12Meses
  ).length;

  const valoresPorInmueble = inmuebles.map((i) => ({
    noControlGbi: i.noControlGbi,
    inmueble: i.nombre ?? i.noControlGbi,
    valorTerreno: formatoMontoCompleto(i.valorTerreno),
    valorConstruccion: formatoMontoCompleto(i.valorConstruccion),
  }));

  return NextResponse.json({
    kpis: {
      valorContableTotal: formatoMonto(valorContableTotal),
      valorContableDetalle: "MXN - Avalúos propios",
      avaluoTotal: formatoMonto(avaluoTotal),
      avaluoTotalDetalle: "MXN - Valor de mercado",
      avaluosPorActualizar,
      avaluosPorActualizarDetalle: "Mayores a 12 meses",
    },
    valoresPorInmueble,
  });
}
