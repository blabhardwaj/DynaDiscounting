import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import SupplierDashboard from "./pages/supplier/SupplierDashboard";
import BuyerDashboard from "./pages/buyer/BuyerDashboard";
import AppLayout from "./components/layout/AppLayout";
import { useAuth } from "./contexts/AuthContext";

function PrivateRoute({ component: Component, roles, ...rest }: any) {
  const { user, userRole } = useAuth();
  
  if (!user) {
    return <Redirect to="/" />;
  }
  
  if (roles && !roles.includes(userRole)) {
    return <Redirect to={`/dashboard/${userRole.toLowerCase()}`} />;
  }
  
  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/dashboard">
        {() => <Redirect to="/dashboard/supplier" />}
      </Route>
      <Route path="/dashboard/supplier">
        {() => (
          <AppLayout>
            <PrivateRoute component={SupplierDashboard} roles={["supplier"]} />
          </AppLayout>
        )}
      </Route>
      <Route path="/dashboard/buyer">
        {() => (
          <AppLayout>
            <PrivateRoute component={BuyerDashboard} roles={["buyer"]} />
          </AppLayout>
        )}
      </Route>
      <Route component={NotFound} />
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
