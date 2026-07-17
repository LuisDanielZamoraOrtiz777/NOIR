const PRODUCTOS = [
  {
    id: "ss-001",
    name: "Cuaderno de Bordes Dorados",
    category: "Papelería",
    price: 12.5,
    currency: "USD",
    description: "Cuaderno de tapa dura con detalles dorados y papel crema premium.",
    availability: "in_stock",
    imagen_url: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600",
    buy_url: "https://sisterstore.example/products/ss-001"
  },
  {
    id: "ss-002",
    name: "Juego de Plumas de Tinta Negra",
    category: "Escritura",
    price: 18.0,
    currency: "USD",
    description: "Pack de tres plumas estilográficas finas para notas elegantes.",
    availability: "in_stock",
    imagen_url: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&q=80&w=600",
    buy_url: "https://sisterstore.example/products/ss-002"
  },
  {
    id: "ss-003",
    name: "Set de Pegatinas Artísticas",
    category: "Accesorios",
    price: 9.75,
    currency: "USD",
    description: "Colección de pegatinas para personalizar agendas, cartas y diarios.",
    availability: "low_stock",
    imagen_url: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&q=80&w=600",
    buy_url: "https://sisterstore.example/products/ss-003"
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