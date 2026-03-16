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
      qualityWins: row.qualityWins ?? null,
      conference: null,
      netRank: null,
      roadRecord: null,
      neutralRecord: null,
      homeRecord: null,
      nonDivIRecord: null,
      prevNetRank: null,
      quad1Wins: null,
      quad1Losses: null,
      quad2Wins: null,
      quad2Losses: null,
      quad3Wins: null,
      quad3Losses: null,
      quad4Wins: null,
      quad4Losses: null
    }));

    return NextResponse.json({ ok: true, teams });
  } catch (error) {
    console.error("TEAMS API ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        teams: [],
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 200 }
    );
  }
}
