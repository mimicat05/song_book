import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useCreateSongVersion,
  useUpdateSongVersion,
  useDeleteSongVersion,
} from "@workspace/api-client-react";
import type { SongVersion } from "@workspace/api-client-react";
import { db } from "@/lib/local-db";
import { useLocalSongVersions } from "@/lib/use-local-db";
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
import { isTempId } from "@/lib/local-db";

const versionSchema = z.object({
  name: z.string().min(1, "Language is required"),
  title: z.string().optional(),
  artist: z.string().optional(),
  lyrics: z.string().optional(),
  chords: z.string().optional(),
  key: z.string().optional(),
});
type VersionFormValues = z.infer<typeof versionSchema>;

interface VersionFormProps {
  songId: number;
  editing: SongVersion | null;
  onClose: () => void;
}

function VersionForm({ songId, editing, onClose }: VersionFormProps) {
  const { toast } = useToast();
  const createVersion = useCreateSongVersion();
  const updateVersion = useUpdateSongVersion();

  const form = useForm<VersionFormValues>({
    resolver: zodResolver(versionSchema),
    defaultValues: {
      name: editing?.name ?? "",
      title: editing?.title ?? "",
      artist: editing?.artist ?? "",
      lyrics: editing?.lyrics ?? "",
      chords: editing?.chords ?? "",
      key: editing?.key ?? "",
    },
  });

  const isSubmitting = createVersion.isPending || updateVersion.isPending;

  const handleSubmit = async (data: VersionFormValues) => {
    const now = new Date().toISOString();

    if (isTempId(songId)) {
      toast({
        title: "Sync required",
        description: "Please sync this song to the server before adding versions.",
        variant: "destructive",
      });
      return;
    }

    const onSuccess = async (result: any) => {
      await db.songVersions.put({
        id: result.id,
        songId,
        name: result.name,
        title: result.title ?? null,
        artist: result.artist ?? null,
        lyrics: result.lyrics ?? null,
        chords: result.chords ?? null,
        key: result.key ?? null,
        createdAt: result.createdAt ?? now,
        updatedAt: result.updatedAt ?? now,
        syncPending: false,
        pendingDelete: false,
      });
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
    <div className="bg-card p-6 md:p-8 rounded-xl border border-card-border shadow-sm space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-serif text-foreground tracking-tight">
          {editing ? `Edit "${editing.name}"` : "Add New Version"}
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title in this language</FormLabel>
                  <FormControl>
                    <Input placeholder="Leave blank to use the main title" {...field} className="text-lg bg-card" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="artist"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Artist</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Leonard Cohen" {...field} className="bg-card" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-card">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="English">🇺🇸 English</SelectItem>
                      <SelectItem value="Tagalog">🇵🇭 Tagalog</SelectItem>
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
                    <Input placeholder="e.g. C Major" {...field} className="bg-card" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="lyrics"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel>Lyrics</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your lyrics here..."
                      className="min-h-[300px] text-lg font-serif leading-relaxed resize-y bg-card"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end pt-4">
            <div className="flex gap-3 w-full md:w-auto">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 md:flex-none md:min-w-[120px]">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 md:flex-none md:min-w-[150px] text-lg py-6" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : editing ? "Save Changes" : "Add Version"}
              </Button>
            </div>
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
  onVersionChange?: (versionTitle: string | null) => void;
}

export function SongVersionsPanel({ songId, mainLyrics, mainChords, mainKey, onVersionChange }: SongVersionsPanelProps) {
  const { toast } = useToast();
  const { data: versions, isLoading } = useLocalSongVersions(songId);
  const deleteVersion = useDeleteSongVersion();

  const [formMode, setFormMode] = useState<null | "add" | SongVersion>(null);
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
        onSuccess: async () => {
          await db.songVersions.delete(v.id);
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

  const versionsAsServerType: SongVersion[] = versions.map((v) => ({
    id: v.id,
    songId: v.songId,
    name: v.name,
    title: v.title ?? null,
    artist: v.artist ?? null,
    lyrics: v.lyrics ?? null,
    chords: v.chords ?? null,
    key: v.key ?? null,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  }));

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
        <Tabs defaultValue="original" onValueChange={(val) => {
          if (val === "original") {
            onVersionChange?.(null);
          } else {
            const v = versionsAsServerType.find((v) => String(v.id) === val);
            onVersionChange?.(v?.title ?? null);
          }
        }}>
          <TabsList className="flex flex-wrap gap-1 h-auto bg-muted/50 p-1">
            <TabsTrigger value="original" className="text-sm">Original</TabsTrigger>
            {versionsAsServerType.map((v) => (
              <TabsTrigger key={v.id} value={String(v.id)} className="text-sm">{v.name}</TabsTrigger>
            ))}
          </TabsList>

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
                  <TransposeControl semitones={getSemitones("original")} onChange={(n) => setTabSemitones("original", n)} />
                </div>
                <div className="bg-white dark:bg-zinc-950 rounded-xl border border-border shadow-sm p-6 overflow-x-auto">
                  <ChordChart
                    text={transposeText(
                      [mainLyrics, mainChords].filter(Boolean).join("\n\n"),
                      getSemitones("original")
                    )}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-card/50 border border-dashed border-border p-10 text-center rounded-xl">
                <p className="text-muted-foreground">No lyrics or chords for the original version.</p>
              </div>
            )}
          </TabsContent>

          {versionsAsServerType.map((v) => {
            const tabKey = String(v.id);
            const st = getSemitones(tabKey);
            return (
              <TabsContent key={v.id} value={tabKey} className="mt-4">
                <div className="space-y-4">
                  {(v.title || v.artist) && (
                    <div>
                      {v.title && <p className="text-lg font-serif text-foreground">{v.title}</p>}
                      {v.artist && <p className="text-sm italic text-muted-foreground">by {v.artist}</p>}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      {v.key && (
                        <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1.5">
                          <Music className="w-3.5 h-3.5 opacity-70" />
                          Key: {v.key}
                        </Badge>
                      )}
                      <TransposeControl semitones={st} onChange={(n) => setTabSemitones(tabKey, n)} />
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
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}
