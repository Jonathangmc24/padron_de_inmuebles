/**
 * Importa el Excel del "Padrón de Inmuebles Propios" a la base de datos.
 * Busca cada columna POR NOMBRE (no por posición fija), para ser inmune
 * a desalineaciones causadas por celdas combinadas o filas extra.
 *
 * Uso:
 *   npx tsx scripts/importar-padron.ts "ruta/al/archivo.xlsx"
 */
import * as XLSX from "xlsx";
import { PrismaClient, EstatusInmueble } from "@prisma/client";

const prisma = new PrismaClient();

const MAPA_ESTATUS: Record<string, EstatusInmueble> = {
  vigente: "VIGENTE",
  alta: "EN_PROCESO",
  baja: "BAJA",
  reclas: "RECLASIFICACION",
  reclasificacion: "RECLASIFICACION",
};

function normalizar(s: unknown): string {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos (á->a, ó->o, etc.)
    .replace(/\s+/g, " ")
    .trim();
}

function texto(valor: unknown): string | null {
  if (valor === undefined || valor === null) return null;
  const s = String(valor).trim();
  return s === "" || s.toLowerCase() === "sin información" ? null : s;
}

function num(valor: unknown): number | null {
  if (valor === undefined || valor === null || valor === "") return null;
  const n = typeof valor === "number" ? valor : parseFloat(String(valor).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function entero(valor: unknown): number | null {
  const n = num(valor);
  return n === null ? null : Math.round(n);
}

function fecha(valor: unknown): Date | null {
  if (valor === undefined || valor === null || valor === "") return null;
  let resultado: Date | null = null;

  if (valor instanceof Date) {
    resultado = valor;
  } else {
    const partes = String(valor).trim().split(/[\/\-]/);
    if (partes.length === 3) {
      const [d, m, y] = partes.map((p) => parseInt(p, 10));
      if (y && m && d) resultado = new Date(y < 100 ? 2000 + y : y, m - 1, d);
    }
    if (!resultado) {
      const intento = new Date(String(valor));
      resultado = Number.isNaN(intento.getTime()) ? null : intento;
    }
  }

  if (!resultado) return null;
  const anio = resultado.getFullYear();
  return anio >= 1900 && anio <= 2100 ? resultado : null;
}

// Cada campo tiene una o más "pistas" — substrings normalizados que deben
// aparecer en el encabezado real. Se usa la PRIMERA columna que haga match
// y que no haya sido usada ya por otro campo.
const CAMPOS: Array<{ campo: string; pistas: string[]; tipo?: "num" | "int" | "fecha" }> = [
  { campo: "noControlGbi", pistas: ["no. control de la gbi"] },
  { campo: "consecutivo", pistas: ["consecutivo alfanumerico"] },
  { campo: "dirRegional", pistas: ["direccion regional"] },
  { campo: "cuo", pistas: ["c.u.o."] },
  { campo: "nombre", pistas: ["administracion, sucursal, cor"] },
  { campo: "tieneRfi", pistas: ["r.f.i."] },
  { campo: "noRfi", pistas: ["no. r.f.i."] },
  { campo: "noRiuf", pistas: ["no. r.i.u.f."] },
  { campo: "documentoQueAcreditaInicial", pistas: ["documento comprobatorio que acredita la propiedad"] },
  { campo: "tieneCedula", pistas: ["cuenta con cedula"] },
  { campo: "cedulaInventario", pistas: ["cedula de inventario"] },
  { campo: "entidadFederativa", pistas: ["entidad federativa"] },
  { campo: "claveEntidad", pistas: ["clave entidad"] },
  { campo: "claveLocalidad", pistas: ["clave localidad"] },
  { campo: "localidad", pistas: ["localidad"] },
  { campo: "claveMunicipio", pistas: ["clave municipio"] },
  { campo: "municipio", pistas: ["municipio"] },
  { campo: "tipoVialidad", pistas: ["tipo de vialidad"] },
  { campo: "nombreVialidad", pistas: ["nombre de vialidad"] },
  { campo: "entreVialidad", pistas: ["entre la vialidad"] },
  { campo: "yVialidad", pistas: ["y la vialidad"] },
  { campo: "referencias", pistas: ["referencias"] },
  { campo: "numero", pistas: ["numero"] },
  { campo: "interior", pistas: ["interior"] },
  { campo: "tipoAsentamiento", pistas: ["tipo de asentamiento"] },
  { campo: "colonia", pistas: ["colonia"] },
  { campo: "cpDireccion", pistas: ["c.p. direccion"] },
  { campo: "cpAdministracionPostal", pistas: ["c.p. administracion postal"] },
  { campo: "direccionCompleta", pistas: ["direccion"] },
  { campo: "claveInegi", pistas: ["clave inegi"] },
  { campo: "tipoInmueble", pistas: ["tipo de inmueble"] },
  { campo: "tipoOcupacionPrincipal", pistas: ["tipo de ocupacion principal"] },
  { campo: "personalQueOcupa", pistas: ["numero de personal"], tipo: "int" },
  { campo: "gradoAprovechamiento", pistas: ["grado de aprovechamiento"] },
  { campo: "m2Terreno", pistas: ["m2 terreno"], tipo: "num" },
  { campo: "m2TerrenoManejoPostal", pistas: ["manejo de materia postal"], tipo: "num" },
  { campo: "m2TerrenoEstacionamiento", pistas: ["estacionamiento"], tipo: "num" },
  { campo: "m2Construccion", pistas: ["m2 construccion"], tipo: "num" },
  { campo: "m2ConstruccionAtencionUsuarios", pistas: ["atencion de usuarios"], tipo: "num" },
  { campo: "m2ConstruccionOficinas", pistas: ["oficinas administra"], tipo: "num" },
  { campo: "m2ConstruccionManejoPostal", pistas: ["construccion destinados para el manejo"], tipo: "num" },
  { campo: "m2ConstruccionBodegas", pistas: ["destinados para bodegas"], tipo: "num" },
  { campo: "m2Ocupado", pistas: ["ocupado"], tipo: "num" },
  { campo: "costoAvaluo", pistas: ["costo avaluo"], tipo: "num" },
  { campo: "estadoFisico", pistas: ["estado fisico"] },
  { campo: "latitud", pistas: ["latitud"], tipo: "num" },
  { campo: "longitud", pistas: ["longitud"], tipo: "num" },
  { campo: "zona", pistas: ["rural/semiurbano/urbano"] },
  { campo: "estatusExcel", pistas: ["estatus (vigente"] },
  { campo: "uso", pistas: ["uso"] },
  { campo: "fechaBaja", pistas: ["fecha de baja"], tipo: "fecha" },
  { campo: "fechaAlta", pistas: ["fecha de alta"], tipo: "fecha" },
  { campo: "fechaReclasificacion", pistas: ["fecha", "reclasificacion"], tipo: "fecha" },
  { campo: "fechaControl", pistas: ["fecha de control"], tipo: "fecha" },
  { campo: "fechaReporte", pistas: ["fecha de reporte"], tipo: "fecha" },
  { campo: "regimen", pistas: ["regimen"] },
  { campo: "claveRegimen", pistas: ["clave_regimen"] },
  { campo: "propietarioTitular", pistas: ["nombre del propietario"] },
  { campo: "tieneDocumento", pistas: ["documento (si o no)"] },
  { campo: "documentoQueAcredita", pistas: ["documento comprobatorio que acredita la propiedad"] },
  { campo: "numDocumento", pistas: ["num. de documento"] },
  { campo: "fechaDocumento", pistas: ["fecha del documento"], tipo: "fecha" },
  { campo: "categoriaDocumento", pistas: ["categoria del documento"] },
  { campo: "ubicacionDocumento", pistas: ["ubicacion del documento"] },
  { campo: "vigenciaDocumento", pistas: ["vigencia del documento"] },
  { campo: "noInscripcionRppl", pistas: ["inscripcion en el registro publico de la propiedad local"] },
  { campo: "rppl", pistas: ["rppl (si o no)"] },
  { campo: "fechaInscripcionRppl", pistas: ["fecha de inscripcion rppl"], tipo: "fecha" },
  { campo: "rppf", pistas: ["rppf (si o no)"] },
  { campo: "folioRealRppf", pistas: ["folio real"] },
  { campo: "fechaInscripcionRppf", pistas: ["fecha de inscripcion en el rppf"], tipo: "fecha" },
  { campo: "montoRenta", pistas: ["monto de la renta"], tipo: "num" },
  { campo: "tieneCedulaCatastral", pistas: ["ced catastral"] },
  { campo: "cuentaCedulaCatastral", pistas: ["cuenta y/o cedula catastral"] },
  { campo: "tienePlanoCatastral", pistas: ["plano (si o no)"] },
  { campo: "planoCatastral", pistas: ["plano catastral", "tipo de plano"] },
  { campo: "tieneValorCatastral", pistas: ["vc (si o no)"] },
  { campo: "valorTerreno", pistas: ["valor del terreno"], tipo: "num" },
  { campo: "valorConstruccion", pistas: ["valor de la construccion"], tipo: "num" },
  { campo: "valorCatastralTotal", pistas: ["valor catastral"], tipo: "num" },
  { campo: "fechaValorCatastral", pistas: ["fecha del valor catastral"], tipo: "fecha" },
  { campo: "planoTopografico", pistas: ["plano topografico"] },
  { campo: "planoArquitectonico", pistas: ["plano arquitectonico"] },
  { campo: "tieneInah", pistas: ["inah (si o no)"] },
  { campo: "dictamenInah", pistas: ["dictamen del inah"] },
  { campo: "catalogado", pistas: ["catalogado"] },
  { campo: "tieneInba", pistas: ["inba (si o no)"] },
  { campo: "dictamenInba", pistas: ["dictamen del inba"] },
  { campo: "inahOInba", pistas: ["inah o inba"] },
  { campo: "compartido", pistas: ["compartido"] },
  { campo: "situacionEspecialUso", pistas: ["situacion especial de uso"] },
  { campo: "util", pistas: ["util (si o no)"] },
  { campo: "dictamenFuncionalidad", pistas: ["dictamen de funcionalidad"] },
  { campo: "tieneAlineamiento", pistas: ["alineamiento"] },
  { campo: "constanciaAlineamiento", pistas: ["constancia de alineamiento"] },
  { campo: "tieneUsoSuelo", pistas: ["uso de suelo"] },
  { campo: "constanciaUsoSuelo", pistas: ["constancia de uso de suelo"] },
  { campo: "memoriaFotografica", pistas: ["memoria fotografica"] },
  { campo: "numCuartosOficinas", pistas: ["cuartos u oficinas"], tipo: "int" },
  { campo: "numBodegas", pistas: ["numero de bodegas"], tipo: "int" },
  { campo: "numSanitarios", pistas: ["numero de sanitarios"], tipo: "int" },
  { campo: "numEspaciosOtrosUsos", pistas: ["espacios destinados a otros usos"], tipo: "int" },
  { campo: "alumbradoPublico", pistas: ["alumbrado publico"] },
  { campo: "pavimentacion", pistas: ["pavimentacion"] },
  { campo: "drenajeAlcantarillado", pistas: ["drenaje y alcantarillado"] },
  { campo: "aguaPotableHoras", pistas: ["agua potable en horas"] },
  { campo: "luz", pistas: ["luz"] },
  { campo: "drenaje", pistas: ["drenaje"] },
  { campo: "gas", pistas: ["gas"] },
  { campo: "aireAcondicionado", pistas: ["aire acondicionado"] },
  { campo: "calefaccion", pistas: ["calfaccion", "calefaccion"] },
  { campo: "telefono", pistas: ["telefono"] },
  { campo: "internet", pistas: ["internet"] },
  { campo: "cctv", pistas: ["videovigilancia", "cctv"] },
  { campo: "valorContable", pistas: ["valor contable"], tipo: "num" },
  { campo: "avaluo", pistas: ["avaluo"], tipo: "num" },
  { campo: "observaciones2025", pistas: ["observaciones"] },
  { campo: "seguimiento2026", pistas: ["seguimiento", "comentario"] },
  { campo: "categoria", pistas: ["categoria xxx"] },
  { campo: "estatusInventario", pistas: ["estatus inventario"] },
  { campo: "situacionInmueble", pistas: ["situacion del inmueble"] },
  { campo: "contabilizado", pistas: ["contabilizado"] },
  { campo: "padronEstrategico", pistas: ["padron estrategico", "alta en indaabin"] },
];

async function main() {
  const rutaArchivo = process.argv[2];
  if (!rutaArchivo) {
    console.error('Uso: npx tsx scripts/importar-padron.ts "ruta/al/archivo.xlsx"');
    process.exit(1);
  }

  const libro = XLSX.readFile(rutaArchivo);
  const hoja = libro.Sheets[libro.SheetNames[0]];
  const filas: unknown[][] = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: "" });

  const indicesCandidatos = filas
    .map((fila, i) =>
      typeof fila[0] === "string" && fila[0].trim().startsWith("No. Control de la GBI") ? i : -1
    )
    .filter((i) => i !== -1);

  if (indicesCandidatos.length === 0) {
    console.error("No se encontró la fila de encabezados ('No. Control de la GBI').");
    process.exit(1);
  }

  // Si hay varias filas con ese texto (título repetido arriba + encabezado real
  // justo antes de los datos), la real siempre es la ÚLTIMA de las candidatas.
  const indiceEncabezado = indicesCandidatos[indicesCandidatos.length - 1];

  const encabezadosCrudos = filas[indiceEncabezado] as unknown[];
  const encabezadosNorm = encabezadosCrudos.map(normalizar);

  console.log(`Fila de encabezados detectada: índice ${indiceEncabezado}, ${encabezadosCrudos.length} columnas totales\n`);

  // Resuelve el índice de columna para cada campo, marcando los ya usados
  // para no reutilizar la misma columna en dos campos distintos.
  const usados = new Set<number>();
  const indices: Record<string, number | null> = {};

  for (const { campo, pistas } of CAMPOS) {
    const idx = encabezadosNorm.findIndex(
      (h, i) => !usados.has(i) && pistas.some((p) => h.includes(p))
    );
    indices[campo] = idx === -1 ? null : idx;
    if (idx !== -1) usados.add(idx);
  }

  const noEncontrados = CAMPOS.filter((c) => indices[c.campo] === null).map((c) => c.campo);
  if (noEncontrados.length > 0) {
    console.log("⚠ No se encontró columna para estos campos (quedarán vacíos):");
    noEncontrados.forEach((c) => console.log(`  - ${c}`));
    console.log("");
  }

  const filasDatos = filas
    .slice(indiceEncabezado + 1)
    .filter((f) => texto(f[indices.noControlGbi ?? 0]));

  console.log(`Filas de datos encontradas: ${filasDatos.length}\n`);

  function valor(fila: unknown[], campo: string): unknown {
    const idx = indices[campo];
    return idx === null ? undefined : fila[idx];
  }

  let procesados = 0;

  for (const f of filasDatos) {
    const noControlGbi = texto(valor(f, "noControlGbi"));
    if (!noControlGbi) continue;

    const estatusTexto = (texto(valor(f, "estatusExcel")) ?? "vigente").toLowerCase();
    const estatus = MAPA_ESTATUS[estatusTexto] ?? "VIGENTE";

    const datos: Record<string, unknown> = { estatus };

    for (const { campo, tipo } of CAMPOS) {
      if (campo === "noControlGbi" || campo === "estatusExcel") continue;
      const v = valor(f, campo);
      datos[campo] =
        tipo === "num" ? num(v) : tipo === "int" ? entero(v) : tipo === "fecha" ? fecha(v) : texto(v);
    }

    datos.consecutivo = datos.consecutivo ?? "";
    datos.dirRegional = datos.dirRegional ?? "";

    await prisma.inmueble.upsert({
      where: { noControlGbi },
      create: { noControlGbi, ...datos } as never,
      update: datos as never,
    });

    procesados++;
    console.log(`✓ ${noControlGbi} — ${datos.nombre ?? "(sin nombre)"}`);
  }

  console.log(`\nListo. Procesados ${procesados} inmuebles.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
