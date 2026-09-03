import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const datos = await request.json();

  if (!datos.inmuebleId || !datos.tipo || !datos.descripcion || !datos.fecha) {
    return NextResponse.json({ message: "Faltan campos obligatorios" }, { status: 400 });
  }

  const mantenimiento = await prisma.mantenimiento.create({
    data: {
      inmuebleId: datos.inmuebleId,
      tipo: datos.tipo,
      descripcion: datos.descripcion,
      costo: datos.costo ? Number(datos.costo) : null,
      fecha: new Date(datos.fecha),
    },
  });

  return NextResponse.json(mantenimiento, { status: 201 });
}
