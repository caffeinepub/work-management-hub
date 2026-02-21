import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useCurrentUser } from './hooks/useQueries';
import { useHasSuperadmin } from './hooks/useSuperadminClaim';
import LandingPage from './components/LandingPage';
import RegistrationFlow from './components/RegistrationFlow';
import ApprovedUserView from './components/ApprovedUserView';
import SuperadminClaimPage from './components/SuperadminClaimPage';
import UserInfoPage from './components/UserInfoPage';
import { Loader2 } from 'lucide-react';
import { RouterProvider, createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/sonner';
import { Status } from './backend';

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
          // Force reload to refresh all queries
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
    // No user record - show registration flow
    return <RegistrationFlow />;
  }

  // User exists but is pending approval
  if (currentUser && currentUser.status === Status.pending) {
    // Show pending approval view (will be handled by ApprovedUserView)
    return <ApprovedUserView />;
  }

  // User is active - show appropriate view
  return <ApprovedUserView />;
}

// Create root route
const rootRoute = createRootRoute({
  component: () => (
    <>
      <AppContent />
      <Toaster />
    </>
  ),
});

// Create user-info route
const userInfoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/user-info',
  component: UserInfoPage,
});

// Create router
const routeTree = rootRoute.addChildren([userInfoRoute]);
const router = createRouter({ routeTree });

export default function App() {
  return <RouterProvider router={router} />;
}
