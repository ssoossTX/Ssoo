import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { useState, useEffect } from "react";

// Компонент нормальной страницы Home без параметров
function NormalHome() {
  return <Home />;
}

// Компонент статической страницы Home с параметром isStatic
function StaticHome() {
  return <Home isStatic={true} />;
}

function Router() {  
  return (
    <Switch>
      <Route path="/" component={NormalHome} />
      <Route component={NotFound} />
    </Switch>
  );
}

interface AppProps {
  staticMode?: boolean;
}

function App({ staticMode = false }: AppProps) {
  const [mounted, setMounted] = useState(false);

  // This ensures hydration mismatch doesn't occur due to server/client theme differences
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      {staticMode ? <StaticHome /> : <Router />}
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
