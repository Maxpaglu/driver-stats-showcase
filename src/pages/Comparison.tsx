import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateDriverStats } from "@/utils/dataProcessor";
import type { RaceResult, DriverStats } from "@/types/formula1";
import { ArrowLeft, Loader2 } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const SEASONS = [
  { year: "2022", file: "/data/2022_race.csv" },
  { year: "2023", file: "/data/2023_race.csv" },
  { year: "2024", file: "/data/2024_race.csv" },
  { year: "2025", file: "/data/2025_race.csv" },
];

const Comparison = () => {
  const navigate = useNavigate();
  const [selectedSeason, setSelectedSeason] = useState("2024");
  const [driverStats, setDriverStats] = useState<DriverStats[]>([]);
  const [driver1, setDriver1] = useState<string>("");
  const [driver2, setDriver2] = useState<string>("");
  const [loading, setLoading] = useState(true);

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
          if (!driver1 && stats.length > 0) setDriver1(stats[0].driver);
          if (!driver2 && stats.length > 1) setDriver2(stats[1].driver);
          setLoading(false);
        },
      });
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    navigate("/login");
  };

  const getComparisonData = () => {
    const d1Stats = driverStats.find(d => d.driver === driver1);
    const d2Stats = driverStats.find(d => d.driver === driver2);
    
    if (!d1Stats || !d2Stats) return [];

    return [
      {
        metric: "Points",
        [driver1]: d1Stats.totalPoints,
        [driver2]: d2Stats.totalPoints,
      },
      {
        metric: "Wins",
        [driver1]: d1Stats.wins,
        [driver2]: d2Stats.wins,
      },
      {
        metric: "Podiums",
        [driver1]: d1Stats.podiums,
        [driver2]: d2Stats.podiums,
      },
      {
        metric: "Fastest Laps",
        [driver1]: d1Stats.fastestLaps,
        [driver2]: d2Stats.fastestLaps,
      },
    ];
  };

  const getAvgPositionData = () => {
    const d1Stats = driverStats.find(d => d.driver === driver1);
    const d2Stats = driverStats.find(d => d.driver === driver2);
    
    if (!d1Stats || !d2Stats) return [];

    return [
      {
        name: "Average Position",
        [driver1]: d1Stats.averagePosition,
        [driver2]: d2Stats.averagePosition,
      },
    ];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2" /> Back to Dashboard
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Head to Head <span className="text-primary">Comparison</span>
          </h1>
          <p className="text-muted-foreground">
            Compare performance metrics between two drivers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Season</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEASONS.map((season) => (
                    <SelectItem key={season.year} value={season.year}>
                      {season.year} Season
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Driver 1</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={driver1} onValueChange={setDriver1}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {driverStats.map((stats) => (
                    <SelectItem key={stats.driver} value={stats.driver}>
                      {stats.driver}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Driver 2</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={driver2} onValueChange={setDriver2}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {driverStats.map((stats) => (
                    <SelectItem key={stats.driver} value={stats.driver}>
                      {stats.driver}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getComparisonData()}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="metric" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Legend />
                  <Bar dataKey={driver1} fill="hsl(var(--primary))" />
                  <Bar dataKey={driver2} fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Average Position (Lower is Better)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getAvgPositionData()}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" reversed />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Legend />
                  <Bar dataKey={driver1} fill="hsl(var(--primary))" />
                  <Bar dataKey={driver2} fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Comparison;
