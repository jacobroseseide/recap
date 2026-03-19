// Shared TypeScript types for the NBA Morning Recap app

// ── User / database types ────────────────────────────────────────────────────

export type DeliveryPref = 'email' | 'sms' | 'both';
export type ContentPref = 'text' | 'audio' | 'both';
export type DetailLevel = 'flash' | 'recap' | 'deep_dive';

// Shape of a row coming out of the users table (includes db-assigned fields)
export interface User {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  delivery_pref: DeliveryPref;
  content_pref: ContentPref;
  detail_level: DetailLevel;
  favorite_team: string | null;
  created_at: string;
}

// Shape of the data needed to create a new user (no id or created_at yet)
export interface NewUser {
  name: string;
  email: string | null;
  phone: string | null;
  delivery_pref: DeliveryPref;
  content_pref: ContentPref;
  detail_level: DetailLevel;
  favorite_team: string | null;
}

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
