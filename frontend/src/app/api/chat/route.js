import { NextResponse } from "next/server";

export async function POST(request) {
  const { message } = await request.json();
  const reply = `Gracias por tu mensaje: "${message}". Nuestro equipo editorial responderá lo antes posible.`;
  return NextResponse.json({ reply });
}
