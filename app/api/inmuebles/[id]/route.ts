import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SIN_INFO = "Sin información";

function texto(v: unknown): string {
  if (v === null || v === undefined || v === "") return SIN_INFO;
  return String(v);
}

function numeroFmt(v: number | null | undefined, sufijo = ""): string {
  if (v === null || v === undefined) return SIN_INFO;
  return `${v.toLocaleString("es-MX")}${sufijo}`;
}

function moneda(v: number | null | undefined): string {
  if (v === null || v === undefined) return SIN_INFO;
  return `$${v.toLocaleString("es-MX")} MXN`;
}

function fechaFmt(v: Date | null | undefined): string {
  if (!v) return SIN_INFO;
  return new Date(v).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
}

type EstadoCheck = "si" | "no" | "parcial";

function estadoDesde(v: string | null | undefined): EstadoCheck {
  const t = (v ?? "").toLowerCase().trim();
  if (t === "si" || t === "sí") return "si";
  if (t === "no") return "no";
  return "parcial";
}

function campo(label: string, value: string) {
  return { label, value };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const i = await prisma.inmueble.findUnique({ where: { noControlGbi: id } });

  if (!i) {
    return NextResponse.json({ message: "Inmueble no encontrado" }, { status: 404 });
  }

  const badges = [
    {
      label:
        i.estatus === "VIGENTE"
          ? "Vigente"
          : i.estatus === "EN_PROCESO"
            ? "En proceso"
            : i.estatus === "BAJA"
              ? "Baja"
              : "Reclasificación",
      color:
        i.estatus === "VIGENTE"
          ? ("verde" as const)
          : i.estatus === "EN_PROCESO"
            ? ("naranja" as const)
            : i.estatus === "BAJA"
              ? ("gris" as const)
              : ("purpura" as const),
    },
    ...(i.regimen ? [{ label: `Régimen: ${i.regimen}`, color: "purpura" as const }] : []),
  ];

  return NextResponse.json({
    identidad: {
      noGbi: i.consecutivo,
      titulo: i.nombre ?? i.tipoInmueble ?? "Inmueble sin nombre",
      consecutivo: i.consecutivo,
      cuo: i.cuo ?? SIN_INFO,
      rfi: i.noRfi ?? SIN_INFO,
      direccionRegional: `Dirección Regional ${i.dirRegional}`,
      badges,
    },

    ubicacion: {
      domicilio: [
        campo("Entidad Federativa", texto(i.entidadFederativa)),
        campo("Municipio", texto(i.municipio)),
        campo("Localidad", texto(i.localidad)),
        campo("Tipo de Vialidad", texto(i.tipoVialidad)),
        campo("Nombre de Vialidad", texto(i.nombreVialidad)),
        campo("Numero / Interior", `${texto(i.numero)} - ${texto(i.interior)}`),
        campo("Entre Vialidad y Vialidad", `${texto(i.entreVialidad)} y ${texto(i.yVialidad)}`),
        campo("Tipo de Asentamiento", texto(i.tipoAsentamiento)),
        campo("Colonia", texto(i.colonia)),
        campo("C.P. Dirección", texto(i.cpDireccion)),
        campo("C.P. Administración Postal", texto(i.cpAdministracionPostal)),
        campo("Referencias", texto(i.referencias)),
      ],
      claves: [
        campo("Clave Entidad", texto(i.claveEntidad)),
        campo("Clave de Municipio", texto(i.claveMunicipio)),
        campo("Clave Localidad", texto(i.claveLocalidad)),
        campo("Clave INEGI", texto(i.claveInegi)),
        campo("No. R.I.U.F.", texto(i.noRiuf)),
        campo("Cédula INDAABIN", texto(i.cedulaInventario)),
      ],
    },

    localizacionTecnicos: {
      datosTecnicos: [
        campo("Tipo de Inmueble", texto(i.tipoInmueble)),
        campo("Tipo de Ocupación Principal", texto(i.tipoOcupacionPrincipal)),
        campo("Personal que Ocupa", i.personalQueOcupa != null ? `${i.personalQueOcupa} personas` : SIN_INFO),
        campo("Grado de Aprovechamiento", texto(i.gradoAprovechamiento)),
        campo("M² Terreno", numeroFmt(i.m2Terreno)),
        campo("M² Construcción", numeroFmt(i.m2Construccion)),
        campo("M² Ocupado", numeroFmt(i.m2Ocupado)),
        campo("Estado Físico", texto(i.estadoFisico)),
        campo("Rural / Semiurbano / Urbano", texto(i.zona)),
      ],
      georreferencia: [
        campo("Latitud", i.latitud != null ? String(i.latitud) : SIN_INFO),
        campo("Longitud", i.longitud != null ? String(i.longitud) : SIN_INFO),
        campo("Uso", texto(i.uso)),
      ],
      nota:
        "Los campos de ubicación y localización los captura la GBI; deben conciliarse con el Sistema del INDAABIN ya que no siempre coinciden.",
    },

    condicionesFisicas: {
      situacionGrafica: [
        campo("Número de Cuartos / Oficinas", i.numCuartosOficinas != null ? String(i.numCuartosOficinas) : SIN_INFO),
        campo("Número de Bodegas", i.numBodegas != null ? String(i.numBodegas) : SIN_INFO),
        campo("Número de Sanitarios", i.numSanitarios != null ? String(i.numSanitarios) : SIN_INFO),
        campo("Espacios para Otros Usos", i.numEspaciosOtrosUsos != null ? String(i.numEspaciosOtrosUsos) : SIN_INFO),
      ],
      servicios: [
        { label: "Luz", estado: estadoDesde(i.luz) },
        { label: "Agua potable", estado: estadoDesde(i.aguaPotableHoras), detalle: i.aguaPotableHoras ?? undefined },
        { label: "Drenaje y alcantarillado", estado: estadoDesde(i.drenajeAlcantarillado) },
        { label: "Alumbrado público exterior", estado: estadoDesde(i.alumbradoPublico) },
        { label: "Pavimentación en la calle", estado: estadoDesde(i.pavimentacion) },
        { label: "Teléfono", estado: estadoDesde(i.telefono) },
        { label: "Internet", estado: estadoDesde(i.internet) },
        { label: "Aire acondicionado", estado: estadoDesde(i.aireAcondicionado) },
        { label: "CCTV (videovigilancia)", estado: estadoDesde(i.cctv) },
        { label: "Gas", estado: estadoDesde(i.gas) },
        { label: "Calefacción", estado: estadoDesde(i.calefaccion) },
      ],
    },

    documentosPropiedad: {
      documento: [
        campo("Propietario / Titular", texto(i.propietarioTitular)),
        campo("Documento que Acredita", texto(i.documentoQueAcredita)),
        campo("Núm. de Documento", texto(i.numDocumento)),
        campo("Fecha del Documento", fechaFmt(i.fechaDocumento)),
        campo("Categoría que Acredita su Uso", texto(i.categoriaDocumento)),
        campo("Ubicación del Documento", texto(i.ubicacionDocumento)),
      ],
      inscripcionRegistral: [
        campo("RPPL (Local)", texto(i.rppl)),
        campo("No. Inscripción RPPL", texto(i.noInscripcionRppl)),
        campo("Fecha Inscripción RPPL", fechaFmt(i.fechaInscripcionRppl)),
        campo("RPPF (Federal)", texto(i.rppf)),
        campo("Folio Real RPPF", texto(i.folioRealRppf)),
        campo("Fecha Inscripción RPPF", fechaFmt(i.fechaInscripcionRppf)),
      ],
      resguardo:
        "Los documentos obran (o debieran obrar) en la DCAySP. La GBI conserva copia certificada y simple; en varios casos no se cuenta con el documento.",
    },

    catastroFederal: {
      datos: [
        campo("Cédula Catastral", texto(i.tieneCedulaCatastral)),
        campo("Cuenta / Cédula Catastral", texto(i.cuentaCedulaCatastral)),
        campo("Plano Catastral", texto(i.planoCatastral)),
        campo("Valor Catastral (¿?)", texto(i.tieneValorCatastral)),
        campo("Valor del Terreno", moneda(i.valorTerreno)),
        campo("Valor de la Construcción", moneda(i.valorConstruccion)),
        campo("Valor Catastral Total", moneda(i.valorCatastralTotal)),
        campo("Fecha del Valor Catastral", fechaFmt(i.fechaValorCatastral)),
      ],
      planosDictamenes: [
        { label: "Plano topográfico", estado: estadoDesde(i.planoTopografico) },
        { label: "Plano arquitectónico", estado: estadoDesde(i.planoArquitectonico) },
        { label: "INAH", estado: estadoDesde(i.tieneInah), detalle: i.dictamenInah ?? undefined },
        { label: "INBA", estado: estadoDesde(i.tieneInba), detalle: i.dictamenInba ?? undefined },
        { label: "Catalogado", estado: estadoDesde(i.catalogado) },
        { label: "Dictamen de funcionalidad", estado: estadoDesde(i.dictamenFuncionalidad) },
      ],
    },

    catastroMunicipal: {
      datos: [
        campo("Alineamiento", texto(i.tieneAlineamiento)),
        campo("Constancia de Alineamiento y Núm. Oficial", texto(i.constanciaAlineamiento)),
        campo("Uso de Suelo", texto(i.tieneUsoSuelo)),
        campo("Constancia de Uso de Suelo", texto(i.constanciaUsoSuelo)),
      ],
      conciliacionContable: [
        campo("Valor Contable", moneda(i.valorContable)),
        campo("Avalúo", moneda(i.avaluo)),
        campo("Contabilizado", texto(i.contabilizado)),
      ],
    },

    situacionesEspeciales: {
      usoCompartido: [
        campo("Compartido", texto(i.compartido)),
        campo("Situación Especial de Uso", texto(i.situacionEspecialUso)),
        campo("Útil", texto(i.util)),
        campo("Memoria Fotográfica", texto(i.memoriaFotografica)),
        campo("Categoría", texto(i.categoria)),
      ],
      comentario: i.observaciones2025 ?? i.seguimiento2026 ?? "Sin observaciones registradas.",
    },

    historial: {
      bitacora: [
        i.fechaAlta && { fecha: fechaFmt(i.fechaAlta), evento: "Alta en padrón", autor: "SEPOMEX" },
        i.fechaReclasificacion && {
          fecha: fechaFmt(i.fechaReclasificacion),
          evento: "Reclasificación de tipo de ocupación",
          autor: "GBI",
        },
        i.fechaControl && { fecha: fechaFmt(i.fechaControl), evento: "Actualización de control", autor: "GBI" },
        i.fechaReporte && { fecha: fechaFmt(i.fechaReporte), evento: "Reporte generado", autor: "GBI" },
        i.fechaBaja && { fecha: fechaFmt(i.fechaBaja), evento: "Baja del inmueble", autor: "GBI" },
      ].filter((e): e is { fecha: string; evento: string; autor: string } => Boolean(e)),
      fechasControl: [
        campo("Estatus", texto(i.estatus)),
        campo("Fecha de Reclasificación", fechaFmt(i.fechaReclasificacion)),
        campo("Fecha de Control", fechaFmt(i.fechaControl)),
        campo("Fecha de Reporte", fechaFmt(i.fechaReporte)),
        campo("Fecha de Alta", fechaFmt(i.fechaAlta)),
        campo("Fecha de Baja", fechaFmt(i.fechaBaja)),
      ],
    },
  });
}
