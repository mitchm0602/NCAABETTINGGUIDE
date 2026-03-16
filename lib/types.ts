export type ResumeRow = {
  team: string;
  conference: string | null;
  wins: number;
  losses: number;
  sor: number | null;
  sorSeed: number | null;
  sorCurve: number | null;
  qualityWins: string | null;
  sos: number | null;
  ncSos: number | null;
};

export type TeamProfile = ResumeRow & {
  winPct: number;
  resumeScore: number;
};

export type OddsGame = {
  teamA: string;
  teamB: string;
  teamARecord: string | null;
  teamBRecord: string | null;
  spreadFavorite: string | null;
  spread: number | null;
  total: number | null;
  moneylineFavorite: string | null;
  moneylineFavoritePrice: number | null;
  teamAMoneyline: number | null;
  teamBMoneyline: number | null;
  gameTime: string | null;
};

export type Projection = {
  favorite: string;
  underdog: string;
  projectedSpread: number;
  projectedTotal: number;
  favoriteScore: number;
  underdogScore: number;
  edgeVsSpread: number | null;
  edgeVsTotal: number | null;
  pickAgainstSpread: string;
  totalPick: string;
  confidence: number;
  explanation: string[];
};
