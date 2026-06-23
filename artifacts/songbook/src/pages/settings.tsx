import { useRef, useState } from "react";
import { Download, Upload, Database, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SyncStatus } from "@/components/sync-status";
import { exportLocalData, importSongPack } from "@/lib/sync";
import { db } from "@/lib/local-db";
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

export default function Settings() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const json = await exportLocalData();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `songbook-export-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export complete", description: "Your song pack has been downloaded." });
    } catch (err: any) {
      toast({ title: "Export failed", description: err?.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const result = await importSongPack(text);
      toast({
        title: "Import complete",
        description: `${result.imported} records imported successfully.`,
      });
    } catch (err: any) {
      toast({ title: "Import failed", description: err?.message, variant: "destructive" });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClearLocalData = async () => {
    await db.songs.clear();
    await db.categories.clear();
    await db.setlists.clear();
    await db.setlistSongs.clear();
    await db.songVersions.clear();
    await db.syncMeta.clear();
    toast({ title: "Local data cleared", description: "All local data has been removed. Sync to restore from server." });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">
      <div>
        <h1 className="text-4xl font-serif text-foreground tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your local data, sync, and backups.</p>
      </div>

      <Card className="bg-card border-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="w-5 h-5 text-primary" />
            Sync
          </CardTitle>
          <CardDescription>
            Keep your local library in sync with the server. Songs are always readable offline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SyncStatus />
        </CardContent>
      </Card>

      <Card className="bg-card border-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-primary" />
            Export Song Pack
          </CardTitle>
          <CardDescription>
            Export all songs, lyrics, chords, categories, and setlists to a JSON file. Use this to back up your data or transfer it to another device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} disabled={exporting} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            {exporting ? "Exporting..." : "Export Song Pack"}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="w-5 h-5 text-primary" />
            Import Song Pack
          </CardTitle>
          <CardDescription>
            Import a previously exported JSON file. Existing songs will be updated; new songs will be added. No data will be deleted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileSelected}
          />
          <Button
            variant="outline"
            onClick={handleImportClick}
            disabled={importing}
            className="w-full sm:w-auto"
          >
            <Upload className="w-4 h-4 mr-2" />
            {importing ? "Importing..." : "Choose File to Import"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Accepts .json files exported from this app. Imported songs are marked for sync and will upload to the server on next sync.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-card-border border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-destructive">
            <Trash2 className="w-5 h-5" />
            Clear Local Data
          </CardTitle>
          <CardDescription>
            Remove all locally stored songs and data from this device. This does not delete anything from the server. Sync to restore your library.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Local Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all local data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all songs, categories, and setlists from this device's local storage. Your data on the server is safe. You can restore it by syncing.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearLocalData}
                  className="bg-destructive text-destructive-foreground"
                >
                  Clear Local Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
