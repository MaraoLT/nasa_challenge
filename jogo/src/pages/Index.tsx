import { useState } from "react";
import { AsteroidSelector } from "@/components/AsteroidSelector";
import { ParameterControl } from "@/components/ParameterControl";
import { ImpactMap } from "@/components/ImpactMap";
import { ImpactResults } from "@/components/ImpactResults";
import { Button } from "@/components/ui/button";
import { Ruler, Gauge, Compass, Rocket } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [selectedAsteroid, setSelectedAsteroid] = useState("iron");
  const [diameter, setDiameter] = useState(500); // meters
  const [speed, setSpeed] = useState(20000); // mph
  const [angle, setAngle] = useState(45); // degrees
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [impactResults, setImpactResults] = useState<any>(null);
  const [isLaunching, setIsLaunching] = useState(false);

  const asteroidDensities: { [key: string]: number } = {
    iron: 7800,
    stone: 3000,
    carbon: 2000,
    ice: 1000,
  };

  const calculateImpact = () => {
    if (!location) {
      toast.error("Please select an impact location first");
      return;
    }

    setIsLaunching(true);

    // Simulate launch delay
    setTimeout(() => {
      const density = asteroidDensities[selectedAsteroid];
      const radius = diameter / 2;
      const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
      const mass = volume * density; // kg
      const velocityMs = (speed * 1609.34) / 3600; // Convert mph to m/s
      
      // Kinetic energy = 0.5 * m * v^2
      const energyJoules = 0.5 * mass * Math.pow(velocityMs, 2);
      const energyMegatons = energyJoules / 4.184e15; // Convert to megatons of TNT

      // Crater calculations (simplified)
      const craterDiameter = Math.pow(energyMegatons, 0.3) * 0.8; // km
      const craterDepth = craterDiameter * 0.3; // km

      // Effects radii (simplified)
      const fireballRadius = Math.pow(energyMegatons, 0.4) * 0.5; // km
      const shockwaveRadius = Math.pow(energyMegatons, 0.33) * 3; // km
      
      // Seismic magnitude
      const seismicMagnitude = Math.log10(energyJoules) - 4.8;

      const results = {
        energy: energyMegatons,
        craterDiameter,
        craterDepth,
        fireballRadius,
        shockwaveRadius,
        seismicMagnitude,
      };

      setImpactResults(results);
      setIsLaunching(false);
      toast.success("Impact calculated!");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-space">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/50">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold bg-gradient-impact bg-clip-text text-transparent">
            ASTEROID LAUNCHER
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Simulate asteroid impacts on Earth
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Map */}
          <div className="lg:col-span-2">
            <ImpactMap
              onLocationSelect={(lat, lng) => setLocation({ lat, lng })}
              selectedLocation={location}
              impactRadius={impactResults?.fireballRadius || 0}
            />
          </div>

          {/* Right Panel - Controls */}
          <div className="space-y-6">
            {/* Asteroid Selection */}
            <div>
              <h2 className="text-xl font-bold mb-4">Select Asteroid</h2>
              <AsteroidSelector
                selectedId={selectedAsteroid}
                onSelect={setSelectedAsteroid}
              />
            </div>

            {/* Parameters */}
            <div className="space-y-4 p-6 bg-card rounded-lg border border-border">
              <h2 className="text-xl font-bold mb-4">Impact Parameters</h2>
              
              <ParameterControl
                label="Diameter"
                value={diameter}
                min={10}
                max={10000}
                step={10}
                unit="m"
                onChange={setDiameter}
                icon={<Ruler className="h-4 w-4" />}
              />

              <ParameterControl
                label="Speed"
                value={speed}
                min={1000}
                max={100000}
                step={1000}
                unit="mph"
                onChange={setSpeed}
                icon={<Gauge className="h-4 w-4" />}
              />

              <ParameterControl
                label="Impact Angle"
                value={angle}
                min={0}
                max={90}
                step={5}
                unit="°"
                onChange={setAngle}
                icon={<Compass className="h-4 w-4" />}
              />
            </div>

            {/* Launch Button */}
            <Button
              variant="launch"
              size="lg"
              className="w-full"
              onClick={calculateImpact}
              disabled={!location || isLaunching}
            >
              {isLaunching ? (
                <>
                  <Rocket className="h-5 w-5 animate-bounce" />
                  Launching...
                </>
              ) : (
                <>
                  <Rocket className="h-5 w-5" />
                  Launch Asteroid
                </>
              )}
            </Button>

            {!location && (
              <p className="text-xs text-center text-muted-foreground">
                Select an impact location on the map
              </p>
            )}
          </div>
        </div>

        {/* Results */}
        {impactResults && location && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ImpactResults results={impactResults} location={location} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
