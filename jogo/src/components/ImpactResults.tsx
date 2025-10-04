import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { getPopulationDensity } from "@/lib/population";
import { AlertTriangle, Activity, Wind, Flame } from "lucide-react";

interface ImpactResult {
  energy: number;
  craterDiameter: number;
  craterDepth: number;
  fireballRadius: number;
  shockwaveRadius: number;
  seismicMagnitude: number;
}

interface ImpactResultsProps {
  results: ImpactResult;
  location: { lat: number; lng: number };
}

export const ImpactResults = ({ results, location }: ImpactResultsProps) => {
  const [popDensity, setPopDensity] = useState<number | null>(null);
  const [popLoading, setPopLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchDensity = async () => {
      setPopLoading(true);
      const d = await getPopulationDensity(location.lat, location.lng);
      if (!mounted) return;
      setPopDensity(d);
      setPopLoading(false);
    };

    fetchDensity();

    return () => {
      mounted = false;
    };
  }, [location.lat, location.lng]);
  const formatEnergy = (megatons: number) => {
    if (megatons >= 1000) {
      return `${(megatons / 1000).toFixed(1)} Gigatons`;
    }
    return `${megatons.toFixed(1)} Megatons`;
  };

  const formatDistance = (km: number) => {
    if (km >= 1000) {
      return `${(km / 1000).toFixed(1)} Mm`;
    }
    return `${km.toFixed(1)} km`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="h-5 w-5" />
        <h3 className="text-lg font-bold">Impact Assessment</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="p-4 bg-card/50 backdrop-blur-sm border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Flame className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Energy</p>
              <p className="text-lg font-bold">{formatEnergy(results.energy)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card/50 backdrop-blur-sm border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Seismic Magnitude</p>
              <p className="text-lg font-bold">{results.seismicMagnitude.toFixed(1)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card/50 backdrop-blur-sm border-accent/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Wind className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fireball Radius</p>
              <p className="text-lg font-bold">{formatDistance(results.fireballRadius)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card/50 backdrop-blur-sm border-accent/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Wind className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Shockwave Radius</p>
              <p className="text-lg font-bold">{formatDistance(results.shockwaveRadius)}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 bg-secondary/50 backdrop-blur-sm">
        <h4 className="font-semibold mb-2">Crater Dimensions</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Diameter</p>
            <p className="font-bold text-lg">{formatDistance(results.craterDiameter)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Depth</p>
            <p className="font-bold text-lg">{formatDistance(results.craterDepth)}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-muted/50 backdrop-blur-sm">
        <h4 className="font-semibold mb-2">Impact Location</h4>
        <p className="text-sm text-muted-foreground">
          {location.lat.toFixed(4)}° {location.lat >= 0 ? "N" : "S"},{" "}
          {location.lng.toFixed(4)}° {location.lng >= 0 ? "E" : "W"}
        </p>

        <div className="mt-3 text-sm">
          <p className="text-muted-foreground">Estimated people affected (fireball):</p>
          <p className="font-bold">
            {popLoading ? "Loading..." : popDensity == null ? "N/A" : (() => {
              // area of circle in km^2 (fireballRadius is in km)
              const area = Math.PI * Math.pow(results.fireballRadius, 2);
              const affected = Math.round(area * popDensity);
              return affected.toLocaleString();
            })()}
          </p>
        </div>
      </Card>
    </div>
  );
};
