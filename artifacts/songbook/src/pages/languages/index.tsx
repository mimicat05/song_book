import { useState } from "react";
import { Link } from "wouter";
import { useListSongs, useListSongVersions } from "@workspace/api-client-react";
import { Globe, Music } from "lucide-react";
import type { Song } from "@workspace/api-client-react";

function SongRow({ song }: { song: Song }) {
  return (
    <Link href={`/songs/${song.id}`}>
      <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors cursor-pointer">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Music className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{song.title}</p>
          {song.artist && (
            <p className="text-sm text-muted-foreground italic truncate">by {song.artist}</p>
          )}
          {song.key && (
            <span className="inline-block mt-1 text-xs font-mono bg-muted px-2 py-0.5 rounded text-foreground/70">
              Key: {song.key}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function TagalogSongRow({ song }: { song: Song }) {
  const { data: versions } = useListSongVersions(song.id);
  const tagalog = (versions ?? []).find((v) => v.name === "Tagalog");
  if (!tagalog) return null;
  return (
    <Link href={`/songs/${song.id}`}>
      <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors cursor-pointer">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Music className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{song.title}</p>
          {song.artist && (
            <p className="text-sm text-muted-foreground italic truncate">by {song.artist}</p>
          )}
          {tagalog.key && (
            <span className="inline-block mt-1 text-xs font-mono bg-muted px-2 py-0.5 rounded text-foreground/70">
              Key: {tagalog.key}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function LanguagesPage() {
  const [tab, setTab] = useState<"English" | "Tagalog">("English");
  const { data, isLoading } = useListSongs({ search: undefined, categoryId: undefined });
  const songs: Song[] = data ?? [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-serif tracking-tight text-foreground">Language</h1>
        <p className="text-muted-foreground mt-1">Browse songs by language version</p>
      </div>

      <div className="space-y-6">
        <div className="flex gap-0 border-b border-border">
          {(["English", "Tagalog"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setTab(lang)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === lang
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {lang === "English" ? "🇺🇸" : "🇵🇭"} {lang}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : songs.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No songs yet. Add some from the Songs page.</p>
          </div>
        ) : tab === "English" ? (
          <div className="space-y-3">
            {songs.map((song) => (
              <SongRow key={song.id} song={song} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {songs.map((song) => (
              <TagalogSongRow key={song.id} song={song} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
