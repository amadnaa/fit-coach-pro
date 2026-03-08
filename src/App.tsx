import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useAccentColor } from "@/hooks/useAccentColor";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
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
import PrivacySecurity from "./pages/PrivacySecurity";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotificationSettings from "./pages/NotificationSettings";
import NotFound from "./pages/NotFound";
import TermsOfService from "./pages/TermsOfService";
import { SplashScreen } from "./components/SplashScreen";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, role, loading, onboardingCompleted } = useAuth();
  useAccentColor(user?.id);

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
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Client first login → onboarding
  if (role === 'client' && onboardingCompleted === false) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingView />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Client Routes - redirect coaches to /coach */}
      <Route path="/dashboard" element={role === 'coach' ? <Navigate to="/coach" replace /> : <ClientDashboard />} />
      <Route path="/workout" element={role === 'coach' ? <Navigate to="/coach" replace /> : <WorkoutView />} />
      <Route path="/progress" element={role === 'coach' ? <Navigate to="/coach" replace /> : <ProgressView />} />
      <Route path="/nutrition" element={role === 'coach' ? <Navigate to="/coach" replace /> : <NutritionView />} />
      <Route path="/onboarding" element={<OnboardingView />} />
      <Route path="/profile" element={<ProfileView />} />
      <Route path="/notifications" element={<NotificationCentre />} />
      <Route path="/notification-settings" element={<NotificationSettings />} />
      <Route path="/privacy" element={<PrivacySecurity />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />

      {/* Coach Routes - redirect clients to /dashboard */}
      <Route path="/coach" element={role === 'coach' ? <CoachDashboard /> : <Navigate to="/dashboard" replace />} />
      <Route path="/coach/client/:clientId" element={role === 'coach' ? <ClientDetailView /> : <Navigate to="/dashboard" replace />} />
      <Route path="/coach/exercises" element={role === 'coach' ? <ExerciseLibrary /> : <Navigate to="/dashboard" replace />} />
      <Route path="/coach/recipes" element={role === 'coach' ? <RecipeManager /> : <Navigate to="/dashboard" replace />} />

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
