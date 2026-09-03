-- CreateEnum
CREATE TYPE "TipoContrato" AS ENUM ('ARRENDAMIENTO', 'COMODATO');

-- CreateEnum
CREATE TYPE "EstatusContrato" AS ENUM ('VIGENTE', 'POR_VENCER', 'VENCIDO');

-- CreateEnum
CREATE TYPE "TipoMantenimiento" AS ENUM ('PREVENTIVO', 'CORRECTIVO');

-- CreateEnum
CREATE TYPE "NivelRiesgo" AS ENUM ('BAJO', 'MEDIO', 'ALTO');

-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL,
    "inmuebleId" TEXT NOT NULL,
    "tipo" "TipoContrato" NOT NULL,
    "arrendatario" TEXT,
    "montoRenta" DOUBLE PRECISION,
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "estatus" "EstatusContrato" NOT NULL DEFAULT 'VIGENTE',
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mantenimientos" (
    "id" TEXT NOT NULL,
    "inmuebleId" TEXT NOT NULL,
    "tipo" "TipoMantenimiento" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "costo" DOUBLE PRECISION,
    "fecha" TIMESTAMP(3) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mantenimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cedulas_riesgo" (
    "id" TEXT NOT NULL,
    "inmuebleId" TEXT NOT NULL,
    "nivelRiesgo" "NivelRiesgo" NOT NULL,
    "extintoresVigentes" BOOLEAN NOT NULL DEFAULT false,
    "hidrantesVigentes" BOOLEAN NOT NULL DEFAULT false,
    "materialesPeligrosos" BOOLEAN NOT NULL DEFAULT false,
    "accesibilidad" BOOLEAN NOT NULL DEFAULT false,
    "observaciones" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cedulas_riesgo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_inmuebleId_fkey" FOREIGN KEY ("inmuebleId") REFERENCES "inmuebles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mantenimientos" ADD CONSTRAINT "mantenimientos_inmuebleId_fkey" FOREIGN KEY ("inmuebleId") REFERENCES "inmuebles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cedulas_riesgo" ADD CONSTRAINT "cedulas_riesgo_inmuebleId_fkey" FOREIGN KEY ("inmuebleId") REFERENCES "inmuebles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
