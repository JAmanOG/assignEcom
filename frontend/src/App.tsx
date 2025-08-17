import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./App.css";
import { authService } from "./lib/auth";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./components/auth/LoginPage";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { ProductManagement } from "./components/admin/ProductManagement";
import { OrderManagement } from "./components/admin/OrderManagement";
import { UserManagement } from "./components/admin/UserManagement";
import { AnalyticsPage } from "./components/admin/AnalyticsPage";
import { SettingsPage } from "./components/admin/SettingsPage";
import NotFound from "./pages/NotFound";
import { CustomerShop } from "./components/customer/customer-shop";
import { DeliveryLayout } from "./components/delivery/DeliveryLayout";
import { DeliveryDashboard } from "./components/delivery/DeliveryDashboard";
import { RegisterPage } from "./components/auth/RegisterPage";
import { PhotoProvider } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';

const queryClient = new QueryClient();

// Home page redirect based on user role
function HomePage() {
  const user = authService.getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case "ADMIN":
      return <Navigate to="/admin" replace />;
    case "CUSTOMER":
      return <Navigate to="/shop" replace />;
    case "DELIVERY":
      return <Navigate to="/delivery" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
      <PhotoProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/products" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminLayout>
                <ProductManagement />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/orders" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminLayout>
                <OrderManagement />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminLayout>
                <UserManagement />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminLayout>
                <AnalyticsPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminLayout>
                <SettingsPage />
              </AdminLayout>
            </ProtectedRoute>
          } />

          {/* Customer Routes */}
          <Route path="/shop" element={
            <ProtectedRoute requiredRole="CUSTOMER">
              <CustomerShop />
            </ProtectedRoute>
          } />

          {/* Delivery Routes */}
          <Route path="/delivery" element={
            <ProtectedRoute requiredRole="DELIVERY">
              <DeliveryLayout>
                <DeliveryDashboard />
              </DeliveryLayout>
            </ProtectedRoute>
          } />


          <Route path="*" element={<NotFound />} />

          </Routes>
        </BrowserRouter>
      </PhotoProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
