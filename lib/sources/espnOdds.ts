import * as cheerio from "cheerio";
import { OddsGame } from "../types";
import { canonicalTeamName, normalizeWhitespace, toNumber } from "../utils";

const ESPN_ODDS_URL = "https://www.espn.com/mens-college-basketball/odds";

function parseTeamLine(line: string) {
  return canonicalTeamName(line.replace(/\s+[A-Z]{2,5}\s+[A-Z]{2,5}$/, ""));
}

export async function fetchEspnOdds(): Promise<OddsGame[]> {
  const response = await fetch(ESPN_ODDS_URL, {
    headers: { "user-agent": "Mozilla/5.0" },
    next: { revalidate: 60 * 10 }
  });

  if (!response.ok) {
    throw new Error(`ESPN odds request failed with status ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const lines = $.root().text().split("\n").map(normalizeWhitespace).filter(Boolean);
  const games: OddsGame[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    if (!/^\d{4}-\d{2}-\d{2}T/.test(lines[i])) continue;
    const gameTime = lines[i];
    if (lines[i + 1] !== "Open Spread Total ML") continue;

    const teamALine = lines[i + 2];
    const teamARecord = lines[i + 3] ?? null;
    const openTotalA = lines[i + 5] ?? null;
    const openMoneylineA = lines[i + 6] ?? null;
    const marketALine = lines[i + 7] ?? "";

    const teamBLine = lines[i + 8];
    const teamBRecord = lines[i + 9] ?? null;
    const openTotalB = lines[i + 11] ?? null;
    const openMoneylineB = lines[i + 12] ?? null;
    const marketBLine = lines[i + 13] ?? "";

    if (!teamALine || !teamBLine) continue;
    if (!/^\(/.test(teamARecord || "") || !/^\(/.test(teamBRecord || "")) continue;

    const teamA = parseTeamLine(teamALine);
    const teamB = parseTeamLine(teamBLine);

    const spreadAMatch = marketALine.match(/([+-]\d+(?:\.\d+)?)/);
    const totalAMatch = marketALine.match(/([ou])(\d+(?:\.\d+)?)/i);
    const mlAMatch = marketALine.match(/([+-]\d{2,6})\s*$/);

    const spreadBMatch = marketBLine.match(/([+-]\d+(?:\.\d+)?)/);
    const totalBMatch = marketBLine.match(/([ou])(\d+(?:\.\d+)?)/i);
    const mlBMatch = marketBLine.match(/([+-]\d{2,6})\s*$/);

    const spreadA = spreadAMatch ? Number(spreadAMatch[1]) : null;
    const spreadB = spreadBMatch ? Number(spreadBMatch[1]) : null;
    const total = totalAMatch ? Number(totalAMatch[2]) : totalBMatch ? Number(totalBMatch[2]) : toNumber(openTotalA) ?? toNumber(openTotalB);
    const mlA = mlAMatch ? Number(mlAMatch[1]) : toNumber(openMoneylineA);
    const mlB = mlBMatch ? Number(mlBMatch[1]) : toNumber(openMoneylineB);

    let spreadFavorite: string | null = null;
    let spread: number | null = null;
    if (spreadA !== null && spreadB !== null) {
      if (spreadA < spreadB) {
        spreadFavorite = teamA;
        spread = spreadA;
      } else {
        spreadFavorite = teamB;
        spread = spreadB;
      }
    }

    let moneylineFavorite: string | null = null;
    let moneylineFavoritePrice: number | null = null;
    if (typeof mlA === "number" && typeof mlB === "number") {
      if (mlA < mlB) {
        moneylineFavorite = teamA;
        moneylineFavoritePrice = mlA;
      } else {
        moneylineFavorite = teamB;
        moneylineFavoritePrice = mlB;
      }
    }

    games.push({
      teamA,
      teamB,
      teamARecord,
      teamBRecord,
      spreadFavorite,
      spread,
      total,
      moneylineFavorite,
      moneylineFavoritePrice,
      teamAMoneyline: mlA,
      teamBMoneyline: mlB,
      gameTime
    });
  }

  if (!games.length) {
    throw new Error("ESPN odds parser returned zero games.");
  }

  return games;
}
