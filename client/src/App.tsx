import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import SupplierDashboard from "./pages/supplier/SupplierDashboard";
import BuyerDashboard from "./pages/buyer/BuyerDashboard";
import SupplierInvoicesPage from "./pages/supplier/SupplierInvoicesPage";
import BuyerOffersPage from "./pages/buyer/BuyerOffersPage";
import ReportsPage from "./pages/ReportsPage";
import AppLayout from "./components/layout/AppLayout";
import React, { lazy, Suspense } from "react";

const LazyNotFound = lazy(() => import("@/pages/not-found"));

interface PrivateRouteProps {
  component: React.ComponentType<any>;
  roles?: string[];
  [key: string]: any;
}

function PrivateRoute({ component: Component, roles, ...rest }: PrivateRouteProps) {
  const { user, userRole } = useAuth();

  if (!user) {
    return <Redirect to="/" />;
  }

  if (roles && !roles.includes(userRole)) {
    return <Redirect to={`/dashboard/${userRole.toLowerCase()}`} />;
  }

  return <Component {...rest} />;
}

function SupplierDashboardRoute() {
  return (
    <AppLayout>
      <PrivateRoute component={SupplierDashboard} roles={["supplier"]} />
    </AppLayout>
  );
}

function BuyerDashboardRoute() {
  return (
    <AppLayout>
      <PrivateRoute component={BuyerDashboard} roles={["buyer"]} />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/dashboard" component={() => <Redirect to="/dashboard/supplier" />} />
      <Route path="/dashboard/supplier" component={SupplierDashboardRoute} />
      <Route path="/dashboard/buyer" component={BuyerDashboardRoute} />
      <Route path="/invoices" component={() => (
        <AppLayout>
          <PrivateRoute component={SupplierInvoicesPage} roles={["supplier"]} />
        </AppLayout>
      )} />
      <Route path="/offers" component={() => (
        <AppLayout>
          <PrivateRoute component={BuyerOffersPage} roles={["buyer"]} />
        </AppLayout>
      )} />
      <Route path="/reports" component={() => (
        <AppLayout>
          <PrivateRoute component={ReportsPage} roles={["supplier", "buyer"]} />
        </AppLayout>
      )} />
      <Route component={() => (
        <Suspense fallback={<div>Loading...</div>}>
          <LazyNotFound />
        </Suspense>
      )} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
