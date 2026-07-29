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

// GET - List all favorites for the authenticated user (posts + products)
export async function GET(request) {
  const user = getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    // Fetch post favorites
    const postRows = await sql`
      SELECT post_id, creado_en
      FROM favoritos
      WHERE user_id = ${user.id} AND post_id IS NOT NULL
      ORDER BY creado_en DESC
    `;

    // Fetch product favorites (with product info for the cart drawer)
    const productRows = await sql`
      SELECT
        f.product_id,
        f.creado_en,
        p.nombre AS name,
        p.descripcion AS description,
        p.precio AS price,
        p.imagen_url AS image_url,
        p.stock,
        p.activo
      FROM favoritos f
      LEFT JOIN productos p ON p.id = f.product_id
      WHERE f.user_id = ${user.id} AND f.product_id IS NOT NULL
      ORDER BY f.creado_en DESC
    `;

    return NextResponse.json({
      status: "success",
      // Retrocompatibilidad: array plano de post_ids para FavoriteButton.js
      favorites: postRows.map((r) => r.post_id),
      // Nueva estructura con posts y products separados
      data: {
        posts: postRows,
        products: productRows,
      },
    });
  } catch (err) {
    console.error("[GET /api/favoritos]", err.message || err);
    return NextResponse.json(
      { error: "Error interno del servidor", detail: err.message },
      { status: 500 }
    );
  }
}

// POST - Add a favorite (post OR product)
export async function POST(request) {
  const user = getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { post_id, product_id } = body;

    // Validar que al menos uno venga
    if (!post_id && !product_id) {
      return NextResponse.json(
        { error: "Se requiere post_id o product_id" },
        { status: 400 }
      );
    }

    if (post_id && typeof post_id !== "string") {
      return NextResponse.json(
        { error: "post_id debe ser una cadena" },
        { status: 400 }
      );
    }

    if (product_id && !Number.isInteger(product_id)) {
      return NextResponse.json(
        { error: "product_id debe ser un entero" },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL);

    // Insert with ON CONFLICT to avoid duplicates
    await sql`
      INSERT INTO favoritos (user_id, post_id, product_id, creado_en)
      VALUES (
        ${user.id},
        ${post_id || null},
        ${product_id || null},
        NOW()
      )
      ON CONFLICT DO NOTHING
    `;

    return NextResponse.json({
      status: "success",
      message: "Favorito agregado",
      post_id: post_id || null,
      product_id: product_id || null,
    });
  } catch (err) {
    console.error("[POST /api/favoritos]", err.message || err);
    return NextResponse.json(
      { error: "Error interno del servidor", detail: err.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove a favorite (by post_id OR product_id query param)
export async function DELETE(request) {
  const user = getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const post_id = searchParams.get("post_id");
    const product_id = searchParams.get("product_id");

    if (!post_id && !product_id) {
      return NextResponse.json(
        { error: "Se requiere post_id o product_id como query parameter" },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL);

    if (post_id) {
      await sql`
        DELETE FROM favoritos
        WHERE user_id = ${user.id} AND post_id = ${post_id}
      `;
    }

    if (product_id) {
      const pid = parseInt(product_id, 10);
      if (!Number.isInteger(pid)) {
        return NextResponse.json(
          { error: "product_id debe ser un entero" },
          { status: 400 }
        );
      }
      await sql`
        DELETE FROM favoritos
        WHERE user_id = ${user.id} AND product_id = ${pid}
      `;
    }

    return NextResponse.json({
      status: "success",
      message: "Favorito eliminado",
      post_id: post_id || null,
      product_id: product_id ? parseInt(product_id, 10) : null,
    });
  } catch (err) {
    console.error("[DELETE /api/favoritos]", err.message || err);
    return NextResponse.json(
      { error: "Error interno del servidor", detail: err.message },
      { status: 500 }
    );
  }
}