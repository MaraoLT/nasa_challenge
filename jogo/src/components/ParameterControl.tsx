import { Slider } from "@/components/ui/slider";

interface ParameterControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
  icon?: React.ReactNode;
}

export const ParameterControl = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  icon,
}: ParameterControlProps) => {
  const handleChange = (values: number[]) => {
    onChange(values[0]);
  };

  const formatValue = (val: number) => {
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`;
    }
    if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}K`;
    }
    return val.toLocaleString();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <label className="text-sm font-medium">{label}</label>
        </div>
        <span className="text-sm font-bold text-primary">
          {formatValue(value)} {unit}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={handleChange}
        className="w-full"
      />
    </div>
  );
};
