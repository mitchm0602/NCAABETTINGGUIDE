import { NextResponse } from "next/server";
import { fetchEspnResumeRows } from "../../../lib/sources/espnResume";

export async function GET() {
  try {
    const resumeData = await fetchEspnResumeRows();

    const teams = resumeData.map((row) => ({
      team: row.team,
      wins: row.wins,
      losses: row.losses,
      sor: row.sor ?? null,
      sos: row.sos ?? null,
      ncSos: row.ncSos ?? null,
      sorSeed: row.sorSeed ?? null,
      sorCurve: row.sorCurve ?? null,
      qualityWins: row.qualityWins ?? null
    }));

    return NextResponse.json({
      ok: true,
      count: teams.length,
      teams
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        route: "teams",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null
      },
      { status: 200 }
    );
  }
}
