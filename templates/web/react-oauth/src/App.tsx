import type { ReactNode } from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider, useAuth } from "@seamless-auth/react";

import "./App.css";
import ConfigurationError from "./components/ConfigurationError";
import MainLayout from "./layouts/Layout";
import About from "./pages/About";
import Home from "./pages/Home";
import Login from "./pages/Login";
import OAuthCallback from "./pages/OAuthCallback";
import Session from "./pages/Session";
import { API_URL } from "./lib/api";
import { MISSING_API_URL_MESSAGE } from "./lib/runtimeConfig";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="text-sm font-medium text-ink-muted">
        Checking session...
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  // Re-reading the session raises `loading` again on a page that is already
  // rendering. Swapping in the loading screen for that would unmount whatever is
  // mounted and discard its state, so it is only for the first resolution,
  // before there is a session to render at all.
  if (loading && !isAuthenticated) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function ApplicationRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />

      <Route path="/" element={<MainLayout />}>
        <Route
          index
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
        <Route path="about" element={<About />} />
        <Route
          path="session"
          element={
            <RequireAuth>
              <Session />
            </RequireAuth>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

const App = () => {
  if (!API_URL) {
    return <ConfigurationError message={MISSING_API_URL_MESSAGE} />;
  }

  return (
    <Router>
      <AuthProvider apiHost={API_URL}>
        <ApplicationRoutes />
      </AuthProvider>
    </Router>
  );
};
export default App;
