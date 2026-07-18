import { NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export async function GET(request) {
  try {
    const target = `${BACKEND.replace(/\/$/, "")}/api/admin/contactos`;
    const headers = {};
    const auth = request.headers.get("authorization");
    if (auth) headers["authorization"] = auth;

    const res = await fetch(target, { headers });
    const contentType = res.headers.get("content-type") || "application/json";
    const body = await res.text();

    return new NextResponse(body, { status: res.status, headers: { "content-type": contentType } });
  } catch (err) {
    console.error("Error proxying contactos:", err);
    return NextResponse.json({ error: "Error proxying contactos", detail: err.message }, { status: 502 });
  }
}
