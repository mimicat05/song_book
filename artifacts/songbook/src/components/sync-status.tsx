import { useState, useEffect, useCallback } from "react";
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fullSync, getLastSyncAt } from "@/lib/sync";
import { useHasSyncPending } from "@/lib/use-local-db";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return isOnline;
}

export function SyncStatus({ compact = false }: { compact?: boolean }) {
  const isOnline = useOnlineStatus();
  const hasPending = useHasSyncPending();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    getLastSyncAt().then(setLastSync);
  }, [syncing]);

  const handleSync = useCallback(async () => {
    if (!isOnline) {
      toast({ title: "Offline", description: "Connect to the internet to sync.", variant: "destructive" });
      return;
    }
    setSyncing(true);
    try {
      await fullSync((msg) => console.log("[sync]", msg));
      setLastSync(new Date().toISOString());
      toast({ title: "Sync complete", description: "Your library is up to date." });
    } catch (err: any) {
      toast({ title: "Sync failed", description: err?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  }, [isOnline, toast]);

  const lastSyncLabel = lastSync
    ? new Date(lastSync).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Never";

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={handleSync}
          disabled={syncing || !isOnline}
          title={`Last sync: ${lastSyncLabel}`}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : hasPending ? "Sync*" : "Sync"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">{isOnline ? "Online" : "Offline"}</span>
          {hasPending && (
            <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
              Pending changes
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncing || !isOnline}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync Now"}
        </Button>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {lastSync ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            Last synced: {new Date(lastSync).toLocaleString()}
          </>
        ) : (
          <>
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            Never synced — tap Sync Now to download your library
          </>
        )}
      </div>

      {!isOnline && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          You're offline. All your songs are still available locally. Changes you make will sync when you reconnect.
        </p>
      )}
    </div>
  );
}
