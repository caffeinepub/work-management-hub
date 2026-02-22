import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useCurrentUser } from './hooks/useQueries';
import { useHasSuperadmin } from './hooks/useSuperadminClaim';
import LandingPage from './components/LandingPage';
import PartnerPortalPage from './components/PartnerPortalPage';
import ClientRegisterPage from './components/ClientRegisterPage';
import InternalSystemPage from './components/InternalSystemPage';
import PartnerDashboard from './components/PartnerDashboard';
import ClientDashboard from './components/ClientDashboard';
import InternalDashboard from './components/InternalDashboard';
import ApprovedUserView from './components/ApprovedUserView';
import SuperadminClaimPage from './components/SuperadminClaimPage';
import UserInfoPage from './components/UserInfoPage';
import { Loader2 } from 'lucide-react';
import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/sonner';
import { Status, Role } from './backend';

// Layout component for routes that need router context
function Layout() {
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}

// Main app component that handles authentication and routing logic
function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const { data: currentUser, isLoading: currentUserLoading, isFetched: currentUserFetched } = useCurrentUser();
  const { data: hasSuperadmin, isLoading: superadminLoading, isFetched: superadminFetched } = useHasSuperadmin();

  const isAuthenticated = !!identity;

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show landing page
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Authenticated - check if superadmin exists
  if (superadminLoading || !superadminFetched) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking system status...</p>
        </div>
      </div>
    );
  }

  // No superadmin exists - show claim page
  if (hasSuperadmin === false) {
    return (
      <SuperadminClaimPage
        onClaimSuccess={() => {
          window.location.reload();
        }}
      />
    );
  }

  // Superadmin exists - check user profile and registration status
  if (profileLoading || !profileFetched || currentUserLoading || !currentUserFetched) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Check if user has registered (has a User record)
  if (currentUser === null) {
    return <LandingPage />;
  }

  // User exists but is pending approval
  if (currentUser && currentUser.status === Status.pending) {
    return <ApprovedUserView />;
  }

  // User is active - route to appropriate dashboard based on role
  if (currentUser && currentUser.status === Status.active) {
    if (currentUser.role === Role.partner) {
      return <PartnerDashboard />;
    } else if (currentUser.role === Role.client) {
      return <ClientDashboard />;
    } else {
      // Internal roles: admin, finance, concierge, asistenmu, strategicPartner, superadmin
      return <InternalDashboard />;
    }
  }

  return <ApprovedUserView />;
}

// Create root route with Layout
const rootRoute = createRootRoute({
  component: Layout,
});

// Create index route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: AppContent,
});

// Create partner portal route
const partnerPortalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/partner-portal',
  component: PartnerPortalPage,
});

// Create client register route
const clientRegisterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/clientregister',
  component: ClientRegisterPage,
});

// Create internal system route
const internalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/internal',
  component: InternalSystemPage,
});

// Create user-info route
const userInfoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/user-info',
  component: UserInfoPage,
});

// Create partner dashboard route
const partnerDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/partner',
  component: PartnerDashboard,
});

// Create client dashboard route
const clientDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/client',
  component: ClientDashboard,
});

// Create internal dashboard route
const internalDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/internal-dashboard',
  component: InternalDashboard,
});

// Create router
const routeTree = rootRoute.addChildren([
  indexRoute,
  partnerPortalRoute,
  clientRegisterRoute,
  internalRoute,
  userInfoRoute,
  partnerDashboardRoute,
  clientDashboardRoute,
  internalDashboardRoute,
]);

const router = createRouter({ routeTree });

export default function App() {
  return <RouterProvider router={router} />;
}
