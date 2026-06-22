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
import { TransposeControl } from "@/components/transpose-control";
import { transposeText } from "@/lib/transpose";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
import { Plus, Pencil, Trash2, Loader2, Music, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const versionSchema = z.object({
  name: z.string().min(1, "Version name is required"),
  lyrics: z.string().optional(),
  chords: z.string().optional(),
  key: z.string().optional(),
  notes: z.string().optional(),
});
type VersionFormValues = z.infer<typeof versionSchema>;

interface VersionFormProps {
  songId: number;
  editing: SongVersion | null;
  onClose: () => void;
}

function VersionForm({ songId, editing, onClose }: VersionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createVersion = useCreateSongVersion();
  const updateVersion = useUpdateSongVersion();

  const form = useForm<VersionFormValues>({
    resolver: zodResolver(versionSchema),
    defaultValues: {
      name: editing?.name ?? "",
      lyrics: editing?.lyrics ?? "",
      chords: editing?.chords ?? "",
      key: editing?.key ?? "",
      notes: editing?.notes ?? "",
    },
  });

  const isSubmitting = createVersion.isPending || updateVersion.isPending;

  const handleSubmit = (data: VersionFormValues) => {
    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: getListSongVersionsQueryKey(songId) });
      toast({
        title: editing ? "Version updated" : "Version added",
        description: `"${data.name}" has been ${editing ? "updated" : "added"}.`,
      });
      onClose();
    };
    const onError = () => {
      toast({ title: "Error", description: "Could not save the version.", variant: "destructive" });
    };

    if (editing) {
      updateVersion.mutate({ id: songId, versionId: editing.id, data }, { onSuccess, onError });
    } else {
      createVersion.mutate({ id: songId, data }, { onSuccess, onError });
    }
  };

  return (
    <div className="border border-border rounded-xl p-6 bg-card space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base">
          {editing ? `Edit "${editing.name}"` : "Add New Version"}
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Tagalog">Tagalog</SelectItem>
                    </SelectContent>
                  </Select>
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
                    className="min-h-[200px] font-serif text-base leading-relaxed resize-y bg-background"
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
                    className="min-h-[70px] resize-y bg-background"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editing ? "Save Changes" : "Add Version"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
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

  const [formMode, setFormMode] = useState<null | "add" | SongVersion>(null);
  // semitones per tab: "original" | version id as string
  const [semitones, setSemitones] = useState<Record<string, number>>({});

  const openAdd = () => setFormMode("add");
  const openEdit = (v: SongVersion) => setFormMode(v);
  const closeForm = () => setFormMode(null);

  const getSemitones = (key: string) => semitones[key] ?? 0;
  const setTabSemitones = (key: string, n: number) =>
    setSemitones((prev) => ({ ...prev, [key]: n }));

  const handleDelete = (v: SongVersion) => {
    deleteVersion.mutate(
      { id: songId, versionId: v.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSongVersionsQueryKey(songId) });
          toast({ title: "Version deleted", description: `"${v.name}" has been removed.` });
        },
        onError: () => {
          toast({ title: "Error", description: "Could not delete the version.", variant: "destructive" });
        },
      }
    );
  };

  const hasMainContent = mainLyrics || mainChords;
  const editingVersion = formMode !== null && formMode !== "add" ? (formMode as SongVersion) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground font-mono">
          Versions
        </h2>
        {formMode === null && (
          <Button variant="outline" size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4 mr-1" />
            Add Version
          </Button>
        )}
      </div>

      {formMode !== null && (
        <VersionForm songId={songId} editing={editingVersion} onClose={closeForm} />
      )}

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

          {/* ── Original tab ── */}
          <TabsContent value="original" className="mt-4">
            {hasMainContent ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  {mainKey && (
                    <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1.5">
                      <Music className="w-3.5 h-3.5 opacity-70" />
                      Key: {mainKey}
                    </Badge>
                  )}
                  <TransposeControl
                    semitones={getSemitones("original")}
                    onChange={(n) => setTabSemitones("original", n)}
                  />
                </div>
                <div className="bg-white dark:bg-zinc-950 rounded-xl border border-border shadow-sm p-6 overflow-x-auto">
                  <ChordChart
                    text={transposeText(
                      [mainLyrics, mainChords].filter(Boolean).join("\n\n"),
                      getSemitones("original")
                    )}
                  />
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

          {/* ── Additional version tabs ── */}
          {versions.map((v) => {
            const tabKey = String(v.id);
            const st = getSemitones(tabKey);
            return (
              <TabsContent key={v.id} value={tabKey} className="mt-4">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      {v.key && (
                        <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1.5">
                          <Music className="w-3.5 h-3.5 opacity-70" />
                          Key: {v.key}
                        </Badge>
                      )}
                      <TransposeControl
                        semitones={st}
                        onChange={(n) => setTabSemitones(tabKey, n)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(v)}>
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
                            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
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
                      <ChordChart
                        text={transposeText(
                          [v.lyrics, v.chords].filter(Boolean).join("\n\n"),
                          st
                        )}
                      />
                    </div>
                  ) : (
                    <div className="bg-card/50 border border-dashed border-border p-10 text-center rounded-xl">
                      <p className="text-muted-foreground">No lyrics or chords yet.</p>
                      <Button variant="link" className="mt-1 text-primary" onClick={() => openEdit(v)}>
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
            );
          })}
        </Tabs>
      )}
    </div>
  );
}
