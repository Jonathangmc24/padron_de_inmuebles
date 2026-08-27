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
      fechaDocumento: true,
      vigenciaDocumento: true,
    },
  });

  const total = inmuebles.length;

  // --- KPIs ---
  const regularizados = inmuebles.filter((i) => esSi(i.tieneDocumento) && esSi(i.tieneValorCatastral));
  const montoRegularizados = regularizados.reduce((acc, i) => acc + (i.valorContable ?? 0), 0);

  const enRegula = inmuebles.filter((i) => !esSi(i.tieneDocumento) || !esSi(i.tieneValorCatastral));

  const contratosBase = inmuebles.filter(
    (i) => (i.regimen ?? "").toLowerCase() === "arrendamiento" || (i.regimen ?? "").toLowerCase() === "comodato"
  );

  // --- Contratos (arrendamiento / comodato) ---
  const contratos = contratosBase.map((i) => {
    const esArrendamiento = (i.regimen ?? "").toLowerCase() === "arrendamiento";
    const montoTexto =
      esArrendamiento && i.montoRenta
        ? `Monto ${formatoMonto(i.montoRenta)} MXN/mes`
        : "Sin costo (comodato)";
    const vigenciaTexto = i.vigenciaDocumento ? `Vigencia: ${i.vigenciaDocumento}` : "Vigencia no especificada";

    return {
      titulo: `${i.regimen} - ${i.nombre ?? i.noControlGbi}`,
      detalle: `${i.dirRegional} · ${montoTexto} · ${vigenciaTexto}`,
      estatus: "vigente" as const,
    };
  });

  // --- Seguimiento de regularización ---
  const seguimiento = [
    {
      label: "Inscripción RPPL",
      actual: inmuebles.filter((i) => esSi(i.rppl)).length,
      total,
    },
    {
      label: "Cédula INDAABIN",
      actual: inmuebles.filter((i) => Boolean(i.cedulaInventario)).length,
      total,
    },
    {
      label: "Documento de propiedad en resguardo",
      actual: inmuebles.filter((i) => esSi(i.tieneDocumento)).length,
      total,
    },
    {
      label: "Uso de suelo vigente",
      actual: inmuebles.filter((i) => esSi(i.tieneUsoSuelo)).length,
      total,
    },
  ];

  return NextResponse.json({
    kpis: {
      regularizadosMonto: formatoMonto(montoRegularizados),
      regularizadosDetalle: "Documentación completa",
      enRegulaCantidad: enRegula.length,
      enRegulaDetalle: "Trámite en proceso",
      contratosVigentesCantidad: contratosBase.length,
      contratosVigentesDetalle: "Arrendamiento y comodato",
    },
    contratos,
    seguimiento,
  });
}
