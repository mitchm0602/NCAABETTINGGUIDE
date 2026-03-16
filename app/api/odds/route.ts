import { NextResponse } from "next/server";
import { fetchEspnOdds } from "../../../lib/sources/espnOdds";

export async function GET() {
  try {
    const games = await fetchEspnOdds();
    return NextResponse.json({ ok: true, games });
  } catch (error) {
    console.error("ODDS API ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null
      },
      { status: 200 }
    );
  }
}
