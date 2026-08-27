import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const conteo = await prisma.inmueble.groupBy({
    by: ["regimen"],
    _count: true,
  });

  console.log("Valores reales del campo 'regimen' en tu base de datos:\n");
  conteo.forEach((r) => {
    console.log(`  "${r.regimen ?? "(sin valor)"}" → ${r._count} inmuebles`);
  });
}

main()
  .catch((err) => console.error(err))
  .finally(() => prisma.$disconnect());
