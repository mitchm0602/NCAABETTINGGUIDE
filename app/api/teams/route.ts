import { NextResponse } from "next/server";
import { fetchNcaaNetTeams } from "../../../lib/sources/ncaaNet";
import { fetchEspnResumeRows } from "../../../lib/sources/espnBpi";

export async function GET() {
  try {
    const netData = await fetchNcaaNetTeams();
    const resumeData = await fetchEspnResumeRows();

    const teams = netData.map((team) => {
      const match = resumeData.find(
        (row) => row.team.toLowerCase() === team.team.toLowerCase()
      );

      return {
        ...team,
        sor: match?.sor ?? null,
        sos: match?.sos ?? null,
        ncSos: match?.ncSos ?? null,
        sorSeed: match?.sorSeed ?? null,
        sorCurve: match?.sorCurve ?? null,
        qualityWins: match?.qualityWins ?? null
      };
    });

    return NextResponse.json({ ok: true, teams });
  } catch (error) {
    console.error("TEAMS API ERROR:", error);

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
