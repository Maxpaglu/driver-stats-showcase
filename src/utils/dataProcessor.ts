import type { RaceResult, DriverStats } from "@/types/formula1";

export const calculateDriverStats = (raceData: RaceResult[]): DriverStats[] => {
  const driverMap = new Map<string, DriverStats>();

  raceData.forEach((race) => {
    const driver = race.Driver;
    const position = parseInt(race.Position);
    const points = parseFloat(race.Points) || 0;
    const team = race.Team;

    if (!driverMap.has(driver)) {
      driverMap.set(driver, {
        driver,
        totalPoints: 0,
        wins: 0,
        podiums: 0,
        races: 0,
        averagePosition: 0,
        fastestLaps: 0,
        team,
      });
    }

    const stats = driverMap.get(driver)!;
    stats.totalPoints += points;
    stats.races++;
    
    if (!isNaN(position)) {
      if (position === 1) stats.wins++;
      if (position <= 3) stats.podiums++;
    }
    
    if (race["Set Fastest Lap"] === "Yes") {
      stats.fastestLaps++;
    }
  });

  // Calculate average positions
  const statsArray = Array.from(driverMap.values());
  statsArray.forEach((stats) => {
    const positions = raceData
      .filter((r) => r.Driver === stats.driver)
      .map((r) => parseInt(r.Position))
      .filter((p) => !isNaN(p));
    
    stats.averagePosition = positions.length > 0
      ? positions.reduce((a, b) => a + b, 0) / positions.length
      : 0;
  });

  return statsArray.sort((a, b) => b.totalPoints - a.totalPoints);
};
