import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useGetSong, useDeleteSong, getListSongsQueryKey, getGetSongStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Edit, Trash2, Music } from "lucide-react";
import { SongVersionsPanel } from "@/components/song-versions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export default function SongDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const songId = parseInt(id || "0", 10);
  const [activeVersionTitle, setActiveVersionTitle] = useState<string | null>(null);

  const { data: song, isLoading, isError } = useGetSong(songId, { query: { enabled: !!songId } });
  const deleteSong = useDeleteSong();

  const handleDelete = () => {
    deleteSong.mutate(
      { id: songId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSongsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetSongStatsQueryKey() });
          toast({
            title: "Song deleted",
            description: "The song has been removed from your library.",
          });
          setLocation("/songs");
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Could not delete the song.",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-24 bg-muted rounded"></div>
        <div className="h-12 w-64 bg-muted rounded"></div>
        <div className="h-6 w-48 bg-muted rounded"></div>
        <div className="h-[400px] w-full bg-muted rounded-xl mt-8"></div>
      </div>
    );
  }

  if (isError || !song) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <p>Song not found or could not be loaded.</p>
        <Link href="/songs">
          <Button variant="outline" className="mt-4">Back to Library</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <Link href="/songs">
            <Button variant="ghost" size="sm" className="-ml-3 mb-2 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Library
            </Button>
          </Link>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-4xl md:text-5xl font-serif text-foreground tracking-tight">{activeVersionTitle ?? song.title}</h1>
            {song.categoryName && (
              <span
                className="px-3 py-1 rounded-full text-xs font-medium border mt-1 md:mt-0"
                style={{
                  backgroundColor: `${song.categoryColor}15`,
                  color: song.categoryColor,
                  borderColor: `${song.categoryColor}30`
                }}
              >
                {song.categoryName}
              </span>
            )}
          </div>
          {song.artist && (
            <p className="text-xl text-muted-foreground font-serif italic">by {song.artist}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Link href={`/songs/${song.id}/edit`}>
            <Button variant="outline" className="border-border">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive border-border hover:bg-destructive/10">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this song?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. "{song.title}" will be permanently removed from your library.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <SongVersionsPanel
        songId={song.id}
        mainLyrics={song.lyrics}
        mainChords={song.chords}
        mainKey={song.key}
        onVersionChange={setActiveVersionTitle}
      />
    </div>
  );
}
