import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import FacultyListPage from "./pages/FacultyListPage";
import FacultyProfilePage from "./pages/FacultyProfilePage";
import DashboardPage from "./pages/DashboardPage";
import AdminPage from "./pages/AdminPage";
import ProtectedRoute from "./components/ProtectedRoute";

function NotFoundPage() {
  return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-xl font-semibold">Page not found</div>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/viewer" element={<FacultyListPage />} />
        <Route path="/faculty" element={<FacultyListPage />} />
        <Route path="/faculty/:id" element={<FacultyProfilePage />} />

        <Route element={<ProtectedRoute roles={["faculty", "admin"]} />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={["admin"]} />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="/home" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
