import { Link, useLocation } from "wouter";
import { Music, ListMusic, Tags, Home, Settings } from "lucide-react";
import { ThemeProvider } from "./theme-provider";
import { SyncStatus } from "./sync-status";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/songs", label: "Songs", icon: Music },
    { href: "/setlists", label: "Setlists", icon: ListMusic },
    { href: "/categories", label: "Categories", icon: Tags },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <ThemeProvider defaultTheme="system" storageKey="songbook-theme">
      <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
        <nav className="w-full md:w-64 bg-sidebar border-b md:border-b-0 md:border-r border-sidebar-border shrink-0 md:h-screen sticky top-0 z-10 flex flex-col">
          <div className="p-6 pb-4">
            <h1 className="text-2xl font-serif font-bold text-sidebar-foreground tracking-tight flex items-center gap-2">
              <Music className="w-6 h-6 text-sidebar-primary" />
              Songbook
            </h1>
          </div>
          <div className="flex-1 overflow-y-auto py-2 px-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors cursor-pointer shrink-0 ${isActive ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}>
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="px-4 py-4 border-t border-sidebar-border hidden md:block">
            <SyncStatus compact />
          </div>
        </nav>

        <main className="flex-1 overflow-y-auto bg-background p-6 md:p-12 relative">
          <div className="max-w-5xl mx-auto pb-24">
            {children}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
