import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get('evidence');
    if (!file) return NextResponse.json({ error: 'missing file' }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const uploadsDir = path.resolve(process.cwd(), 'uploads', 'practica11');
    fs.mkdirSync(uploadsDir, { recursive: true });
    const filename = `evidence_${Date.now()}.json`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, buf);

    return NextResponse.json({ ok: true, path: `/uploads/practica11/${filename}` });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'upload failed' }, { status: 500 });
  }
}
