import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DriverStats } from "@/types/formula1";
import { Trophy, Target, Zap } from "lucide-react";

interface DriverCardProps {
  stats: DriverStats;
  rank: number;
}

export const DriverCard = ({ stats, rank }: DriverCardProps) => {
  return (
    <Card className="group relative overflow-hidden border-border bg-card hover:border-primary transition-all duration-300 hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl font-bold text-primary">#{rank}</span>
              <div>
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {stats.driver}
                </h3>
                <p className="text-sm text-muted-foreground">{stats.team}</p>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="bg-secondary/50 text-foreground">
            {stats.races} Races
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalPoints}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Wins</p>
                <p className="text-lg font-semibold text-foreground">{stats.wins}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Podiums</p>
                <p className="text-2xl font-bold text-foreground">{stats.podiums}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Avg Position</p>
                <p className="text-lg font-semibold text-foreground">
                  {stats.averagePosition > 0 ? stats.averagePosition.toFixed(1) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {stats.fastestLaps > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Fastest Laps</span>
              <Badge variant="outline" className="border-primary/50 text-primary">
                {stats.fastestLaps}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
