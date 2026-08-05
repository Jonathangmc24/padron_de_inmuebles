-- CreateEnum
CREATE TYPE "EstatusInmueble" AS ENUM ('VIGENTE', 'EN_PROCESO', 'BAJA', 'RECLASIFICACION');

-- CreateTable
CREATE TABLE "inmuebles" (
    "id" TEXT NOT NULL,
    "noControlGbi" TEXT NOT NULL,
    "consecutivo" TEXT NOT NULL,
    "dirRegional" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "tipoInmueble" TEXT NOT NULL,
    "estatus" "EstatusInmueble" NOT NULL DEFAULT 'VIGENTE',
    "cuo" TEXT,
    "rfi" TEXT,
    "regimen" TEXT,
    "documentoQueAcredita" TEXT,
    "numDocumento" TEXT,
    "fechaDocumento" TIMESTAMP(3),
    "entidadFederativa" TEXT,
    "municipio" TEXT,
    "tipoNombreVialidad" TEXT,
    "numeroExteriorInterior" TEXT,
    "colonia" TEXT,
    "cpDireccion" TEXT,
    "tipoOcupacionPrincipal" TEXT,
    "m2Terreno" TEXT,
    "m2Construccion" TEXT,
    "estadoFisico" TEXT,
    "ruralSemiurbanoUrbano" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inmuebles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inmuebles_noControlGbi_key" ON "inmuebles"("noControlGbi");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");
