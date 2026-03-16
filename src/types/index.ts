// Shared TypeScript types for the NBA Morning Recap app

export interface Player {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  teamId: number;
}

export interface Team {
  id: number;
  abbreviation: string;
  city: string;
  conference: string;
  division: string;
  fullName: string;
  name: string;
}

export interface PlayerStats {
  playerId: number;
  playerName: string;
  teamAbbreviation: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  minutesPlayed: string;
}

export interface GameResult {
  gameId: number;
  date: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  status: string;
  topPerformers: PlayerStats[];
}

export interface StandingsEntry {
  team: Team;
  conference: string;
  wins: number;
  losses: number;
  winPercentage: number;
  conferenceRank: number;
}

export interface FormattedRecapData {
  date: string;
  games: GameResult[];
  standings: {
    east: StandingsEntry[];
    west: StandingsEntry[];
  };
}
