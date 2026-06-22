import { useState } from "react";
import { Link } from "wouter";
import { useListSongs, useListSongVersions } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Music } from "lucide-react";
import type { Song } from "@workspace/api-client-react";

function SongLanguageCard({ song, language }: { song: Song; language: string }) {
  const { data: versions = [], isLoading } = useListSongVersions(song.id);
  const version = versions.find((v) => v.name === language);

  if (!isLoading && !version) return null;
  if (isLoading) return null;

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
          {version?.key && (
            <span className="inline-block mt-1 text-xs font-mono bg-muted px-2 py-0.5 rounded text-foreground/70">
              Key: {version.key}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function LanguageSongList({ language }: { language: string }) {
  const { data: songs = [], isLoading } = useListSongs();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>No songs in your library yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {songs.map((song) => (
        <SongLanguageCard key={song.id} song={song} language={language} />
      ))}
    </div>
  );
}

export default function LanguagesPage() {
  const [tab, setTab] = useState<"English" | "Tagalog">("English");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-serif tracking-tight text-foreground">Language</h1>
        <p className="text-muted-foreground mt-1">Browse songs by language version</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "English" | "Tagalog")}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="English">🇺🇸 English</TabsTrigger>
          <TabsTrigger value="Tagalog">🇵🇭 Tagalog</TabsTrigger>
        </TabsList>

        <TabsContent value="English" className="mt-6">
          <LanguageSongList language="English" />
        </TabsContent>
        <TabsContent value="Tagalog" className="mt-6">
          <LanguageSongList language="Tagalog" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
