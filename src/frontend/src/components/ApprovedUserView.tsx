import { useGetCallerUserRole, useIsCallerApproved } from '../hooks/useQueries';
import { UserRole } from '../backend';
import AdminDashboard from './AdminDashboard';
import PendingApprovalView from './PendingApprovalView';
import ApprovalStatusBanner from './ApprovalStatusBanner';
import { Building2, Loader2 } from 'lucide-react';
import LoginButton from './LoginButton';
import { Link } from '@tanstack/react-router';
import { Button } from './ui/button';

export default function ApprovedUserView() {
  const { data: userRole, isLoading: roleLoading } = useGetCallerUserRole();
  const { data: isApproved, isLoading: approvalLoading } = useIsCallerApproved();

  // Show loading state
  if (roleLoading || approvalLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is admin (includes both admin and superadmin roles)
  const isAdmin = userRole === UserRole.admin;

  // If admin, show admin dashboard
  if (isAdmin) {
    return <AdminDashboard />;
  }

  // If not approved, show pending view
  if (!isApproved) {
    return <PendingApprovalView />;
  }

  // Approved non-admin user - show placeholder dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Work Management Hub</span>
          </div>
          <LoginButton />
        </div>
      </header>

      <ApprovalStatusBanner />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-xl p-8 shadow-soft text-center space-y-6">
            <h1 className="text-3xl font-bold text-card-foreground mb-4">Welcome to Work Management Hub</h1>
            <p className="text-muted-foreground">
              Your account has been approved. Role-specific features will be available soon.
            </p>
            <div className="pt-4">
              <Link to="/user-info">
                <Button variant="outline" size="lg">
                  View Your Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-24 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Work Management Hub. Built with ❤️ using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
