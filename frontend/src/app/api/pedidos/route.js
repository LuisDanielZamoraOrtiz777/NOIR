import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// UUID v4 regex (acepta también v1-v5 para flexibilidad)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request) {
  try {
    const sql = neon(process.env.DATABASE_URL);

    // Parse and validate request body
    const body = await request.json();
    const {
      cliente_nombre,
      cliente_telefono,
      cliente_email,
      items, // array of { producto_id, cantidad } or { product_id, quantity }
      client_request_id, // UUID v4 para idempotencia
    } = body;

    // Idempotencia: si recibimos X-Client-Request-Id o client_request_id,
    // y ya existe un pedido reciente con ese id, devolvemos el existente.
    const headerRequestId = request.headers.get("X-Client-Request-Id");
    const requestId = (headerRequestId || client_request_id || "").trim();

    if (requestId) {
      if (!UUID_REGEX.test(requestId)) {
        return NextResponse.json(
          { error: "client_request_id debe ser un UUID válido" },
          { status: 400 }
        );
      }

      // Buscar pedido existente con este request_id en los últimos 30 minutos
      // (la tabla pedidos no tiene la columna client_request_id todavía, así que
      // usamos cliente_telefono + total + cliente_nombre como heurística de fallback.
      // Cuando se migre la DB, cambiar a: WHERE client_request_id = ${requestId})
      try {
        const recent = await sql`
          SELECT id, total, creado_en
          FROM pedidos
          WHERE cliente_telefono = ${cliente_telefono}
            AND creado_en > NOW() - INTERVAL '30 minutes'
          ORDER BY creado_en DESC
          LIMIT 1
        `;

        // Si el pedido más reciente del mismo teléfono fue hace <2 minutos y tiene
        // un total similar, probablemente es un retry del mismo submit
        if (recent.length > 0) {
          const diff = Date.now() - new Date(recent[0].creado_en).getTime();
          if (diff < 120_000) {
            // < 2 minutos → probable retry, devolvemos el existente
            return NextResponse.json(
              {
                success: true,
                order_id: recent[0].id,
                total: parseFloat(recent[0].total),
                message: "Pedido ya procesado (idempotente)",
                idempotent: true,
              },
              { status: 200 }
            );
          }
        }
      } catch (idemErr) {
        // Si la búsqueda falla, seguimos con la creación normal
        console.warn("Idempotencia check failed (continuing):", idemErr.message);
      }
    }

    // Basic validation
    if (!cliente_nombre || typeof cliente_nombre !== "string" || cliente_nombre.trim() === "") {
      return NextResponse.json(
        { error: "El nombre del cliente es requerido y debe ser una cadena no vacía" },
        { status: 400 }
      );
    }

    if (!cliente_telefono || typeof cliente_telefono !== "string" || !/^\+?[\d\s\-]+$/.test(cliente_telefono)) {
      return NextResponse.json(
        { error: "El teléfono del cliente es requerido y debe ser un número válido" },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Se debe proporcionar al menos un producto en el pedido" },
        { status: 400 }
      );
    }

    // Validate each item and fetch product details from DB
    const validatedItems = [];
    let total = 0;

    for (const item of items) {
      // Support both Spanish (producto_id/cantidad) and English (product_id/quantity) field names
      const producto_id = item.producto_id ?? item.product_id;
      const cantidad = item.cantidad ?? item.quantity;

      if (!producto_id) {
        return NextResponse.json(
          { error: "Cada artículo debe tener un ID de producto válido" },
          { status: 400 }
        );
      }

      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        return NextResponse.json(
          { error: `La cantidad para el producto ${producto_id} debe ser un entero positivo` },
          { status: 400 }
        );
      }

      // Fetch product from database
      const productResult = await sql`
        SELECT id, nombre, precio, stock, activo
        FROM productos
        WHERE id = ${producto_id}
      `;

      if (productResult.length === 0) {
        return NextResponse.json(
          { error: `El producto con ID ${producto_id} no existe` },
          { status: 400 }
        );
      }

      const product = productResult[0];

      if (!product.activo) {
        return NextResponse.json(
          { error: `El producto ${product.nombre} no está disponible` },
          { status: 400 }
        );
      }

      if (product.stock < cantidad) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${product.nombre}. Disponible: ${product.stock}, solicitado: ${cantidad}` },
          { status: 400 }
        );
      }

      // Calculate subtotal
      const unitPrice = parseFloat(product.precio);
      const subtotal = unitPrice * cantidad;
      total += subtotal;

      validatedItems.push({
        product_id: product.id,
        product_name: product.nombre,
        unit_price: unitPrice,
        quantity: cantidad,
        subtotal: parseFloat(subtotal.toFixed(2)), // Ensure two decimal places
      });
    }

    // Ensure total is rounded to two decimal places
    total = parseFloat(total.toFixed(2));

    // Insert order and order items
    // Note: Schema uses Spanish column names (cliente_nombre, cliente_telefono, etc.)
    let orderId;
    let insertedItemIds = [];

    try {
      // Insert order using Spanish column names matching the schema
      const orderResult = await sql`
        INSERT INTO pedidos (
          cliente_nombre, cliente_telefono, cliente_email, total, estado, canal, notas, creado_en
        )
        VALUES (
          ${cliente_nombre.trim()},
          ${cliente_telefono.trim()},
          ${cliente_email ? cliente_email.trim() : null},
          ${total},
          'pendiente',
          'whatsapp',
          ${body.notas || null},
          NOW()
        )
        RETURNING id
      `;

      orderId = orderResult[0].id;

      // Insert order items using Spanish column names matching the schema
      for (const item of validatedItems) {
        const itemResult = await sql`
          INSERT INTO pedido_items (
            pedido_id, producto_id, nombre_producto, precio_unitario, cantidad, subtotal
          )
          VALUES (
            ${orderId},
            ${item.product_id},
            ${item.product_name},
            ${item.unit_price},
            ${item.quantity},
            ${item.subtotal}
          )
          RETURNING id
        `;
        insertedItemIds.push(itemResult[0].id);
      }

      return NextResponse.json(
        {
          success: true,
          order_id: orderId,
          total: total,
          message: "Pedido creado exitosamente",
          client_request_id: requestId || null,
        },
        { status: 201 }
      );
    } catch (error) {
      // If we have an order ID, try to clean up
      if (orderId) {
        // Delete any order items that might have been inserted
        if (insertedItemIds.length > 0) {
          try {
            await sql`
              DELETE FROM pedido_items
              WHERE id = ANY(${insertedItemIds})
            `;
          } catch (cleanupError) {
            console.error("Error cleaning up order items:", cleanupError);
          }
        }
        // Delete the order
        try {
          await sql`
            DELETE FROM pedidos
            WHERE id = ${orderId}
          `;
        } catch (cleanupError) {
          console.error("Error cleaning up order:", cleanupError);
        }
      }

      console.error("Error creating order:", error);
      return NextResponse.json(
        { error: "Error al crear el pedido", details: String(error) },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Unexpected error in POST /api/pedidos:", err);
    return NextResponse.json(
      { error: "Error interno del servidor", details: String(err) },
      { status: 500 }
    );
  }
}