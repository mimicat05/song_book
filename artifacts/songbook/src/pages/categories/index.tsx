import { useState } from "react";
import { useListCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit2, Trash2, Save, X } from "lucide-react";
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

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().min(1, "Color is required"),
});

export default function CategoriesList() {
  const { data: categories, isLoading } = useListCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      color: "#f97316", // default orange/warm
    },
  });

  const handleCreate = (data: z.infer<typeof categorySchema>) => {
    createCategory.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
          toast({ title: "Category created" });
          setIsCreating(false);
          form.reset();
        },
      }
    );
  };

  const handleUpdate = (id: number, data: z.infer<typeof categorySchema>) => {
    updateCategory.mutate(
      { id, data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
          toast({ title: "Category updated" });
          setEditingId(null);
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteCategory.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
          toast({ title: "Category deleted" });
        },
      }
    );
  };

  const startEdit = (cat: any) => {
    form.reset({ name: cat.name, color: cat.color });
    setEditingId(cat.id);
    setIsCreating(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif text-foreground tracking-tight">Categories</h1>
        </div>
        {!isCreating && (
          <Button onClick={() => {
            setIsCreating(true);
            setEditingId(null);
            form.reset({ name: "", color: "#f97316" });
          }} className="bg-primary text-primary-foreground">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Category
          </Button>
        )}
      </div>

      <div className="space-y-4 max-w-2xl">
        {isCreating && (
          <Card className="border-primary/50 shadow-md">
            <CardContent className="p-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreate)} className="flex items-end gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Originals" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input type="color" className="w-12 h-10 p-1 bg-card cursor-pointer" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createCategory.isPending}>
                      Save
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {categories?.map((cat) => (
              <Card key={cat.id} className="bg-card border-card-border overflow-hidden">
                {editingId === cat.id ? (
                  <CardContent className="p-4 bg-muted/30">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit((d) => handleUpdate(cat.id, d))} className="flex items-end gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="color"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="color" className="w-12 h-10 p-1 bg-card cursor-pointer" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <div className="flex gap-2">
                          <Button type="button" variant="ghost" size="icon" onClick={() => setEditingId(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                          <Button type="submit" size="icon" disabled={updateCategory.isPending}>
                            <Save className="w-4 h-4" />
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                ) : (
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: cat.color }} />
                      <span className="font-medium text-lg">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity" style={{ opacity: 1 }}>
                      <Button variant="ghost" size="icon" onClick={() => startEdit(cat)}>
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete category?</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{cat.name}" will be deleted. Songs in this category will not be deleted, but they will lose this categorization.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(cat.id)} className="bg-destructive text-destructive-foreground">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
            {categories?.length === 0 && !isCreating && (
              <div className="py-12 text-center text-muted-foreground border border-dashed rounded-xl border-border">
                No categories yet. Create one to get started.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
