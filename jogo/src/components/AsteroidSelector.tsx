import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Asteroid {
  id: string;
  name: string;
  density: number;
  description: string;
}

const asteroids: Asteroid[] = [
  { id: "iron", name: "Iron Asteroid", density: 7800, description: "Dense metallic asteroid" },
  { id: "stone", name: "Stone Asteroid", density: 3000, description: "Rocky silicate asteroid" },
  { id: "carbon", name: "Carbon Asteroid", density: 2000, description: "Dark carbonaceous asteroid" },
  { id: "ice", name: "Ice Asteroid", density: 1000, description: "Frozen comet-like body" },
];

interface AsteroidSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export const AsteroidSelector = ({ selectedId, onSelect }: AsteroidSelectorProps) => {
  const currentIndex = asteroids.findIndex((a) => a.id === selectedId);
  const selectedAsteroid = asteroids[currentIndex];

  const handlePrevious = () => {
    const newIndex = (currentIndex - 1 + asteroids.length) % asteroids.length;
    onSelect(asteroids[newIndex].id);
  };

  const handleNext = () => {
    const newIndex = (currentIndex + 1) % asteroids.length;
    onSelect(asteroids[newIndex].id);
  };

  return (
    <div className="flex items-center justify-between gap-4 p-6 bg-card rounded-lg border border-border">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrevious}
        className="shrink-0"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <div className="flex-1 text-center space-y-2">
        <div className="w-32 h-32 mx-auto bg-secondary rounded-full flex items-center justify-center mb-2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-glow" />
          <span className="text-6xl relative z-10">🌑</span>
        </div>
        <h3 className="font-bold text-lg">{selectedAsteroid.name}</h3>
        <p className="text-sm text-muted-foreground">{selectedAsteroid.description}</p>
        <p className="text-xs text-muted-foreground">
          Density: {selectedAsteroid.density.toLocaleString()} kg/m³
        </p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleNext}
        className="shrink-0"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>
    </div>
  );
};
