import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const datos = await request.json();

  if (!datos.inmuebleId || !datos.tipo) {
    return NextResponse.json({ message: "Faltan campos obligatorios" }, { status: 400 });
  }

  const contrato = await prisma.contrato.create({
    data: {
      inmuebleId: datos.inmuebleId,
      tipo: datos.tipo,
      arrendatario: datos.arrendatario || null,
      montoRenta: datos.montoRenta ? Number(datos.montoRenta) : null,
      fechaInicio: datos.fechaInicio ? new Date(datos.fechaInicio) : null,
      fechaFin: datos.fechaFin ? new Date(datos.fechaFin) : null,
      notas: datos.notas || null,
    },
  });

  return NextResponse.json(contrato, { status: 201 });
}
