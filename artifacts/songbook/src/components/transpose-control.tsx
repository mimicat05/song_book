import { Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TransposeControlProps {
  semitones: number;
  onChange: (semitones: number) => void;
}

export function TransposeControl({ semitones, onChange }: TransposeControlProps) {
  const label =
    semitones === 0 ? "Original" : semitones > 0 ? `+${semitones}` : `${semitones}`;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Transpose</span>
      <div className="flex items-center gap-1 border border-border rounded-lg p-0.5 bg-background">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onChange(Math.max(-6, semitones - 1))}
          disabled={semitones <= -6}
          title="Down one semitone"
        >
          <Minus className="w-3.5 h-3.5" />
        </Button>

        <Badge
          variant={semitones === 0 ? "secondary" : "default"}
          className="min-w-[48px] justify-center text-xs font-mono px-2 py-0.5 rounded-md"
        >
          {label}
        </Badge>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onChange(Math.min(6, semitones + 1))}
          disabled={semitones >= 6}
          title="Up one semitone"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {semitones !== 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
          onClick={() => onChange(0)}
          title="Reset to original"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>
      )}
    </div>
  );
}
