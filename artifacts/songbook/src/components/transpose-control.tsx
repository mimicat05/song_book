import { Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TransposeControlProps {
  semitones: number;
  onChange: (semitones: number) => void;
}

export function TransposeControl({ semitones, onChange }: TransposeControlProps) {
  const label =
    semitones === 0
      ? "Original"
      : semitones > 0
      ? `+${semitones}`
      : `${semitones}`;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider select-none">
        Transpose
      </span>
      <div className="flex items-center rounded-md border border-border bg-secondary overflow-hidden">
        <button
          type="button"
          onClick={() => onChange(Math.max(-6, semitones - 1))}
          disabled={semitones <= -6}
          title="Down one semitone"
          className="flex items-center justify-center w-8 h-8 border-r border-border hover:bg-secondary-foreground/10 disabled:opacity-40 transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <span
          className={`w-20 text-center text-sm font-semibold select-none py-1 ${
            semitones !== 0 ? "text-primary" : "text-foreground/70"
          }`}
        >
          {label}
        </span>

        <button
          type="button"
          onClick={() => onChange(Math.min(6, semitones + 1))}
          disabled={semitones >= 6}
          title="Up one semitone"
          className="flex items-center justify-center w-8 h-8 border-l border-border hover:bg-secondary-foreground/10 disabled:opacity-40 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {semitones !== 0 && (
        <button
          type="button"
          onClick={() => onChange(0)}
          title="Reset to original key"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      )}
    </div>
  );
}
