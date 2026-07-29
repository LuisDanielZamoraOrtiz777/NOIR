const express = require("express");
const router = express.Router();

const sisterStoreProducts = [
  {
    id: "ss-001",
    name: "Cuaderno de Bordes Dorados",
    category: "Papelería",
    price: 12.5,
    currency: "USD",
    description: "Cuaderno de tapa dura con detalles dorados y papel crema premium.",
    stock: 25,
    availability: "in_stock",
  },
  {
    id: "ss-002",
    name: "Juego de Plumas de Tinta Negra",
    category: "Escritura",
    price: 18.0,
    currency: "USD",
    description: "Pack de tres plumas estilográficas finas para notas elegantes.",
    stock: 12,
    availability: "in_stock",
  },
  {
    id: "ss-003",
    name: "Set de Pegatinas Artísticas",
    category: "Accesorios",
    price: 9.75,
    currency: "USD",
    description: "Colección de pegatinas para personalizar agendas, cartas y diarios.",
    stock: 4, // low_stock → activa advertencia "¡Solo quedan X!" en el carrito
    availability: "low_stock",
  },
];

router.get("/products", (_req, res) => {
  res.json({
    status: "success",
    source: "sister-store",
    result_count: sisterStoreProducts.length,
    products: sisterStoreProducts,
  });
});

router.get("/products/:id", (req, res) => {
  const product = sisterStoreProducts.find((item) => item.id === req.params.id);

  if (!product) {
    return res.status(404).json({
      status: "error",
      error: "Product not found",
      product_id: req.params.id,
    });
  }

  res.json({
    status: "success",
    product,
  });
});

module.exports = router;
