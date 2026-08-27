"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { obtenerUltimoInmueble } from "@/lib/ultimoInmueble";

export default function ExpedientePage() {
  const router = useRouter();

  useEffect(() => {
    const ultimoId = obtenerUltimoInmueble();
    router.replace(ultimoId ? `/padron-inmuebles/${ultimoId}` : "/padron-inmuebles");
  }, [router]);

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: "#F3F3F3" }}
    >
      <p className="text-sm text-gray-500">Redirigiendo…</p>
    </div>
  );
}
