import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Dashboard from "./pages/Dashboard";
import WeeklyReport from "./pages/WeeklyReport";
import RightToForget from "./pages/RightToForget";
import Backup from "./pages/Backup";
import EncryptDecrypt from "./pages/EncryptDecrypt";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/report" element={<WeeklyReport />} />
          <Route path="/forget" element={<RightToForget />} />
          <Route path="/backup" element={<Backup />} />
          <Route path="/encrypt" element={<EncryptDecrypt />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
