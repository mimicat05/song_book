const CHORD_TOKEN = /^[A-G][#b]?(m|maj|min|dim|aug|sus2|sus4|sus|add|no|M|5)?[0-9]*(\/[A-G][#b]?)?[*!]?$/;
const SEPARATOR_TOKEN = /^[-|/\\]+$/;
const SECTION_HEADER = /^\[.+\]$/;

function isSectionHeader(line: string) {
  return SECTION_HEADER.test(line.trim());
}

function isChordLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (isSectionHeader(trimmed)) return false;
  const tokens = trimmed.split(/\s+/);
  // Ignore pure separator tokens (dashes, pipes, slashes used between chords)
  const meaningful = tokens.filter((t) => !SEPARATOR_TOKEN.test(t));
  if (meaningful.length === 0) return false;
  const chordCount = meaningful.filter((t) => CHORD_TOKEN.test(t)).length;
  return chordCount / meaningful.length >= 0.65;
}

type LineKind = "section" | "chord" | "lyric" | "empty";

function classifyLine(line: string): LineKind {
  if (!line.trim()) return "empty";
  if (isSectionHeader(line)) return "section";
  if (isChordLine(line)) return "chord";
  return "lyric";
}

interface ChordChartProps {
  text: string;
  className?: string;
}

export function ChordChart({ text, className = "" }: ChordChartProps) {
  const lines = text.split("\n");

  return (
    <div
      className={`font-mono text-sm md:text-base leading-relaxed select-text ${className}`}
      style={{ fontFamily: "'Space Mono', 'Courier New', monospace" }}
    >
      {lines.map((line, i) => {
        const kind = classifyLine(line);

        if (kind === "empty") {
          return <div key={i} className="h-4" />;
        }

        if (kind === "section") {
          return (
            <div
              key={i}
              className="mt-6 mb-1 first:mt-0 text-foreground font-medium tracking-wide"
            >
              {line.trim()}
            </div>
          );
        }

        if (kind === "chord") {
          return (
            <div
              key={i}
              className="text-primary whitespace-pre leading-snug"
              style={{ marginBottom: "0.05em" }}
            >
              {line}
            </div>
          );
        }

        return (
          <div key={i} className="text-foreground whitespace-pre leading-normal mb-0.5">
            {line}
          </div>
        );
      })}
    </div>
  );
}
