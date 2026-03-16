"use client";

import { useEffect, useMemo, useState } from "react";
import type { OddsGame, Projection, TeamProfile } from "../lib/types";
import { average, clamp, titleLineDate } from "../lib/utils";

type TeamsResponse = {
  ok: boolean;
  fetchedAt?: string;
  teamCount?: number;
  teams?: TeamProfile[];
  error?: string;
};

type OddsResponse = {
  ok: boolean;
  fetchedAt?: string;
  gameCount?: number;
  games?: OddsGame[];
  error?: string;
};

function modelGame(teamA: TeamProfile, teamB: TeamProfile, odds: OddsGame | null): Projection {
  const scoreA = teamA.resumeScore;
  const scoreB = teamB.resumeScore;
  const gap = scoreA - scoreB;
  const favorite = gap >= 0 ? teamA.team : teamB.team;
  const underdog = gap >= 0 ? teamB.team : teamA.team;
  const projectedSpread = Number((Math.abs(gap) / 6.5).toFixed(1));

  const winPctBase = average(teamA.winPct * 100, teamB.winPct * 100);
  const scheduleStrength = average(teamA.sos ? 110 - teamA.sos : 40, teamB.sos ? 110 - teamB.sos : 40);
  const nonConStrength = average(teamA.ncSos ? 110 - teamA.ncSos : 40, teamB.ncSos ? 110 - teamB.ncSos : 40);
  const totalBaseline = 139 + (winPctBase - 70) * 0.25 + scheduleStrength * 0.06 + nonConStrength * 0.03;
  const marketTotal = odds?.total ?? null;
  const projectedTotal = Number(clamp(marketTotal ? average(totalBaseline, marketTotal) : totalBaseline, 126, 168).toFixed(1));

  const favoriteScore = Number(((projectedTotal + projectedSpread) / 2).toFixed(1));
  const underdogScore = Number((projectedTotal - favoriteScore).toFixed(1));

  const edgeVsSpread = odds?.spread !== null && odds?.spread !== undefined ? Number((projectedSpread - Math.abs(odds.spread)).toFixed(1)) : null;
  const edgeVsTotal = marketTotal !== null && marketTotal !== undefined ? Number((projectedTotal - marketTotal).toFixed(1)) : null;

  const pickAgainstSpread = edgeVsSpread === null
    ? `${favorite} -${projectedSpread}`
    : edgeVsSpread > 1.5
      ? `${favorite} ${odds?.spread}`
      : edgeVsSpread < -1.5
        ? `${underdog} +${Math.abs(odds?.spread ?? projectedSpread)}`
        : `Pass / slight lean ${favorite}`;

  const totalPick = edgeVsTotal === null
    ? `Projected total ${projectedTotal}`
    : edgeVsTotal > 2
      ? `Over ${marketTotal}`
      : edgeVsTotal < -2
        ? `Under ${marketTotal}`
        : `Pass / slight lean total ${marketTotal}`;

  const confidence = clamp(54 + Math.abs(gap) * 0.7 + (edgeVsSpread ? Math.abs(edgeVsSpread) * 2 : 0), 52, 88);

  const explanation = [
    `${favorite} grades higher on resume score (${gap >= 0 ? scoreA.toFixed(1) : scoreB.toFixed(1)} vs ${gap >= 0 ? scoreB.toFixed(1) : scoreA.toFixed(1)}).`,
    `SOR/SOS drive the edge: ${teamA.team} has SOR ${teamA.sor ?? "-"} and SOS ${teamA.sos ?? "-"}; ${teamB.team} has SOR ${teamB.sor ?? "-"} and SOS ${teamB.sos ?? "-"}.`,
    marketTotal ? `The market total is ${marketTotal}, while the model projects ${projectedTotal}.` : `No current total was loaded, so the model uses resume-based scoring only.`
  ];

  return {
    favorite,
    underdog,
    projectedSpread,
    projectedTotal,
    favoriteScore,
    underdogScore,
    edgeVsSpread,
    edgeVsTotal,
    pickAgainstSpread,
    totalPick,
    confidence: Math.round(confidence),
    explanation
  };
}

