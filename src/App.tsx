import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import ClientDashboard from "./pages/client/ClientDashboard";
import CoachDashboard from "./pages/coach/CoachDashboard";
import ClientDetailView from "./pages/coach/ClientDetailView";
import WorkoutView from "./pages/client/WorkoutView";
import ProgressView from "./pages/client/ProgressView";
import NutritionView from "./pages/client/NutritionView";
import OnboardingView from "./pages/client/OnboardingView";
import ProfileView from "./pages/ProfileView";
import ExerciseLibrary from "./pages/coach/ExerciseLibrary";
import RecipeManager from "./pages/coach/RecipeManager";
import NotificationCentre from "./pages/NotificationCentre";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Client Routes */}
      <Route path="/dashboard" element={<ClientDashboard />} />
      <Route path="/workout" element={<WorkoutView />} />
      <Route path="/progress" element={<ProgressView />} />
      <Route path="/nutrition" element={<NutritionView />} />
      <Route path="/onboarding" element={<OnboardingView />} />
      <Route path="/profile" element={<ProfileView />} />

      {/* Coach Routes */}
      <Route path="/coach" element={<CoachDashboard />} />
      <Route path="/coach/client/:clientId" element={<ClientDetailView />} />
      <Route path="/coach/exercises" element={<ExerciseLibrary />} />
      <Route path="/coach/recipes" element={<RecipeManager />} />

      {/* Default redirect based on role */}
      <Route path="/" element={<Navigate to={role === 'coach' ? '/coach' : '/dashboard'} replace />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
