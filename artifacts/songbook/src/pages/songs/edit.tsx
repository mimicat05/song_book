import { useParams, useLocation, Link } from "wouter";
import { useGetSong, useUpdateSong, getListSongsQueryKey, getGetSongQueryKey, getGetSongStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { SongForm } from "@/components/song-form";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SongEdit() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const songId = parseInt(id || "0", 10);

  const { data: song, isLoading: isFetching } = useGetSong(songId, { query: { enabled: !!songId } });
  const updateSong = useUpdateSong();

  const handleSubmit = (data: any) => {
    updateSong.mutate(
      { id: songId, data },
      {
        onSuccess: (updatedSong) => {
          queryClient.invalidateQueries({ queryKey: getListSongsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetSongQueryKey(songId) });
          queryClient.invalidateQueries({ queryKey: getGetSongStatsQueryKey() });
          toast({
            title: "Changes saved",
            description: "Your song has been updated.",
          });
          setLocation(`/songs/${updatedSong.id}`);
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Could not save the changes. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isFetching) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 w-64 bg-muted rounded"></div>
        <div className="h-[600px] w-full bg-muted rounded-xl"></div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <p>Song not found.</p>
        <Link href="/songs">
          <Button variant="outline" className="mt-4">Back to Library</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <Link href={`/songs/${song.id}`}>
          <Button variant="ghost" size="sm" className="-ml-3 mb-4 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Song
          </Button>
        </Link>
        <h1 className="text-4xl font-serif text-foreground tracking-tight">Edit "{song.title}"</h1>
      </div>

      <div className="bg-card p-6 md:p-8 rounded-xl border border-card-border shadow-sm">
        <SongForm 
          defaultValues={song} 
          onSubmit={handleSubmit} 
          isLoading={updateSong.isPending} 
        />
      </div>
    </div>
  );
}
