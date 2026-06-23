import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Music, Clock, FolderGit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalSongStats } from "@/lib/use-local-db";

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useLocalSongStats();

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div>
          <div className="h-10 w-48 bg-muted rounded-md mb-2"></div>
          <div className="h-5 w-64 bg-muted rounded-md"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-muted rounded-xl"></div>
          <div className="h-32 bg-muted rounded-xl"></div>
          <div className="h-32 bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>Could not load dashboard. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif text-foreground tracking-tight">Welcome back</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/songs/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Song
            </Button>
          </Link>
          <Link href="/setlists/new">
            <Button variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Setlist
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-card-border shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-muted-foreground">Total Songs</CardTitle>
            <Music className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-serif">{stats.total}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Recently Added
            </h2>
            <Link href="/songs" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          {(stats.recentSongs ?? []).length === 0 ? (
            <Card className="border-dashed bg-transparent border-muted">
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>No songs yet. Time to start writing.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {(stats.recentSongs ?? []).map((song) => (
                <Link key={song.id} href={`/songs/${song.id}`}>
                  <Card className="hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer group bg-card border-card-border">
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-serif text-foreground group-hover:text-primary transition-colors text-lg">{song.title}</h3>
                        {song.artist && <p className="text-sm text-muted-foreground">{song.artist}</p>}
                      </div>
                      {song.categoryName && (
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${song.categoryColor}15`,
                            color: song.categoryColor ?? undefined,
                          }}
                        >
                          {song.categoryName}
                        </span>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-muted-foreground" />
              Categories
            </h2>
            <Link href="/categories" className="text-sm text-primary hover:underline">Manage</Link>
          </div>
          {(stats.byCategory ?? []).length === 0 ? (
            <Card className="border-dashed bg-transparent border-muted">
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>No categories yet. Create some to organize your music.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {(stats.byCategory ?? []).map((cat) => (
                <Link key={cat.categoryId || 'uncategorized'} href={cat.categoryId ? `/songs?categoryId=${cat.categoryId}` : '/songs'}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer shadow-sm bg-card border-card-border">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {cat.categoryColor && (
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.categoryColor }} />
                        )}
                        <span className="font-medium">{cat.categoryName || 'Uncategorized'}</span>
                      </div>
                      <span className="text-muted-foreground text-sm">{cat.count}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
