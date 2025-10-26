import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import { DriverCard } from "@/components/DriverCard";
import { Button } from "@/components/ui/button";
import { calculateDriverStats } from "@/utils/dataProcessor";
import type { RaceResult, DriverStats } from "@/types/formula1";
import { Loader2, Trophy, BarChart3 } from "lucide-react";

const SEASONS = [
  { year: "2022", file: "/data/2022_race.csv" },
  { year: "2023", file: "/data/2023_race.csv" },
  { year: "2024", file: "/data/2024_race.csv" },
  { year: "2025", file: "/data/2025_race.csv" },
];

const Index = () => {
  const navigate = useNavigate();
  const [selectedSeason, setSelectedSeason] = useState("2024");
  const [driverStats, setDriverStats] = useState<DriverStats[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    navigate("/login");
  };

  useEffect(() => {
    loadSeasonData(selectedSeason);
  }, [selectedSeason]);

  const loadSeasonData = async (season: string) => {
    setLoading(true);
    const seasonData = SEASONS.find((s) => s.year === season);
    if (!seasonData) return;

    try {
      const response = await fetch(seasonData.file);
      const csvText = await response.text();
      
      Papa.parse<RaceResult>(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const stats = calculateDriverStats(results.data);
          setDriverStats(stats);
          setLoading(false);
        },
      });
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-b from-background via-background to-card">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(239,68,68,0.1),transparent)]" />
        <div className="flex justify-end p-4 absolute top-0 right-0 z-10">
          <Button variant="outline" onClick={() => navigate("/comparison")} className="mr-2">
            <BarChart3 className="mr-2" /> Compare Drivers
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </div>
        <div className="container relative mx-auto px-4 py-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-12 h-12 text-primary" />
            <h1 className="text-5xl md:text-7xl font-bold text-foreground">
              F1 <span className="text-primary">Performance</span>
            </h1>
          </div>
          <p className="text-center text-xl text-muted-foreground mb-8">
            Driver Statistics & Race Performance Analysis
          </p>

          {/* Season Selector */}
          <div className="flex justify-center gap-2 flex-wrap">
            {SEASONS.map((season) => (
              <Button
                key={season.year}
                onClick={() => setSelectedSeason(season.year)}
                variant={selectedSeason === season.year ? "default" : "outline"}
                className={
                  selectedSeason === season.year
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border-border hover:border-primary hover:text-primary"
                }
              >
                {season.year} Season
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Driver Stats Grid */}
      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {selectedSeason} Season Standings
              </h2>
              <p className="text-muted-foreground">
                Performance metrics for {driverStats.length} drivers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {driverStats.map((stats, index) => (
                <DriverCard key={stats.driver} stats={stats} rank={index + 1} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
