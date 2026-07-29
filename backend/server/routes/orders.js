const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'noitatelier_secret_key_change_in_production';

/**
 * Optional authentication: if a valid token is provided, attach the user to req.user.
 * If not provided or invalid, req.user remains undefined (but we don't return an error).
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const sessionResult = await pool.query(
      'SELECT * FROM sessions WHERE user_id = $1 AND token_hash = $2 AND activa = true AND expires_at > NOW()',
      [decoded.id, tokenHash]
    );

    if (sessionResult.rowCount > 0) {
      req.user = decoded;
    }
    next();
  } catch (err) {
    // Invalid or expired token -> treat as guest
    next();
  }
}

/**
 * POST /api/pedidos
 * Create a new order.
 * Body: {
 *   cliente_nombre: string,
 *   cliente_telefono: string,
 *   cliente_email?: string | null,
 *   items: [{ producto_id: number, cantidad: number }],
 *   notas?: string | null
 * }
 */
router.post('/', optionalAuth, async (req, res) => {
  let client = null;
  try {
    // Start transaction
    client = await pool.connect();
    await client.query('BEGIN');

    const {
      cliente_nombre,
      cliente_telefono,
      cliente_email,
      items,
      notas
    } = req.body;

    // Basic validation
    if (!cliente_nombre || !cliente_nombre.trim()) {
      return res.status(400).json({ error: 'El nombre del cliente es obligatorio' });
    }
    if (!cliente_telefono || !cliente_telefono.trim()) {
      return res.status(400).json({ error: 'El teléfono del cliente es obligatorio' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Debe incluir al menos un producto en el pedido' });
    }

    // Validate each item and check stock
    const validatedItems = [];
    let total = 0;

    for (const item of items) {
      const { producto_id, cantidad } = item;

      if (!producto_id || typeof producto_id !== 'number' || producto_id <= 0) {
        return res.status(400).json({ error: `ID de producto inválido: ${producto_id}` });
      }
      if (!cantidad || typeof cantidad !== 'number' || !Number.isInteger(cantidad) || cantidad <= 0) {
        return res.status(400).json({ error: `Cantidad inválida para el producto ${producto_id}` });
      }

      // Fetch product from database
      const productResult = await client.query(
        'SELECT id, nombre, precio, activo, stock FROM productos WHERE id = $1',
        [producto_id]
      );

      if (productResult.rowCount === 0) {
        return res.status(400).json({ error: `Producto no encontrado: ${producto_id}` });
      }

      const product = productResult.rows[0];

      if (!product.activo) {
        return res.status(400).json({ error: `Producto no disponible: ${product.nombre}` });
      }

      if (product.stock < cantidad) {
        return res.status(400).json({ error: `Stock insuficiente para ${product.nombre}. Disponible: ${product.stock}` });
      }

      // Add to validated items
      validatedItems.push({
        product_id: product.id,
        nombre: product.nombre,
        precio: product.price,
        cantidad: cantidad,
        subtotal: Number(product.price) * cantidad
      });

      total += Number(product.price) * cantidad;
    }

    // Insert the pedido
    const userId = req.user ? req.user.id : null;
    const pedidoResult = await client.query(
      `INSERT INTO pedidos (
        user_id,
        cliente_nombre,
        cliente_telefono,
        cliente_email,
        total,
        estado,
        canal,
        notas,
        creado_en
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW()
      ) RETURNING id, creado_en`,
      [
        userId,
        cliente_nombre.trim(),
        cliente_telefono.trim(),
        cliente_email ? cliente_email.trim() : null,
        parseFloat(total.toFixed(2)),
        'pendiente',
        'whatsapp',
        notas ? notas.trim() : null
      ]
    );

    const pedidoId = pedidoResult.rows[0].id;

    // Insert each item into pedido_items
    for (const item of validatedItems) {
      await client.query(
        `INSERT INTO pedido_items (
          pedido_id,
          producto_id,
          nombre_producto,
          precio_unitario,
          cantidad,
          subtotal
        ) VALUES (
          $1, $2, $3, $4, $5, $6
        )`,
        [
          pedidoId,
          item.product_id,
          item.nombre,
          parseFloat(item.precio.toFixed(2)),
          item.cantidad,
          parseFloat(item.subtotal.toFixed(2))
        ]
      );

      // Update stock (deduct the purchased quantity)
      await client.query(
        'UPDATE productos SET stock = stock - $1 WHERE id = $2',
        [item.cantidad, item.product_id]
      );
    }

    // Commit transaction
    await client.query('COMMIT');
    client.release();

    // Return success
    res.status(201).json({
      status: 'success',
      message: 'Pedido creado exitosamente',
      order_id: pedidoId,
      total: parseFloat(total.toFixed(2)),
      creado_en: pedidoResult.rows[0].creado_en
    });

  } catch (err) {
    // Rollback transaction if client exists
    if (client) {
      await client.query('ROLLBACK');
      client.release();
    }
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Error interno del servidor', detail: err.message });
  }
});

module.exports = router;