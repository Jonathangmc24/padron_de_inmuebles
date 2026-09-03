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
      noControlGbi: true,
      nombre: true,
      dirRegional: true,
      regimen: true,
      montoRenta: true,
      tieneDocumento: true,
      tieneValorCatastral: true,
      valorContable: true,
      rppl: true,
      cedulaInventario: true,
      tieneUsoSuelo: true,
    },
  });

  const total = inmuebles.length;

  const regularizados = inmuebles.filter((i) => esSi(i.tieneDocumento) && esSi(i.tieneValorCatastral));
  const montoRegularizados = regularizados.reduce((acc, i) => acc + (i.valorContable ?? 0), 0);
  const enRegula = inmuebles.filter((i) => !esSi(i.tieneDocumento) || !esSi(i.tieneValorCatastral));

  const contratosReales = await prisma.contrato.findMany({
    include: { inmueble: { select: { noControlGbi: true, nombre: true, dirRegional: true } } },
    orderBy: { creadoEn: "desc" },
  });

  const ahora = new Date();
  const en30Dias = new Date();
  en30Dias.setDate(en30Dias.getDate() + 30);

  const contratos = contratosReales.map((c) => {
    let estatus: "vigente" | "por_vencer" | "vencido" = "vigente";
    if (c.fechaFin) {
      if (c.fechaFin < ahora) estatus = "vencido";
      else if (c.fechaFin < en30Dias) estatus = "por_vencer";
    }

    const montoTexto =
      c.tipo === "ARRENDAMIENTO" && c.montoRenta
        ? `Monto ${formatoMonto(c.montoRenta)} MXN/mes`
        : "Sin costo (comodato)";
    const vigenciaTexto = c.fechaFin
      ? `Vence ${c.fechaFin.toLocaleDateString("es-MX")}`
      : "Sin fecha de fin capturada";

    return {
      titulo: `${c.tipo === "ARRENDAMIENTO" ? "Arrendamiento" : "Comodato"} - ${c.inmueble.nombre ?? c.inmueble.noControlGbi}`,
      detalle: `${c.inmueble.dirRegional} · ${montoTexto} · ${vigenciaTexto}`,
      estatus,
    };
  });

  const seguimiento = [
    { label: "Inscripción RPPL", actual: inmuebles.filter((i) => esSi(i.rppl)).length, total },
    { label: "Cédula INDAABIN", actual: inmuebles.filter((i) => Boolean(i.cedulaInventario)).length, total },
    { label: "Documento de propiedad en resguardo", actual: inmuebles.filter((i) => esSi(i.tieneDocumento)).length, total },
    { label: "Uso de suelo vigente", actual: inmuebles.filter((i) => esSi(i.tieneUsoSuelo)).length, total },
  ];

  return NextResponse.json({
    kpis: {
      regularizadosMonto: formatoMonto(montoRegularizados),
      regularizadosDetalle: "Documentación completa",
      enRegulaCantidad: enRegula.length,
      enRegulaDetalle: "Trámite en proceso",
      contratosVigentesCantidad: contratos.filter((c) => c.estatus === "vigente").length,
      contratosVigentesDetalle: "Arrendamiento y comodato",
    },
    contratos,
    seguimiento,
  });
}
