import { Link } from "wouter";
import { useLocalSetlists } from "@/lib/use-local-db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, Calendar, ListMusic } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function SetlistsList() {
  const { data: setlists, isLoading } = useLocalSetlists();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif text-foreground tracking-tight">Setlists</h1>
        </div>
        <Link href="/setlists/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Setlist
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !setlists?.length ? (
        <div className="py-20 text-center border border-dashed rounded-xl border-border bg-card/50">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
            <ListMusic className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-serif text-foreground">No setlists yet</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            Create a setlist to organize songs for your next performance or practice session.
          </p>
          <Link href="/setlists/new">
            <Button className="mt-6" variant="outline">Create Setlist</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {setlists.map((setlist) => (
            <Link key={setlist.id} href={`/setlists/${setlist.id}`}>
              <Card className="hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer h-full bg-card border-card-border group">
                <CardContent className="p-6 flex flex-col h-full justify-between">
                  <div>
                    <h3 className="text-xl font-medium font-serif group-hover:text-primary transition-colors">{setlist.name}</h3>
                  </div>
                  <div className="mt-6 pt-4 border-t border-border flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <ListMusic className="w-4 h-4 text-primary" />
                      {setlist.songCount} {setlist.songCount === 1 ? 'song' : 'songs'}
                    </div>
                    {setlist.date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {format(parseISO(setlist.date), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
