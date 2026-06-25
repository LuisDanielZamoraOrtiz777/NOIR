import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body || {};
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    // TODO: persist subscription to DB or 3rd-party list (Mailchimp, etc.)
    // eslint-disable-next-line no-console
    console.log("Newsletter subscription:", email);

    return NextResponse.json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
