import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getUserFromToken(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "noir_atelier_secret_2025");
  } catch {
    return null;
  }
}

// GET - List all favorites for the authenticated user
export async function GET(request) {
  const user = getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      SELECT post_id, creado_en
      FROM favoritos
      WHERE user_id = ${user.id}
      ORDER BY creado_en DESC
    `;

    return NextResponse.json({
      status: "success",
      favorites: rows.map(r => r.post_id),
      data: rows,
    });
  } catch (err) {
    console.error("[GET /api/favoritos]", err.message || err);
    return NextResponse.json(
      { error: "Error interno del servidor", detail: err.message },
      { status: 500 }
    );
  }
}

// POST - Add a favorite
export async function POST(request) {
  const user = getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { post_id } = await request.json();
    if (!post_id || typeof post_id !== "string") {
      return NextResponse.json(
        { error: "post_id es requerido y debe ser una cadena" },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL);
    // Insert with ON CONFLICT to avoid duplicates
    await sql`
      INSERT INTO favoritos (user_id, post_id, creado_en)
      VALUES (${user.id}, ${post_id}, NOW())
      ON CONFLICT (user_id, post_id) DO NOTHING
    `;

    return NextResponse.json({
      status: "success",
      message: "Favorito agregado",
      post_id,
    });
  } catch (err) {
    console.error("[POST /api/favoritos]", err.message || err);
    return NextResponse.json(
      { error: "Error interno del servidor", detail: err.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove a favorite
export async function DELETE(request) {
  const user = getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const post_id = searchParams.get("post_id");
    if (!post_id) {
      return NextResponse.json(
        { error: "post_id es requerido como query parameter" },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL);
    await sql`
      DELETE FROM favoritos
      WHERE user_id = ${user.id} AND post_id = ${post_id}
    `;

    return NextResponse.json({
      status: "success",
      message: "Favorito eliminado",
      post_id,
    });
  } catch (err) {
    console.error("[DELETE /api/favoritos]", err.message || err);
    return NextResponse.json(
      { error: "Error interno del servidor", detail: err.message },
      { status: 500 }
    );
  }
}