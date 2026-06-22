import { useLocation, Link } from "wouter";
import { useCreateSetlist, getListSetlistsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";

const setlistSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  venue: z.string().optional(),
  date: z.string().optional(),
});

export default function SetlistNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createSetlist = useCreateSetlist();

  const form = useForm({
    resolver: zodResolver(setlistSchema),
    defaultValues: {
      name: "",
      description: "",
      venue: "",
      date: "",
    },
  });

  const onSubmit = (data: z.infer<typeof setlistSchema>) => {
    createSetlist.mutate(
      { data },
      {
        onSuccess: (setlist) => {
          queryClient.invalidateQueries({ queryKey: getListSetlistsQueryKey() });
          toast({ title: "Setlist created" });
          setLocation(`/setlists/${setlist.id}`);
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to create setlist", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <div>
        <Link href="/setlists">
          <Button variant="ghost" size="sm" className="-ml-3 mb-2 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Setlists
          </Button>
        </Link>
        <h1 className="text-4xl font-serif text-foreground tracking-tight">New Setlist</h1>
      </div>

      <div className="bg-card p-6 md:p-8 rounded-xl border border-card-border shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Setlist Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Summer Tour 2024" className="text-lg bg-card" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. The Bluebird Cafe" className="bg-card" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="bg-card block w-full" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description / Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Theme, target duration, other details..." 
                      className="min-h-[100px] bg-card" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={createSetlist.isPending} className="min-w-[150px]">
                {createSetlist.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Setlist"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
