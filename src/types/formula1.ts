export interface RaceResult {
  Track: string;
  Position: string;
  No: string;
  Driver: string;
  Team: string;
  "Starting Grid": string;
  Laps: string;
  "Time/Retired": string;
  Points: string;
  "Set Fastest Lap": string;
  "Fastest Lap Time": string;
}

export interface DriverStats {
  driver: string;
  totalPoints: number;
  wins: number;
  podiums: number;
  races: number;
  averagePosition: number;
  fastestLaps: number;
  team: string;
}
