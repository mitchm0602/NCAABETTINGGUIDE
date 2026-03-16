import * as cheerio from "cheerio";
import { ResumeRow } from "../types";
import { canonicalTeamName, isConference, normalizeWhitespace, parseRecord, toNumber } from "../utils";

const ESPN_BPI_RESUME_URL = "https://www.espn.com/mens-college-basketball/bpi/_/view/resume";

export async function fetchEspnResumeRows(): Promise<ResumeRow[]> {
  const response = await fetch(ESPN_BPI_RESUME_URL, {
    headers: { "user-agent": "Mozilla/5.0" },
    next: { revalidate: 60 * 30 }
  });

  if (!response.ok) {
    throw new Error(`ESPN resume request failed with status ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const lines = $.root().text().split("\n").map(normalizeWhitespace).filter(Boolean);

  const headerIndex = lines.findIndex((line) => line === "W-L");
  const teamConfStart = lines.findIndex((line) => line === "Team") + 2;
  if (teamConfStart < 2 || headerIndex === -1) {
    throw new Error("Could not locate ESPN resume table in page text.");
  }

  const teams: Array<{ team: string; conference: string | null }> = [];
  for (let i = teamConfStart; i < headerIndex; i += 1) {
    const team = lines[i];
    const conf = lines[i + 1];
    if (!team || !conf) continue;
    if (!isConference(conf)) continue;
    teams.push({ team: canonicalTeamName(team), conference: conf });
    i += 1;
  }

  const metricLines = lines.slice(headerIndex + 7);
  const rows: ResumeRow[] = [];

  for (let i = 0; i < teams.length; i += 1) {
    const offset = i * 7;
    const record = metricLines[offset];
    const sor = metricLines[offset + 1];
    const sorSeed = metricLines[offset + 2];
    const sorCurve = metricLines[offset + 3];
    const qualityWins = metricLines[offset + 4] ?? null;
    const sos = metricLines[offset + 5];
    const ncSos = metricLines[offset + 6];
    if (!record) break;

    const [wins, losses] = parseRecord(record);
    rows.push({
      team: teams[i].team,
      conference: teams[i].conference,
      wins,
      losses,
      sor: toNumber(sor),
      sorSeed: toNumber(sorSeed),
      sorCurve: toNumber(sorCurve),
      qualityWins,
      sos: toNumber(sos),
      ncSos: toNumber(ncSos)
    });
  }

  if (rows.length < 50) {
    throw new Error(`ESPN resume parser returned too few teams (${rows.length}).`);
  }

  return rows;
}
