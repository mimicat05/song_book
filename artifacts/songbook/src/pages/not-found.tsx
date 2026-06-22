import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
        <Music className="w-10 h-10 text-muted-foreground" />
      </div>
      <h1 className="text-4xl font-serif font-bold text-foreground mb-4">Song not found</h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-md">
        We couldn't find the page you're looking for. It might have been moved or deleted.
      </p>
      <Link href="/">
        <Button size="lg" className="font-medium text-lg px-8">
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
