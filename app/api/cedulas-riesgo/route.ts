import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const datos = await request.json();

  if (!datos.inmuebleId || !datos.nivelRiesgo) {
    return NextResponse.json({ message: "Faltan campos obligatorios" }, { status: 400 });
  }

  const cedula = await prisma.cedulaRiesgo.create({
    data: {
      inmuebleId: datos.inmuebleId,
      nivelRiesgo: datos.nivelRiesgo,
      extintoresVigentes: Boolean(datos.extintoresVigentes),
      hidrantesVigentes: Boolean(datos.hidrantesVigentes),
      materialesPeligrosos: Boolean(datos.materialesPeligrosos),
      accesibilidad: Boolean(datos.accesibilidad),
      observaciones: datos.observaciones || null,
    },
  });

  return NextResponse.json(cedula, { status: 201 });
}
