import { NextResponse } from "next/server";
import { getClient } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * POST /api/pedidos
 *
 * Crea un pedido + sus items + descuenta el stock de cada producto, todo en una
 * sola transacción Postgres. Garantías:
 *
 *   1. Idempotencia real: si el cliente reintenta con el mismo `client_request_id`
 *      (UUID v4 generado por el frontend), devolvemos el mismo `order_id` sin
 *      crear un duplicado. Patrón equivalente a `Idempotency-Key` de Stripe.
 *
 *   2. Atomicidad de stock: el `UPDATE productos SET stock = stock - N` corre
 *      DENTRO de la transacción que crea el pedido. Si cualquier paso falla,
 *      `ROLLBACK` revierte el descuento de stock automáticamente.
 *
 *   3. Anti-carrera: `SELECT ... FOR UPDATE` sobre cada fila de producto bloquea
 *      hasta el COMMIT, evitando que dos compras simultáneas se lleven la misma
 *      última unidad.
 *
 *   4. Mensajes de error específicos: cada 4xx lleva en el body un `error` que
 *      el frontend puede mostrar tal cual (no mensajes genéricos).
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE_REGEX = /^\+?[\d\s-]{7,20}$/;

export async function POST(request) {
  let client;
  try {
    const body = await request.json();
    const {
      cliente_nombre,
      cliente_telefono,
      cliente_email,
      items,
      notas,
    } = body;
    const headerRequestId = request.headers.get("X-Client-Request-Id");
    const requestId = (headerRequestId || body.client_request_id || "").trim();

    // ── Validaciones tempranas (no requieren DB) ──────────────────────────
    if (requestId && !UUID_REGEX.test(requestId)) {
      return NextResponse.json(
        { error: "client_request_id debe ser un UUID válido" },
        { status: 400 }
      );
    }
    if (!cliente_nombre || typeof cliente_nombre !== "string" || !cliente_nombre.trim()) {
      return NextResponse.json(
        { error: "El nombre del cliente es requerido" },
        { status: 400 }
      );
    }
    if (
      !cliente_telefono ||
      typeof cliente_telefono !== "string" ||
      !PHONE_REGEX.test(cliente_telefono.trim())
    ) {
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

    client = await getClient();

    // ── Idempotencia: si el request_id ya existe, devolvemos el pedido previo ──
    if (requestId) {
      const existing = await client.query(
        "SELECT id, total FROM pedidos WHERE client_request_id = $1",
        [requestId]
      );
      if (existing.rows.length > 0) {
        return NextResponse.json(
          {
            success: true,
            order_id: existing.rows[0].id,
            total: parseFloat(existing.rows[0].total),
            message: "Pedido ya procesado (idempotente)",
            idempotent: true,
            client_request_id: requestId,
          },
          { status: 200 }
        );
      }
    }

    // ── Transacción: validar + descontar stock + insertar pedido + insertar items ──
    await client.query("BEGIN");
    let total = 0;
    const validatedItems = [];

    for (const item of items) {
      const producto_id = item.producto_id ?? item.product_id;
      const cantidad = item.cantidad ?? item.quantity;

      if (!producto_id || !Number.isInteger(cantidad) || cantidad <= 0) {
        throw {
          httpStatus: 400,
          message: "Cada artículo debe tener un ID de producto y una cantidad entera positiva",
        };
      }

      // FOR UPDATE bloquea la fila hasta COMMIT/ROLLBACK. Segunda compra concurrente
      // sobre el mismo producto espera aquí.
      const productResult = await client.query(
        "SELECT id, nombre, precio, stock, activo FROM productos WHERE id = $1 FOR UPDATE",
        [producto_id]
      );
      if (productResult.rows.length === 0) {
        throw {
          httpStatus: 400,
          message: `El producto con ID ${producto_id} no existe`,
        };
      }
      const product = productResult.rows[0];
      if (!product.activo) {
        throw {
          httpStatus: 400,
          message: `El producto "${product.nombre}" ya no está disponible`,
        };
      }
      if (product.stock < cantidad) {
        throw {
          httpStatus: 409,
          message: `Stock insuficiente para "${product.nombre}". Disponible: ${product.stock}, solicitado: ${cantidad}`,
        };
      }

      const unitPrice = parseFloat(product.precio);
      const subtotal = parseFloat((unitPrice * cantidad).toFixed(2));
      total += subtotal;
      validatedItems.push({
        product_id: product.id,
        product_name: product.nombre,
        unit_price: unitPrice,
        quantity: cantidad,
        subtotal,
      });
    }
    total = parseFloat(total.toFixed(2));

    // INSERT pedido (con client_request_id para idempotencia)
    const orderResult = await client.query(
      `INSERT INTO pedidos
         (cliente_nombre, cliente_telefono, cliente_email, total, estado, canal, notas, client_request_id, creado_en)
       VALUES ($1, $2, $3, $4, 'pendiente', 'whatsapp', $5, $6, NOW())
       RETURNING id`,
      [
        cliente_nombre.trim(),
        cliente_telefono.trim(),
        cliente_email?.trim() || null,
        total,
        notas?.trim() || null,
        requestId || null,
      ]
    );
    const orderId = orderResult.rows[0].id;

    // INSERT items + UPDATE stock (todo dentro de la misma transacción)
    for (const item of validatedItems) {
      await client.query(
        `INSERT INTO pedido_items
           (pedido_id, producto_id, nombre_producto, precio_unitario, cantidad, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          orderId,
          item.product_id,
          item.product_name,
          item.unit_price,
          item.quantity,
          item.subtotal,
        ]
      );
      await client.query(
        "UPDATE productos SET stock = stock - $1 WHERE id = $2",
        [item.quantity, item.product_id]
      );
    }

    await client.query("COMMIT");

    return NextResponse.json(
      {
        success: true,
        order_id: orderId,
        total,
        message: "Pedido creado exitosamente",
        client_request_id: requestId || null,
      },
      { status: 201 }
    );
  } catch (err) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackErr) {
        console.error("[POST /api/pedidos] ROLLBACK failed:", rollbackErr);
      }
    }
    if (err && err.httpStatus) {
      return NextResponse.json({ error: err.message }, { status: err.httpStatus });
    }
    console.error("[POST /api/pedidos] Unexpected error:", err);
    return NextResponse.json(
      { error: "Error al crear el pedido", details: String(err) },
      { status: 500 }
    );
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseErr) {
        console.error("[POST /api/pedidos] client.release failed:", releaseErr);
      }
    }
  }
}