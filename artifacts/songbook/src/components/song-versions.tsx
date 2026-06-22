import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useListSongVersions,
  useCreateSongVersion,
  useUpdateSongVersion,
  useDeleteSongVersion,
  getListSongVersionsQueryKey,
} from "@workspace/api-client-react";
import type { SongVersion } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChordChart } from "@/components/chord-chart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Loader2, Music } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const versionSchema = z.object({
  name: z.string().min(1, "Version name is required"),
  lyrics: z.string().optional(),
  chords: z.string().optional(),
  key: z.string().optional(),
  notes: z.string().optional(),
});
type VersionFormValues = z.infer<typeof versionSchema>;

interface VersionFormDialogProps {
  songId: number;
  existing?: SongVersion;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function VersionFormDialog({ songId, existing, open, onOpenChange }: VersionFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createVersion = useCreateSongVersion();
  const updateVersion = useUpdateSongVersion();

  const form = useForm<VersionFormValues>({
    resolver: zodResolver(versionSchema),
    defaultValues: {
      name: existing?.name ?? "",
      lyrics: existing?.lyrics ?? "",
      chords: existing?.chords ?? "",
      key: existing?.key ?? "",
      notes: existing?.notes ?? "",
    },
  });

  const isLoading = createVersion.isPending || updateVersion.isPending;

  const handleSubmit = (data: VersionFormValues) => {
    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: getListSongVersionsQueryKey(songId) });
      toast({
        title: existing ? "Version updated" : "Version added",
        description: existing
          ? `"${data.name}" has been updated.`
          : `"${data.name}" version has been added.`,
      });
      onOpenChange(false);
      form.reset();
    };
    const onError = () => {
      toast({ title: "Error", description: "Could not save the version.", variant: "destructive" });
    };

    if (existing) {
      updateVersion.mutate({ id: songId, versionId: existing.id, data }, { onSuccess, onError });
    } else {
      createVersion.mutate({ id: songId, data }, { onSuccess, onError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) form.reset({ name: existing?.name ?? "", lyrics: existing?.lyrics ?? "", chords: existing?.chords ?? "", key: existing?.key ?? "", notes: existing?.notes ?? "" }); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Version" : "Add New Version"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Version Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Tagalog, Live, Acoustic" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. G Major" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="lyrics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lyrics</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write the lyrics for this version..."
                      className="min-h-[200px] font-serif text-base leading-relaxed resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="chords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chords</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="[C] [G] [Am] [F]"
                      className="min-h-[100px] font-mono resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Performance notes for this version..."
                      className="min-h-[80px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  existing ? "Save Changes" : "Add Version"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface SongVersionsPanelProps {
  songId: number;
  mainLyrics?: string | null;
  mainChords?: string | null;
  mainKey?: string | null;
  mainNotes?: string | null;
}

export function SongVersionsPanel({
  songId,
  mainLyrics,
  mainChords,
  mainKey,
  mainNotes,
}: SongVersionsPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: versions = [], isLoading } = useListSongVersions(songId);
  const deleteVersion = useDeleteSongVersion();

  const [addOpen, setAddOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<SongVersion | null>(null);

  const handleDelete = (version: SongVersion) => {
    deleteVersion.mutate(
      { id: songId, versionId: version.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSongVersionsQueryKey(songId) });
          toast({ title: "Version deleted", description: `"${version.name}" has been removed.` });
        },
        onError: () => {
          toast({ title: "Error", description: "Could not delete the version.", variant: "destructive" });
        },
      }
    );
  };

  const hasMainContent = mainLyrics || mainChords;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground font-mono">
          Versions
        </h2>
        <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add Version
        </Button>
      </div>

      {isLoading ? (
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
      ) : (
        <Tabs defaultValue="original">
          <TabsList className="flex flex-wrap gap-1 h-auto bg-muted/50 p-1">
            <TabsTrigger value="original" className="text-sm">
              Original
            </TabsTrigger>
            {versions.map((v) => (
              <TabsTrigger key={v.id} value={String(v.id)} className="text-sm">
                {v.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="original" className="mt-4">
            {hasMainContent ? (
              <div className="space-y-4">
                {mainKey && (
                  <Badge variant="secondary" className="flex items-center gap-1 w-fit px-3 py-1.5">
                    <Music className="w-3.5 h-3.5 opacity-70" />
                    Key: {mainKey}
                  </Badge>
                )}
                <div className="bg-white dark:bg-zinc-950 rounded-xl border border-border shadow-sm p-6 overflow-x-auto">
                  <ChordChart text={[mainLyrics, mainChords].filter(Boolean).join("\n\n")} />
                </div>
                {mainNotes && (
                  <div className="bg-[#fff9e6] dark:bg-yellow-900/10 p-5 rounded-xl border border-yellow-200/50">
                    <p className="text-sm font-semibold uppercase tracking-wider text-yellow-800/70 mb-2 font-mono">Notes</p>
                    <p className="whitespace-pre-wrap text-foreground/80 font-serif leading-relaxed">{mainNotes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-card/50 border border-dashed border-border p-10 text-center rounded-xl">
                <p className="text-muted-foreground">No lyrics or chords for the original version.</p>
              </div>
            )}
          </TabsContent>

          {versions.map((v) => (
            <TabsContent key={v.id} value={String(v.id)} className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {v.key && (
                      <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1.5">
                        <Music className="w-3.5 h-3.5 opacity-70" />
                        Key: {v.key}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingVersion(v)}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{v.name}" version?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(v)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {(v.lyrics || v.chords) ? (
                  <div className="bg-white dark:bg-zinc-950 rounded-xl border border-border shadow-sm p-6 overflow-x-auto">
                    <ChordChart text={[v.lyrics, v.chords].filter(Boolean).join("\n\n")} />
                  </div>
                ) : (
                  <div className="bg-card/50 border border-dashed border-border p-10 text-center rounded-xl">
                    <p className="text-muted-foreground">No lyrics or chords yet.</p>
                    <Button variant="link" className="mt-1 text-primary" onClick={() => setEditingVersion(v)}>
                      Add some now
                    </Button>
                  </div>
                )}

                {v.notes && (
                  <div className="bg-[#fff9e6] dark:bg-yellow-900/10 p-5 rounded-xl border border-yellow-200/50">
                    <p className="text-sm font-semibold uppercase tracking-wider text-yellow-800/70 mb-2 font-mono">Notes</p>
                    <p className="whitespace-pre-wrap text-foreground/80 font-serif leading-relaxed">{v.notes}</p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      <VersionFormDialog
        songId={songId}
        open={addOpen}
        onOpenChange={setAddOpen}
      />
      {editingVersion && (
        <VersionFormDialog
          songId={songId}
          existing={editingVersion}
          open={!!editingVersion}
          onOpenChange={(o) => { if (!o) setEditingVersion(null); }}
        />
      )}
    </div>
  );
}
