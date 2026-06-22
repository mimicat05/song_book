const SHARPS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLATS  = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

function noteIndex(note: string): number {
  let idx = SHARPS.indexOf(note);
  if (idx === -1) idx = FLATS.indexOf(note);
  return idx;
}

function transposeNote(note: string, semitones: number, useFlats: boolean): string {
  const idx = noteIndex(note);
  if (idx === -1) return note;
  const newIdx = ((idx + semitones) % 12 + 12) % 12;
  return useFlats ? FLATS[newIdx] : SHARPS[newIdx];
}

// Matches the root note (with optional sharp/flat) at the start of a chord token
const ROOT_RE = /^([A-G][#b]?)/;
// Matches a bass note after a slash
const BASS_RE = /\/([A-G][#b]?)$/;

// Whether to prefer flats when transposing (based on presence of flats in source)
function preferFlats(text: string): boolean {
  const flatCount = (text.match(/[A-G]b/g) || []).length;
  const sharpCount = (text.match(/[A-G]#/g) || []).length;
  return flatCount > sharpCount;
}

const CHORD_TOKEN = /^[A-G][#b]?(m|maj|min|dim|aug|sus2|sus4|sus|add|no|M|5)?[0-9]*(\/[A-G][#b]?)?[*!]?$/;

function transposeToken(token: string, semitones: number, useFlats: boolean): string {
  if (!CHORD_TOKEN.test(token)) return token;

  // Extract root
  const rootMatch = token.match(ROOT_RE);
  if (!rootMatch) return token;
  const root = rootMatch[1];
  const newRoot = transposeNote(root, semitones, useFlats);

  // Replace root at start
  let result = newRoot + token.slice(root.length);

  // Transpose bass note if present
  const bassMatch = result.match(BASS_RE);
  if (bassMatch) {
    const bass = bassMatch[1];
    const newBass = transposeNote(bass, semitones, useFlats);
    result = result.slice(0, result.lastIndexOf("/") + 1) + newBass;
  }

  return result;
}

export function transposeText(text: string, semitones: number): string {
  if (semitones === 0) return text;
  const useFlats = preferFlats(text);
  return text
    .split("\n")
    .map((line) =>
      line
        .split(/(\s+)/)
        .map((part) => (/\s/.test(part) ? part : transposeToken(part, semitones, useFlats)))
        .join("")
    )
    .join("\n");
}

export const SEMITONE_LABELS: Record<number, string> = {
  0: "Original",
  1: "+1",
  2: "+2",
  3: "+3",
  4: "+4",
  5: "+5",
  6: "+6",
  "-1": "-1",
  "-2": "-2",
  "-3": "-3",
  "-4": "-4",
  "-5": "-5",
  "-6": "-6",
};