export default function Page() {
  const [teams, setTeams] = useState<TeamProfile[]>([]);
  const [games, setGames] = useState<OddsGame[]>([]);
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [teamsStatus, setTeamsStatus] = useState("Loading...");
  const [oddsStatus, setOddsStatus] = useState("Loading...");
  const [teamsFetchedAt, setTeamsFetchedAt] = useState<string | null>(null);
  const [oddsFetchedAt, setOddsFetchedAt] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const teamsRes = await fetch("/api/teams", { cache: "no-store" });
      const teamsJson: TeamsResponse = await teamsRes.json();
      if (teamsJson.ok && teamsJson.teams) {
        setTeams(teamsJson.teams.sort((a, b) => a.team.localeCompare(b.team)));
        setTeamsStatus(`Live · ${teamsJson.teamCount} teams`);
        setTeamsFetchedAt(teamsJson.fetchedAt ?? null);
        if (!teamA && teamsJson.teams[0]) setTeamA(teamsJson.teams[0].team);
        if (!teamB && teamsJson.teams[1]) setTeamB(teamsJson.teams[1].team);
      } else {
        setTeamsStatus(`Error · ${teamsJson.error ?? "teams unavailable"}`);
      }

      const oddsRes = await fetch("/api/odds", { cache: "no-store" });
      const oddsJson: OddsResponse = await oddsRes.json();
      if (oddsJson.ok && oddsJson.games) {
        setGames(oddsJson.games);
        setOddsStatus(`Live · ${oddsJson.gameCount} games`);
        setOddsFetchedAt(oddsJson.fetchedAt ?? null);
      } else {
        setOddsStatus(`Error · ${oddsJson.error ?? "odds unavailable"}`);
      }
    })();
  }, []);

  const selectedA = useMemo(() => teams.find((t) => t.team === teamA) ?? null, [teams, teamA]);
  const selectedB = useMemo(() => teams.find((t) => t.team === teamB) ?? null, [teams, teamB]);
  const matchingGame = useMemo(() => {
    if (!selectedA || !selectedB) return null;
    return games.find((game) => {
      const set = new Set([game.teamA, game.teamB]);
      return set.has(selectedA.team) && set.has(selectedB.team);
    }) ?? null;
  }, [games, selectedA, selectedB]);

  const projection = useMemo(() => {
    if (!selectedA || !selectedB || selectedA.team === selectedB.team) return null;
    return modelGame(selectedA, selectedB, matchingGame);
  }, [selectedA, selectedB, matchingGame]);

  return (
    <main>
      <section className="hero">
        <div className="status">NCAA Round 1 Model</div>
        <h1>Projected spread, projected score, and projected total versus the live line.</h1>
        <p>
          This build loads the full ESPN resume table for all listed teams, imports SOR and SOS, loads the current ESPN odds board, and produces a projection using wins, losses, SOR, SOS, non-conference SOS, and quality wins.
        </p>
      </section>

      <section className="grid grid-3">
        <div className="card"><div className="metric"><div className="name">Team data</div><div className="value">{teamsStatus}</div><div className="small">Updated {titleLineDate(teamsFetchedAt)}</div></div></div>
        <div className="card"><div className="metric"><div className="name">Odds feed</div><div className="value">{oddsStatus}</div><div className="small">Updated {titleLineDate(oddsFetchedAt)}</div></div></div>
        <div className="card"><div className="metric"><div className="name">Matchup loaded</div><div className="value">{matchingGame ? "Yes" : "No line found"}</div><div className="small">Search two teams to compare</div></div></div>
      </section>

      <section className="grid grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <label className="label">Team 1</label>
          <input list="teams-list" value={teamA} onChange={(e) => setTeamA(e.target.value)} />
        </div>
        <div className="card">
          <label className="label">Team 2</label>
          <input list="teams-list" value={teamB} onChange={(e) => setTeamB(e.target.value)} />
        </div>
        <datalist id="teams-list">
          {teams.map((team) => <option key={team.team} value={team.team} />)}
        </datalist>
      </section>

      {projection && selectedA && selectedB && (
        <>
          <section className="grid grid-2" style={{ marginTop: 16 }}>
            <div className="card pick">
              <h2>{projection.pickAgainstSpread}</h2>
              <div className="small" style={{ color: "rgba(255,255,255,0.8)" }}>Confidence {projection.confidence}%</div>
              <div style={{ marginTop: 14 }} className="kv"><span>Projected spread</span><strong>{projection.favorite} -{projection.projectedSpread}</strong></div>
              <div className="kv"><span>Projected total</span><strong>{projection.projectedTotal}</strong></div>
              <div className="kv"><span>Projected score</span><strong>{projection.favoriteScore}-{projection.underdogScore}</strong></div>
              <div className="kv"><span>Total pick</span><strong>{projection.totalPick}</strong></div>
              <div className="kv"><span>Market line</span><strong>{matchingGame?.spreadFavorite ? `${matchingGame.spreadFavorite} ${matchingGame.spread}` : "Not found"}</strong></div>
              <div className="kv"><span>Market total</span><strong>{matchingGame?.total ?? "Not found"}</strong></div>
            </div>
            <div className="card">
              <div className="metric"><div className="name">Why the model leans this way</div></div>
              {projection.explanation.map((line) => <div key={line} className="kv"><span>{line}</span></div>)}
              <div className="kv"><span>Edge vs spread</span><strong>{projection.edgeVsSpread === null ? "N/A" : `${projection.edgeVsSpread > 0 ? "+" : ""}${projection.edgeVsSpread}`}</strong></div>
              <div className="kv"><span>Edge vs total</span><strong>{projection.edgeVsTotal === null ? "N/A" : `${projection.edgeVsTotal > 0 ? "+" : ""}${projection.edgeVsTotal}`}</strong></div>
            </div>
          </section>

          <section className="grid grid-2" style={{ marginTop: 16 }}>
            {[selectedA, selectedB].map((team) => (
              <div className="card" key={team.team}>
                <h3 style={{ marginTop: 0 }}>{team.team}</h3>
                <div className="small" style={{ marginBottom: 10 }}>{team.conference || "Conference unavailable"}</div>
                <div className="kv"><span>Record</span><strong>{team.wins}-{team.losses}</strong></div>
                <div className="kv"><span>Win %</span><strong>{(team.winPct * 100).toFixed(1)}%</strong></div>
                <div className="kv"><span>SOR</span><strong>{team.sor ?? "-"}</strong></div>
                <div className="kv"><span>SOS</span><strong>{team.sos ?? "-"}</strong></div>
                <div className="kv"><span>NC SOS</span><strong>{team.ncSos ?? "-"}</strong></div>
                <div className="kv"><span>Quality wins</span><strong>{team.qualityWins ?? "-"}</strong></div>
                <div className="kv"><span>Resume score</span><strong>{team.resumeScore.toFixed(1)}</strong></div>
              </div>
            ))}
          </section>
        </>
      )}

      <section className="card" style={{ marginTop: 16 }}>
        <div className="metric"><div className="name">Current games loaded</div></div>
        <table className="table">
          <thead>
            <tr>
              <th>Matchup</th>
              <th>Line</th>
              <th>Total</th>
              <th>Moneyline</th>
              <th>Game time</th>
            </tr>
          </thead>
          <tbody>
            {games.slice(0, 20).map((game) => (
              <tr key={`${game.teamA}-${game.teamB}-${game.gameTime}`}>
                <td>{game.teamA} vs {game.teamB}</td>
                <td>{game.spreadFavorite ? `${game.spreadFavorite} ${game.spread}` : "-"}</td>
                <td>{game.total ?? "-"}</td>
                <td>{game.teamAMoneyline ?? "-"} / {game.teamBMoneyline ?? "-"}</td>
                <td>{titleLineDate(game.gameTime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
