import { NextResponse } from "next/server";
import { fetchEspnResumeRows } from "../../../lib/sources/espnResume";
import { TeamProfile } from "../../../lib/types";

function buildResumeScore(team: TeamProfile) {
  const winPct = team.wins / Math.max(team.wins + team.losses, 1);
  const sorComponent = team.sor ? Math.max(0, 120 - team.sor) : 40;
  const sosComponent = team.sos ? Math.max(0, 110 - team.sos) : 35;
  const ncSosComponent = team.ncSos ? Math.max(0, 110 - team.ncSos) : 35;
  const qualityMatch = team.qualityWins?.match(/(\d+)-(\d+)/);
  const qualityWins = qualityMatch ? Number(qualityMatch[1]) : 0;
  return Number((winPct * 50 + sorComponent * 0.35 + sosComponent * 0.15 + ncSosComponent * 0.05 + qualityWins * 2.5).toFixed(2));
}

export async function GET() {
  try {
    const rows = await fetchEspnResumeRows();
    const teams: TeamProfile[] = rows.map((row) => ({
      ...row,
      winPct: Number((row.wins / Math.max(row.wins + row.losses, 1)).toFixed(4)),
      resumeScore: 0
    })).map((row) => ({ ...row, resumeScore: buildResumeScore(row) }));

    return NextResponse.json({
      ok: true,
      fetchedAt: new Date().toISOString(),
      teamCount: teams.length,
      teams
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to fetch teams"
      },
      { status: 500 }
    );
  }
}
