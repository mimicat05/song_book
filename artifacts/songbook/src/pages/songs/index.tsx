import { useState } from "react";
import { Link } from "wouter";
import { useListSongs, useListCategories } from "@workspace/api-client-react";
import type { Song } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, PlusCircle, FilterX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const LANGUAGES = [
  { value: undefined, label: "All" },
  { value: "English", label: "English" },
  { value: "Tagalog", label: "Tagalog" },
];

function LangBadge({ language }: { language: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
      {language}
    </span>
  );
}

function SongCard({ song }: { song: Song }) {
  return (
    <Link href={`/songs/${song.id}`}>
      <Card className="hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer group bg-card border-card-border">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-medium text-foreground group-hover:text-primary transition-colors font-serif">{song.title}</h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              {song.artist && <span>{song.artist}</span>}
              {song.artist && song.key && <span>•</span>}
              {song.key && <span>Key of {song.key}</span>}
            </div>
            {song.language && (
              <div className="mt-1.5">
                <LangBadge language={song.language} />
              </div>
            )}
          </div>
          {song.categoryName && (
            <div className="flex items-center shrink-0">
              <span
                className="px-3 py-1 rounded-full text-xs font-medium border"
                style={{
                  backgroundColor: `${song.categoryColor}15`,
                  color: song.categoryColor,
                  borderColor: `${song.categoryColor}30`
                }}
              >
                {song.categoryName}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function VersionCard({ song, version }: { song: Song; version: { name: string; title?: string | null } }) {
  const versionTitle = version.title || null;

  return (
    <Link href={`/songs/${song.id}`}>
      <Card className="hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer group bg-muted/40 border-card-border">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-background text-muted-foreground border border-border shrink-0">
                {version.name}
              </span>
              {versionTitle && (
                <h3 className="text-xl font-medium text-foreground group-hover:text-primary transition-colors font-serif">{versionTitle}</h3>
              )}
            </div>
            {song.artist && (
              <p className="text-sm text-muted-foreground mt-1">{song.artist}</p>
            )}
          </div>
          {song.categoryName && (
            <div className="flex items-center shrink-0">
              <span
                className="px-3 py-1 rounded-full text-xs font-medium border"
                style={{
                  backgroundColor: `${song.categoryColor}15`,
                  color: song.categoryColor,
                  borderColor: `${song.categoryColor}30`
                }}
              >
                {song.categoryName}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function SongsList() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [language, setLanguage] = useState<string | undefined>(undefined);

  const { data: songs, isLoading } = useListSongs({ search: search || undefined, categoryId, language });
  const { data: categories } = useListCategories();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif text-foreground tracking-tight">Library</h1>
        </div>
        <Link href="/songs/new">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Song
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search titles, lyrics, artists..."
              className="pl-9 bg-card border-card-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {LANGUAGES.map((lang) => (
              <Button
                key={lang.label}
                variant={language === lang.value ? "secondary" : "outline"}
                className="rounded-full shrink-0"
                onClick={() => setLanguage(lang.value)}
              >
                {lang.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Button
            variant={categoryId === undefined ? "secondary" : "outline"}
            className="rounded-full shrink-0"
            onClick={() => setCategoryId(undefined)}
          >
            All Categories
          </Button>
          {categories?.map(cat => (
            <Button
              key={cat.id}
              variant={categoryId === cat.id ? "secondary" : "outline"}
              className="rounded-full shrink-0 flex items-center gap-2"
              onClick={() => setCategoryId(cat.id)}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !songs?.length ? (
        <div className="py-20 text-center border border-dashed rounded-xl border-border bg-card/50">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
            <FilterX className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-serif text-foreground">No songs found</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            {search || categoryId || language ? "Try adjusting your search or filters." : "Your library is empty. Start adding some music."}
          </p>
          {!(search || categoryId || language) && (
            <Link href="/songs/new">
              <Button className="mt-6" variant="outline">Add First Song</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {songs.map((song) => {
            const visibleVersions = (song.versions ?? []).filter(
              (v) => !language || v.name === language
            );
            const showMainCard = !language || song.language === language;
            if (!showMainCard && visibleVersions.length === 0) return null;
            return (
              <div key={song.id} className="space-y-1.5">
                {showMainCard && <SongCard song={song} />}
                {visibleVersions.map((version) => (
                  <VersionCard key={`${song.id}-${version.name}`} song={song} version={version} />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
