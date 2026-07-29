import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      SELECT
        id,
        nombre AS name,
        categoria AS category,
        descripcion AS description,
        precio AS price,
        moneda AS currency,
        stock,
        imagen_url AS image_url,
        activo AS active
      FROM productos
      WHERE activo = true
      ORDER BY creado_en ASC
    `;

    // Format the data to match the expected structure by the frontend component.
    // CRÍTICO: stock se devuelve como número (no solo como availability string)
    // para que el carrito pueda limitar cantidades y mostrar "¡Solo quedan X!".
    const products = rows.map(row => {
      const stockNum = parseInt(row.stock, 10) || 0;
      return {
        id: row.id.toString(),
        name: row.name,
        category: row.category,
        description: row.description,
        price: parseFloat(row.price),
        currency: row.currency,
        stock: stockNum,
        availability: stockNum > 0 ? "in_stock" : "out_of_stock",
        image_url: row.image_url,
        buy_url: null,
      };
    });

    return new NextResponse(
      JSON.stringify({
        status: "success",
        source: "productos", // Changed to reflect the endpoint
        result_count: products.length,
        products: products,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (err) {
    console.error("Error fetching products:", err);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch products", details: String(err) },
      { status: 500 }
    );
  }
}