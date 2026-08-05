cat > app/api/padron-inmuebles/route.ts << 'EOF'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 10;

const mapaEstatus: Record<string, "vigente" | "en_proceso" | "baja" | "reclasificacion"> = {
  VIGENTE: "vigente",
  EN_PROCESO: "en_proceso",
  BAJA: "baja",
  RECLASIFICACION: "reclasificacion",
};

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tab = params.get("tab") ?? "todos";
  const page = Number(params.get("page") ?? "1");
  const busqueda = params.get("busqueda") ?? "";
  const region = params.get("region") ?? "";
  const entidad = params.get("entidad") ?? "";
  const tipo = params.get("tipo") ?? "";

  const filtroTab =
    tab === "vigentes"
      ? { estatus: "VIGENTE" as const }
      : tab === "en_proceso"
        ? { estatus: "EN_PROCESO" as const }
        : tab === "bajas"
          ? { estatus: "BAJA" as const }
          : tab === "reclasificacion"
            ? { estatus: "RECLASIFICACION" as const }
            : {};

  const where = {
    ...filtroTab,
    ...(region ? { dirRegional: region } : {}),
    ...(entidad ? { entidadFederativa: entidad } : {}),
    ...(tipo ? { nombre: { contains: tipo, mode: "insensitive" as const } } : {}),
    ...(busqueda
      ? {
          OR: [
            { noControlGbi: { contains: busqueda, mode: "insensitive" as const } },
            { municipio: { contains: busqueda, mode: "insensitive" as const } },
            { direccionCompleta: { contains: busqueda, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total, todos, vigentes, enProceso, bajas, reclasificacion] = await Promise.all([
    prisma.inmueble.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { creadoEn: "desc" },
    }),
    prisma.inmueble.count({ where }),
    prisma.inmueble.count(),
    prisma.inmueble.count({ where: { estatus: "VIGENTE" } }),
    prisma.inmueble.count({ where: { estatus: "EN_PROCESO" } }),
    prisma.inmueble.count({ where: { estatus: "BAJA" } }),
    prisma.inmueble.count({ where: { estatus: "RECLASIFICACION" } }),
  ]);

  return NextResponse.json({
    items: items.map((i) => ({
      noControlGbi: i.noControlGbi,
      consecutivo: i.consecutivo,
      dirRegional: i.dirRegional,
      tipo: i.nombre ?? "",
      entidad: i.entidadFederativa ?? "",
      tipoInmueble: i.tipoInmueble ?? "",
      estatus: mapaEstatus[i.estatus],
    })),
    total,
    totalPaginas: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    conteos: { todos, vigentes, enProceso, bajas, reclasificacion },
  });
}
EOF