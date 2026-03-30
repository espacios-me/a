// import { Toaster } from "@/components/ui/sonner"
// import { TooltipProvider } from "@/components/ui/tooltip"
import NotFound from "@/pages/NotFound"
import { Route, Switch } from "wouter"
import ErrorBoundary from "./components/ErrorBoundary"
import { ThemeProvider } from "./contexts/ThemeContext"
import Home from "./pages/Home"
import IntegrationsDashboard from "./pages/IntegrationsDashboard"
import Chat from "./pages/Chat"

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/integrations" component={IntegrationsDashboard} />
      <Route path="/chat" component={Chat} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <Router />
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
