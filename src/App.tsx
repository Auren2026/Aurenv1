import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import Index from "./pages/Index";
import CategoryProducts from "./pages/CategoryProducts";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Account from "./pages/Account";
import Auth from "./pages/Auth";
import MyOrders from "./pages/MyOrders";
import Favorites from "./pages/Favorites";
import NotFound from "./pages/NotFound";
import { RequireApproval } from "@/components/RequireApproval";
import { usePushNotifications } from "@/hooks/use-push-notifications";

const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminCategories = lazy(() => import("./pages/admin/Categories"));
const AdminSubcategories = lazy(() => import("./pages/admin/Subcategories"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminCustomers = lazy(() => import("./pages/admin/Customers"));
const AdminBanners = lazy(() => import("./pages/admin/Banners"));
const AppBuild = lazy(() => import("./pages/admin/AppBuild"));
const AdminNotifications = lazy(() => import("./pages/admin/Notifications"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const PushNotificationsInit = () => {
  usePushNotifications();
  return null;
};

const App = () => (



  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <PushNotificationsInit />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            {/* Rotas protegidas para clientes aprovados */}
            <Route
              path="/"
              element={
                <RequireApproval>
                  <Index />
                </RequireApproval>
              }
            />
            <Route
              path="/category/:categoryId"
              element={
                <RequireApproval>
                  <CategoryProducts />
                </RequireApproval>
              }
            />
            <Route
              path="/cart"
              element={
                <RequireApproval>
                  <Cart />
                </RequireApproval>
              }
            />
            <Route
              path="/checkout"
              element={
                <RequireApproval>
                  <Checkout />
                </RequireApproval>
              }
            />
            <Route
              path="/account"
              element={
                <RequireApproval>
                  <Account />
                </RequireApproval>
              }
            />
            <Route
              path="/orders"
              element={
                <RequireApproval>
                  <MyOrders />
                </RequireApproval>
              }
            />
            <Route
              path="/favorites"
              element={
                <RequireApproval>
                  <Favorites />
                </RequireApproval>
              }
            />
            {/* Rotas administrativas continuam públicas para admins */}
            <Route path="/admin" element={<Suspense fallback={<LoadingFallback />}><AdminDashboard /></Suspense>} />
            <Route path="/admin/categories" element={<Suspense fallback={<LoadingFallback />}><AdminCategories /></Suspense>} />
            <Route path="/admin/subcategories" element={<Suspense fallback={<LoadingFallback />}><AdminSubcategories /></Suspense>} />
            <Route path="/admin/products" element={<Suspense fallback={<LoadingFallback />}><AdminProducts /></Suspense>} />
            <Route path="/admin/orders" element={<Suspense fallback={<LoadingFallback />}><AdminOrders /></Suspense>} />
            <Route path="/admin/customers" element={<Suspense fallback={<LoadingFallback />}><AdminCustomers /></Suspense>} />
            <Route path="/admin/banners" element={<Suspense fallback={<LoadingFallback />}><AdminBanners /></Suspense>} />
            <Route path="/admin/app-build" element={<Suspense fallback={<LoadingFallback />}><AppBuild /></Suspense>} />
            <Route path="/admin/notifications" element={<Suspense fallback={<LoadingFallback />}><AdminNotifications /></Suspense>} />
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
