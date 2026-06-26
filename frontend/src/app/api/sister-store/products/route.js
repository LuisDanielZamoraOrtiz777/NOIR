const PRODUCTOS = [
  {
    id: "ss-001",
    name: "Cuaderno de Bordes Dorados",
    category: "Papelería",
    price: 12.5,
    currency: "USD",
    description: "Cuaderno de tapa dura con detalles dorados y papel crema premium.",
    availability: "in_stock"
  },
  {
    id: "ss-002",
    name: "Juego de Plumas de Tinta Negra",
    category: "Escritura",
    price: 18.0,
    currency: "USD",
    description: "Pack de tres plumas estilográficas finas para notas elegantes.",
    availability: "in_stock"
  },
  {
    id: "ss-003",
    name: "Set de Pegatinas Artísticas",
    category: "Accesorios",
    price: 9.75,
    currency: "USD",
    description: "Colección de pegatinas para personalizar agendas, cartas y diarios.",
    availability: "low_stock"
  }
];

export async function GET() {
  return Response.json({
    status: "success",
    source: "sister-store",
    result_count: PRODUCTOS.length,
    products: PRODUCTOS,
  });
}