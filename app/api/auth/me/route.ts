import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ nombre: "Jonathan", apellido: "GM" });
}
