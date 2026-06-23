import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

import Dashboard from "@/pages/dashboard";
import SongsList from "@/pages/songs/index";
import SongNew from "@/pages/songs/new";
import SongDetail from "@/pages/songs/detail";
import SongEdit from "@/pages/songs/edit";
import CategoriesList from "@/pages/categories/index";
import SetlistsList from "@/pages/setlists/index";
import SetlistNew from "@/pages/setlists/new";
import SetlistDetail from "@/pages/setlists/detail";
import LanguagesPage from "@/pages/languages/index";
import Settings from "@/pages/settings";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/songs" component={SongsList} />
        <Route path="/songs/new" component={SongNew} />
        <Route path="/songs/:id" component={SongDetail} />
        <Route path="/songs/:id/edit" component={SongEdit} />
        <Route path="/languages" component={LanguagesPage} />
        <Route path="/categories" component={CategoriesList} />
        <Route path="/setlists" component={SetlistsList} />
        <Route path="/setlists/new" component={SetlistNew} />
        <Route path="/setlists/:id" component={SetlistDetail} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
