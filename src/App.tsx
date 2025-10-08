import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import Features from "./pages/Features";
import About from "./pages/About";
import Resources from "./pages/Resources";
import UseCasesPage from "./pages/UseCasesPage";
import CompanyUserDashboard from "./pages/CompanyUserDashboard";
import InviteAccept from "./pages/InviteAccept";
import NotFound from "./pages/NotFound";
import LettersListPage from "./pages/LettersListPage";
import LetterDetailPage from "./pages/LetterDetailPage";
import LetterCreationWizard from "./pages/LetterCreationWizard";
import TeamWorkspace from "./pages/TeamWorkspace";
import CreatorPortal from "./pages/CreatorPortal";
import { EnhancedTemplateStore } from "./components/EnhancedTemplateStore";
import { SuperAdminDashboard } from "./components/SuperAdminDashboard";
import { CompanyAdminDashboard } from "./components/CompanyAdminDashboard";
import { DocumentUpload } from "./components/DocumentUpload";
import { SubscriptionManager } from "./components/SubscriptionManager";
import { PersonalDashboard } from "./components/PersonalDashboard";
import { Header } from "./components/Header";

// Dev-only imports - lazy loaded
let DevUserSwitcher: any = null;
let DevModeBanner: any = null;

if (import.meta.env.DEV) {
  const devComponents = await Promise.all([
    import("./components/dev/DevUserSwitcher"),
    import("./components/dev/DevModeBanner")
  ]);
  DevUserSwitcher = devComponents[0].DevUserSwitcher;
  DevModeBanner = devComponents[1].DevModeBanner;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {DevModeBanner && <DevModeBanner />}
      <BrowserRouter>
        <div className={import.meta.env.DEV ? "min-h-screen ring-2 ring-orange-500" : ""}>
          <AuthProvider>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/invite/:token" element={<InviteAccept />} />
            <Route
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/features" element={<Features />} />
            <Route path="/use-cases" element={<UseCasesPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/templates" element={
              <ProtectedRoute>
                <div className="min-h-screen bg-background">
                  <Header />
                  <main className="container mx-auto px-4 py-8">
                    <div className="mb-8">
                      <h1 className="text-3xl font-bold">Legal Template Store</h1>
                    </div>
                    <EnhancedTemplateStore />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/company-admin" 
              element={
                <ProtectedRoute>
                  <CompanyAdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/company-user" 
              element={
                <ProtectedRoute>
                  <CompanyUserDashboard />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/upload" 
              element={
                <ProtectedRoute>
                  <DocumentUpload />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/subscription" 
              element={
                <ProtectedRoute>
                  <SubscriptionManager />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/personal-dashboard" 
              element={
                <ProtectedRoute>
                  <PersonalDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/letters" 
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-background">
                    <Header />
                    <LettersListPage />
                  </div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/letters/create" 
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-background">
                    <Header />
                    <LetterCreationWizard />
                  </div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/letters/:letterId" 
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-background">
                    <Header />
                    <LetterDetailPage />
                  </div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/team-workspace" 
              element={
                <ProtectedRoute>
                  <TeamWorkspace />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/creator-portal" 
              element={
                <ProtectedRoute>
                  <CreatorPortal />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          {DevUserSwitcher && <DevUserSwitcher />}
        </AuthProvider>
      </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
