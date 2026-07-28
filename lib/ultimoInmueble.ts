const CLAVE_ULTIMO_INMUEBLE = "ultimoInmuebleId";

export function guardarUltimoInmueble(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLAVE_ULTIMO_INMUEBLE, id);
}

export function obtenerUltimoInmueble(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CLAVE_ULTIMO_INMUEBLE);
}
