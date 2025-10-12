import { Route, Switch } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "./pages/Home";
import AuthPage from "./pages/auth-page";
import ResetPasswordPage from "./pages/reset-password";
import GenerateCoaches from "./pages/admin/GenerateCoaches";
import CoachRoster from "./pages/admin/CoachRoster";
import AdminDashboard from "./pages/admin/AdminDashboard";
import VideoStudio from "./pages/admin/VideoStudio";
import CoachImageGenerator from "./pages/CoachImageGenerator";
import CoachGallery from "./pages/CoachGallery";
import BatchRegenerate from "./pages/BatchRegenerate";
import ProgressRingsDemo from "./pages/ProgressRingsDemo";
import SpeechDemo from "./pages/SpeechDemo";
import { NutritionDemo } from "./pages/NutritionDemo";
import AwardsPage from "./pages/AwardsPage";
import ProfilePage from "./pages/ProfilePage";
import MainApp from "./components/MainApp";
import { CloudMoodProvider } from "@/context/CloudMoodContext";
import { AuthProvider } from "@/hooks/use-auth-v2";
import { ProtectedRoute } from "@/lib/protected-route";

// Root App component with routing
function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <CloudMoodProvider>
          <Toaster />
          <Switch>
              <Route path="/" component={Home} />
              <Route path="/auth" component={Home} />
              <Route path="/reset-password" component={ResetPasswordPage} />
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin/generate-coaches" component={GenerateCoaches} />
              <Route path="/admin/coaches" component={GenerateCoaches} /> {/* Legacy support */}
              <Route path="/admin/coach-roster" component={CoachRoster} />
              <Route path="/admin/video-studio" component={VideoStudio} />
              <Route path="/admin/rick-morty-coaches" component={CoachImageGenerator} />
              <Route path="/admin/coach-gallery" component={CoachGallery} />
              <Route path="/admin/batch-regenerate" component={BatchRegenerate} />
              <Route path="/gallery" component={CoachGallery} />
              <Route path="/nutrition-demo" component={NutritionDemo} />
              <ProtectedRoute path="/awards" component={() => <AwardsPage />} />
              <ProtectedRoute path="/profile" component={() => <ProfilePage />} />
              
              {/* Main App Routes - All stay within the app */}
              <ProtectedRoute path="/workouts" component={() => <MainApp />} />
              <ProtectedRoute path="/nutrition" component={() => <MainApp />} />
              <ProtectedRoute path="/coach" component={() => <MainApp />} />
              <ProtectedRoute path="/social" component={() => <MainApp />} />
              <ProtectedRoute path="/recovery" component={() => <MainApp />} />
              <ProtectedRoute path="/stats" component={() => <MainApp />} />
              
              <Route component={NotFound} /> {/* Fallback for unknown routes */}
            </Switch>
          </CloudMoodProvider>
        </TooltipProvider>
      </AuthProvider>
  );
}

export default App;
