import { NextResponse } from "next/server";
import { fetchEspnOdds } from "../../../lib/sources/espnOdds";

export async function GET() {
  try {
    const games = await fetchEspnOdds();

    return NextResponse.json({
      ok: true,
      count: games.length,
      games
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        route: "odds",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null
      },
      { status: 200 }
    );
  }
}
