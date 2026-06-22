import { useLocation } from "wouter";
import { useCreateSong, getListSongsQueryKey, getGetSongStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { SongForm } from "@/components/song-form";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function SongNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createSong = useCreateSong();

  const handleSubmit = (data: any) => {
    createSong.mutate(
      { data },
      {
        onSuccess: (song) => {
          queryClient.invalidateQueries({ queryKey: getListSongsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetSongStatsQueryKey() });
          toast({
            title: "Song saved",
            description: "Your new song has been added to the library.",
          });
          setLocation(`/songs/${song.id}`);
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Could not save the song. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <Link href="/songs">
          <Button variant="ghost" size="sm" className="-ml-3 mb-2 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Library
          </Button>
        </Link>
        <h1 className="text-4xl font-serif text-foreground tracking-tight">New Song</h1>
      </div>

      <div className="bg-card p-6 md:p-8 rounded-xl border border-card-border shadow-sm">
        <SongForm onSubmit={handleSubmit} isLoading={createSong.isPending} />
      </div>
    </div>
  );
}
