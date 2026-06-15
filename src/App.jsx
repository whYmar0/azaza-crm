import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import ChessPage from "./pages/ChessPage";
import LeadsPage from "./pages/LeadsPage";
import DashboardPage from "./pages/DashboardPage";
import AutomationPage from "./pages/AutomationPage";

function PrivateRoute({ children }) {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { token, fetchMe } = useAuthStore();
  useEffect(() => { if (token) fetchMe(); }, [token]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/chess" replace />} />
        <Route path="chess"      element={<ChessPage />} />
        <Route path="leads"      element={<LeadsPage />} />
        <Route path="dashboard"  element={<DashboardPage />} />
        <Route path="automation" element={<AutomationPage />} />
      </Route>
    </Routes>
  );
}
