import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { SongForm } from "@/components/song-form";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { createSong } from "@/lib/local-ops";

export default function SongNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const { id, isTemp } = await createSong(data);
      if (isTemp) {
        toast({
          title: "Song saved locally",
          description: "You're offline. This song will sync to the server when you reconnect.",
        });
      } else {
        toast({
          title: "Song saved",
          description: "Your new song has been added to the library.",
        });
      }
      setLocation(`/songs/${id}`);
    } catch {
      toast({
        title: "Error",
        description: "Could not save the song. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
        <SongForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}
