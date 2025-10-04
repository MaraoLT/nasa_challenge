import { useRef, useEffect, useState } from "react";
import { Target } from "lucide-react";

interface ImpactMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation: { lat: number; lng: number } | null;
  impactRadius?: number;
}

export const ImpactMap = ({ onLocationSelect, selectedLocation, impactRadius = 0 }: ImpactMapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Draw simplified world map background
    ctx.fillStyle = "hsl(220 20% 12%)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = "hsl(220 15% 22%)";
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let i = 0; i <= 10; i++) {
      const x = (canvas.width / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let i = 0; i <= 6; i++) {
      const y = (canvas.height / 6) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw continents (simplified shapes)
    ctx.fillStyle = "hsl(220 15% 20%)";
    
    // North America
    ctx.beginPath();
    ctx.ellipse(canvas.width * 0.2, canvas.height * 0.35, canvas.width * 0.1, canvas.height * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // South America
    ctx.beginPath();
    ctx.ellipse(canvas.width * 0.25, canvas.height * 0.65, canvas.width * 0.06, canvas.height * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Europe
    ctx.beginPath();
    ctx.ellipse(canvas.width * 0.5, canvas.height * 0.3, canvas.width * 0.05, canvas.height * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Africa
    ctx.beginPath();
    ctx.ellipse(canvas.width * 0.52, canvas.height * 0.55, canvas.width * 0.08, canvas.height * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Asia
    ctx.beginPath();
    ctx.ellipse(canvas.width * 0.7, canvas.height * 0.35, canvas.width * 0.15, canvas.height * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Australia
    ctx.beginPath();
    ctx.ellipse(canvas.width * 0.8, canvas.height * 0.7, canvas.width * 0.06, canvas.height * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw selected location
    if (selectedLocation) {
      const x = ((selectedLocation.lng + 180) / 360) * canvas.width;
      const y = ((90 - selectedLocation.lat) / 180) * canvas.height;

      // Draw impact radius
      if (impactRadius > 0) {
        const radiusPixels = (impactRadius / 20000) * canvas.width; // Simplified scale
        ctx.fillStyle = "hsl(14 100% 57% / 0.2)";
        ctx.beginPath();
        ctx.arc(x, y, radiusPixels, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = "hsl(14 100% 57% / 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radiusPixels, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw crosshair
      ctx.strokeStyle = "hsl(14 100% 57%)";
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.moveTo(x - 15, y);
      ctx.lineTo(x + 15, y);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(x, y - 15);
      ctx.lineTo(x, y + 15);
      ctx.stroke();
      
      ctx.strokeStyle = "hsl(14 100% 57%)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [selectedLocation, impactRadius]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert pixel coordinates to lat/lng
    const lng = ((x / canvas.width) * 360) - 180;
    const lat = 90 - ((y / canvas.height) * 180);

    onLocationSelect(lat, lng);
  };

  return (
    <div className="relative w-full h-full min-h-[400px] bg-card rounded-lg overflow-hidden border border-border">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className="w-full h-full cursor-crosshair"
        style={{ minHeight: "400px" }}
      />
      {!selectedLocation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-2 bg-background/80 backdrop-blur-sm p-6 rounded-lg">
            <Target className="h-12 w-12 mx-auto text-primary animate-pulse" />
            <p className="text-sm font-medium">Click to select impact location</p>
          </div>
        </div>
      )}
      {hovering && (
        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-2 rounded text-xs">
          Click anywhere on the map
        </div>
      )}
    </div>
  );
};
