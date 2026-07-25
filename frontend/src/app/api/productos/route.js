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

    // Format the data to match the expected structure by the frontend component
    const products = rows.map(row => ({
      id: row.id.toString(), // Ensure string ID for consistency with previous mock
      name: row.name,
      category: row.category,
      description: row.description,
      price: parseFloat(row.price), // Ensure number
      currency: row.currency,
      availability: row.stock > 0 ? "in_stock" : "out_of_stock", // Map stock to availability string
      image_url: row.image_url,
      // The previous mock had a buy_url; we can omit it or set to null
      buy_url: null,
    }));

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