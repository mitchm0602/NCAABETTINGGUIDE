import { NextResponse } from "next/server";
import { fetchEspnOdds } from "../../../lib/sources/espnOdds";

export async function GET() {
  try {
    const games = await fetchEspnOdds();
    return NextResponse.json({
      ok: true,
      fetchedAt: new Date().toISOString(),
      gameCount: games.length,
      games
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to fetch odds"
      },
      { status: 500 }
    );
  }
}
