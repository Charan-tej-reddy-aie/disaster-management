import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import WarehouseDashboard from "./pages/WarehouseDashboard";
import Predictions from "./pages/Predictions";
import ResourceRequests from "./pages/ResourceRequests";
import Movements from "./pages/Movements";
import BlockchainAudit from "./pages/BlockchainAudit";
import ProtectedRoute from "./components/ProtectedRoute";
import QuantumOptimization from "./pages/QuantumOptimization";
import CreateResourceRequest from "./pages/CreateResourceRequest";
import Resources from "./pages/Resources";
import Allocations from "./pages/Allocations";
import Layout from "./components/Layout";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Authenticated Dashboard & Module Routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/warehouse-dashboard" element={<WarehouseDashboard />} />
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/resource-requests" element={<ResourceRequests />} />
            <Route path="/resource-requests/create" element={<CreateResourceRequest />} />
            <Route path="/allocations" element={<Allocations />} />
            <Route path="/movements" element={<Movements />} />
            <Route path="/blockchain" element={<BlockchainAudit />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/quantum" element={<QuantumOptimization />} />
          </Route>

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;