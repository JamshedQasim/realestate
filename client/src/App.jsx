import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import PropertiesPage from "./pages/PropertiesPage";
import AgentsPage from "./pages/AgentsPage";
import ServicesPage from "./pages/ServicesPage";
import BlogPage from "./pages/BlogPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import BuyerDashboard from "./pages/BuyerDashboard";
import SellerDashboard from "./pages/SellerDashboard";
import AgentDashboard from "./pages/AgentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public pages — accessible without login */}
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        {/* Auth-required pages — any logged-in role */}
        <Route path="properties" element={<ProtectedRoute><PropertiesPage /></ProtectedRoute>} />
        <Route path="properties/:id" element={<ProtectedRoute><PropertyDetailPage /></ProtectedRoute>} />
        <Route path="agents" element={<ProtectedRoute><AgentsPage /></ProtectedRoute>} />
        <Route path="services" element={<ProtectedRoute><ServicesPage /></ProtectedRoute>} />
        <Route path="blog" element={<ProtectedRoute><BlogPage /></ProtectedRoute>} />
        <Route path="contact" element={<ProtectedRoute><ContactPage /></ProtectedRoute>} />

        {/* Role-specific dashboards */}
        <Route path="buyer-dashboard" element={<ProtectedRoute allowedRoles={["buyer"]}><BuyerDashboard /></ProtectedRoute>} />
        <Route path="seller-dashboard" element={<ProtectedRoute allowedRoles={["seller"]}><SellerDashboard /></ProtectedRoute>} />
        <Route path="agent-dashboard" element={<ProtectedRoute allowedRoles={["agent"]}><AgentDashboard /></ProtectedRoute>} />
        <Route path="admin-dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />

        <Route path="*" element={<LoginPage />} />
      </Route>
    </Routes>
  );
}

