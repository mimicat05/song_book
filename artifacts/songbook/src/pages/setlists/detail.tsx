import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { 
  useGetSetlist, 
  useAddSongToSetlist, 
  useRemoveSongFromSetlist, 
  useReorderSetlistSong,
  useDeleteSetlist,
  useListSongs,
  getGetSetlistQueryKey,
  getListSetlistsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Search, Plus, X, GripVertical, Calendar, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { format, parseISO } from "date-fns";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type SetlistSongEntry = {
  id: number;
  position: number;
  songId: number;
  song: {
    id: number;
    title: string;
    artist?: string | null;
    key?: string | null;
  };
};

function SortableSongRow({
  entry,
  onRemove,
}: {
  entry: SetlistSongEntry;
  onRemove: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`bg-card border-card-border overflow-hidden ${isDragging ? "shadow-lg" : ""}`}>
        <CardContent className="p-0 flex items-stretch">
          <div
            className="w-10 flex items-center justify-center border-r border-border shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <div className="p-4 flex-1 flex items-center justify-between gap-4">
            <Link href={`/songs/${entry.song.id}`} className="flex-1 hover:underline decoration-primary/50 underline-offset-4">
              <div className="font-medium text-lg font-serif">{entry.song.title}</div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                {entry.song.artist && <span>{entry.song.artist}</span>}
                {entry.song.key && (
                  <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs text-foreground/80">
                    {entry.song.key}
                  </span>
                )}
              </div>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
              onClick={() => onRemove(entry.id)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SetlistDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const setlistId = parseInt(id || "0", 10);

  const { data: setlist, isLoading, isError } = useGetSetlist(setlistId, { query: { enabled: !!setlistId } as any });
  const [songSearch, setSongSearch] = useState("");
  const { data: allSongs } = useListSongs({ search: songSearch || undefined });

  const addSong = useAddSongToSetlist();
  const removeSong = useRemoveSongFromSetlist();
  const reorderSong = useReorderSetlistSong();
  const deleteSetlist = useDeleteSetlist();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [localOrder, setLocalOrder] = useState<number[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleAddSong = (songId: number) => {
    addSong.mutate(
      { id: setlistId, data: { songId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSetlistQueryKey(setlistId) });
          setLocalOrder(null);
          toast({ title: "Song added to setlist" });
        },
      }
    );
  };

  const handleRemoveSong = (setlistSongEntryId: number) => {
    removeSong.mutate(
      { id: setlistId, songId: setlistSongEntryId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSetlistQueryKey(setlistId) });
          setLocalOrder(null);
        },
      }
    );
  };

  const handleDelete = () => {
    deleteSetlist.mutate(
      { id: setlistId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSetlistsQueryKey() });
          toast({ title: "Setlist deleted" });
          setLocation("/setlists");
        },
      }
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !sortedSongs) return;

    const oldIndex = sortedSongs.findIndex((s) => s.id === active.id);
    const newIndex = sortedSongs.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sortedSongs, oldIndex, newIndex);
    setLocalOrder(reordered.map((s) => s.id));

    const newPosition = newIndex + 1;
    reorderSong.mutate(
      { id: setlistId, songId: sortedSongs[oldIndex].id, data: { position: newPosition } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSetlistQueryKey(setlistId) });
          setLocalOrder(null);
        },
        onError: () => {
          setLocalOrder(null);
          toast({ title: "Could not reorder", variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 w-64 bg-muted rounded"></div>
        <div className="h-8 w-48 bg-muted rounded"></div>
        <div className="space-y-3 mt-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !setlist) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <p>Setlist not found.</p>
        <Link href="/setlists">
          <Button variant="outline" className="mt-4">Back to Setlists</Button>
        </Link>
      </div>
    );
  }

  const baseSorted = [...(setlist.songs || [])].sort((a, b) => a.position - b.position);
  const sortedSongs = localOrder
    ? localOrder.map((id) => baseSorted.find((s) => s.id === id)!).filter(Boolean)
    : baseSorted;

  const existingSongIds = new Set(sortedSongs.map((s) => s.songId));
  const availableSongs = allSongs?.filter((s) => !existingSongIds.has(s.id)) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <Link href="/setlists">
            <Button variant="ghost" size="sm" className="-ml-3 mb-2 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Setlists
            </Button>
          </Link>
          <h1 className="text-4xl md:text-5xl font-serif text-foreground tracking-tight mb-4">{setlist.name}</h1>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground">
            {setlist.date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {format(parseISO(setlist.date), "MMMM d, yyyy")}
              </div>
            )}
            <div className="flex items-center gap-2 font-medium text-foreground">
              {(setlist.songs ?? []).length} songs
            </div>
          </div>
        </div>

        <div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive border-border hover:bg-destructive/10">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this setlist?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. "{setlist.name}" will be permanently deleted. The songs themselves will not be deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="border-t border-border pt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif">Lineup</h2>

          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Song
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Add Song to Setlist</DialogTitle>
              </DialogHeader>
              <div className="relative mt-2 mb-4">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search library..."
                  className="pl-9"
                  value={songSearch}
                  onChange={(e) => setSongSearch(e.target.value)}
                />
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                {availableSongs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No songs found.</div>
                ) : (
                  availableSongs.map((song) => (
                    <div
                      key={song.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <div>
                        <div className="font-medium">{song.title}</div>
                        {song.artist && <div className="text-xs text-muted-foreground">{song.artist}</div>}
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => handleAddSong(song.id)}>
                        Add
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {sortedSongs.length === 0 ? (
          <div className="bg-card/50 border border-dashed border-border rounded-xl p-12 text-center">
            <p className="text-muted-foreground mb-4">No songs in this setlist yet.</p>
            <Button variant="outline" onClick={() => setAddDialogOpen(true)}>
              Browse Library
            </Button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortedSongs.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {sortedSongs.map((entry) => (
                  <SortableSongRow key={entry.id} entry={entry} onRemove={handleRemoveSong} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
