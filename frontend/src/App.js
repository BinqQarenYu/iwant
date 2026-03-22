import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./contexts/AppContext";
import { Toaster } from "./components/ui/sonner";

// Pages
import HomePage from "./pages/HomePage";
import RestaurantPage from "./pages/RestaurantPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import PabiliPage from "./pages/PabiliPage";
import ProfilePage from "./pages/ProfilePage";
import AuthPage from "./pages/AuthPage";

// Dashboard Pages
import RestaurantDashboard from "./pages/dashboard/RestaurantDashboard";
import DriverDashboard from "./pages/dashboard/DriverDashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Redirect based on role
const RoleBasedRedirect = () => {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <HomePage />;
  }

  switch (user.role) {
    case 'restaurant_owner':
      return <Navigate to="/dashboard/restaurant" replace />;
    case 'driver':
      return <Navigate to="/dashboard/driver" replace />;
    case 'admin':
      return <Navigate to="/dashboard/admin" replace />;
    default:
      return <HomePage />;
  }
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<RoleBasedRedirect />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/restaurant/:id" element={<RestaurantPage />} />
      
      {/* Customer Routes */}
      <Route path="/cart" element={
        <ProtectedRoute allowedRoles={['customer']}>
          <CartPage />
        </ProtectedRoute>
      } />
      <Route path="/checkout" element={
        <ProtectedRoute allowedRoles={['customer']}>
          <CheckoutPage />
        </ProtectedRoute>
      } />
      <Route path="/orders" element={
        <ProtectedRoute>
          <OrdersPage />
        </ProtectedRoute>
      } />
      <Route path="/orders/:id" element={
        <ProtectedRoute>
          <OrderDetailPage />
        </ProtectedRoute>
      } />
      <Route path="/pabili" element={
        <ProtectedRoute allowedRoles={['customer']}>
          <PabiliPage />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />

      {/* Dashboard Routes */}
      <Route path="/dashboard/restaurant" element={
        <ProtectedRoute allowedRoles={['restaurant_owner']}>
          <RestaurantDashboard />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/driver" element={
        <ProtectedRoute allowedRoles={['driver']}>
          <DriverDashboard />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </AppProvider>
    </div>
  );
}

export default App;
