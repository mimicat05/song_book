import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useLocalSong } from "@/lib/use-local-db";
import { updateSong } from "@/lib/local-ops";
import { useToast } from "@/hooks/use-toast";
import { SongForm } from "@/components/song-form";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SongEdit() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const songId = parseInt(id || "0", 10);
  const [isSaving, setIsSaving] = useState(false);

  const { data: song, isLoading: isFetching } = useLocalSong(songId);

  const handleSubmit = async (data: any) => {
    setIsSaving(true);
    try {
      await updateSong(songId, data);
      toast({
        title: "Changes saved",
        description: navigator.onLine
          ? "Your song has been updated."
          : "Saved locally — will sync when you reconnect.",
      });
      setLocation(`/songs/${songId}`);
    } catch {
      toast({
        title: "Error",
        description: "Could not save the changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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
          <Button variant="ghost" size="sm" className="-ml-3 mb-2 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Song
          </Button>
        </Link>
        <h1 className="text-4xl font-serif text-foreground tracking-tight">Edit "{song.title}"</h1>
      </div>

      <div className="bg-card p-6 md:p-8 rounded-xl border border-card-border shadow-sm">
        <SongForm
          defaultValues={{
            title: song.title,
            artist: song.artist ?? undefined,
            language: song.language ?? undefined,
            categoryId: song.categoryId ?? undefined,
            key: song.key ?? undefined,
            lyrics: song.lyrics ?? undefined,
          }}
          onSubmit={handleSubmit}
          isLoading={isSaving}
        />
      </div>
    </div>
  );
}
