import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const {
    isAuthenticated,
    authLoading,
  } = useAuth();

  // Don't redirect while we're still checking localStorage.
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">

        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />

          <p className="mt-4 text-sm text-slate-500">
            Loading your session...
          </p>

        </div>

      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}