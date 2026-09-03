import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const inmuebles = await prisma.inmueble.findMany({
    select: { id: true, noControlGbi: true, nombre: true },
    orderBy: { noControlGbi: "asc" },
  });

  return NextResponse.json(
    inmuebles.map((i) => ({
      id: i.id,
      etiqueta: `${i.noControlGbi} - ${i.nombre ?? "Sin nombre"}`,
    }))
  );
}
