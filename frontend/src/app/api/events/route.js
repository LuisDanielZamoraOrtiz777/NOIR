import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    const filePath = join(process.cwd(), "src", "data", "events.json");
    const fileContents = await readFile(filePath, "utf8");
    const events = JSON.parse(fileContents);

    return new Response(JSON.stringify({ events }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error reading events.json:", error);
    return new Response(JSON.stringify({ error: "No se pudieron cargar los eventos." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
