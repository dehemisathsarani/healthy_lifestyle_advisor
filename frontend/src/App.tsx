import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./auth/AuthContext";

import { HomePage } from "./pages/HomePage";
import { ServicesPage } from "./pages/ServicesPage";
import { AboutPage } from "./pages/AboutPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { OAuthCallbackPage } from "./pages/OAuthCallbackPage";
import { ProfilePage } from "./pages/ProfilePage";
import CalendarPage from "./pages/CalendarPage";

// Data & Security Agent pages
import WeeklyReport from "./pages/WeeklyReport";
import RightToForget from "./pages/RightToForget";
import Backup from "./pages/Backup";
import EncryptDecrypt from "./pages/EncryptDecrypt"; 
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 text-gray-900">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardPage />}>
              {/* Nested Data & Security Agent pages */}
              <Route path="report" element={<WeeklyReport />} />
              <Route path="forget" element={<RightToForget />} />
              <Route path="backup" element={<Backup />} />
              <Route path="encrypt" element={<EncryptDecrypt />} />
            </Route>
            <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* 🔥 Add toaster here so all toast messages are visible */}
          <Toaster position="top-right" reverseOrder={false} />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
