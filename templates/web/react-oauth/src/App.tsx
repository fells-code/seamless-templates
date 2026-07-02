import type { ReactNode } from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider, useAuth } from "@seamless-auth/react";

import "./App.css";
import MainLayout from "./layouts/Layout";
import About from "./pages/About";
import Home from "./pages/Home";
import Login from "./pages/Login";
import OAuthCallback from "./pages/OAuthCallback";
import { API_URL } from "./lib/api";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center px-6">
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
        Checking session...
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
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
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

const App = () => {
  return (
    <Router>
      <AuthProvider apiHost={API_URL}>
        <ApplicationRoutes />
      </AuthProvider>
    </Router>
  );
};
export default App;
