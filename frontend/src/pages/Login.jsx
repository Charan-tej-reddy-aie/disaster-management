import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Mail, Lock, LogIn, AlertCircle } from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      console.log("Login response:", response.data);

      const token = response.data.token;
      const user = response.data.user;

      if (!token) {
        throw new Error("Login succeeded but no token was returned.");
      }

      login(token, user);

      if (user?.role === "WAREHOUSE_MANAGER") {
        navigate("/warehouse-dashboard", {
          replace: true,
        });
      } else {
        navigate("/dashboard", {
          replace: true,
        });
      }

    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please check your credentials."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">

      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl md:grid-cols-2">

        {/* Left side */}
        <div className="hidden bg-blue-700 p-10 text-white md:flex md:flex-col md:justify-between">

          <div>

            <div className="mb-8 flex items-center gap-3">

              <div className="rounded-xl bg-white/15 p-3">
                <Shield size={30} />
              </div>

              <div>
                <h1 className="text-xl font-bold">
                  Disaster Management
                </h1>

                <p className="text-sm text-blue-100">
                  National Command System
                </p>
              </div>

            </div>

            <h2 className="text-4xl font-bold leading-tight">
              Intelligent Disaster
              <br />
              Prediction & Response
            </h2>

            <p className="mt-6 max-w-md text-sm leading-6 text-blue-100">
              Monitor disaster predictions, coordinate emergency
              resources, optimize allocation and maintain a secure
              disaster response audit trail.
            </p>

          </div>

          <div className="text-xs text-blue-200">
            AI • Satellite Intelligence • Quantum Optimization • Blockchain
          </div>

        </div>

        {/* Login form */}
        <div className="p-8 sm:p-10">

          <div className="mb-8">

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 md:hidden">
              <Shield size={25} />
            </div>

            <h2 className="text-2xl font-bold text-slate-800">
              Welcome back
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Sign in to access the disaster management command center.
            </p>

          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">

              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              <span>{error}</span>

            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* Email */}
            <div>

              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email Address
              </label>

              <div className="relative">

                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

            </div>

            {/* Password */}
            <div>

              <label className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>

              <div className="relative">

                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}

            </button>

          </form>

          {/* Quick Demo Role Selector */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
              Quick Role Demo Accounts (Password: Admin@123)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setEmail("national.head@disaster.local");
                  setPassword("Admin@123");
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 text-left transition"
              >
                <span className="font-semibold block text-blue-700">National Head</span>
                <span className="text-[10px] text-slate-400">All permissions</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail("KeralaState.head@disaster.local");
                  setPassword("Admin@123");
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 text-left transition"
              >
                <span className="font-semibold block text-indigo-700">State Head</span>
                <span className="text-[10px] text-slate-400">Kerala State</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail("kerala.warehouse@disaster.local");
                  setPassword("Admin@123");
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 text-left transition"
              >
                <span className="font-semibold block text-emerald-700">Kerala WH Manager</span>
                <span className="text-[10px] text-slate-400">Warehouse 1</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail("tn.warehouse@disaster.local");
                  setPassword("Admin@123");
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 text-left transition"
              >
                <span className="font-semibold block text-emerald-700">TN WH Manager</span>
                <span className="text-[10px] text-slate-400">Warehouse 2</span>
              </button>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-slate-400">
            Authorized government personnel only • Multi-role verification enabled
          </p>

        </div>

      </div>

    </div>
  );
}