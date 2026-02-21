import { useCurrentUser } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Loader2, User as UserIcon, Shield, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import LoginButton from './LoginButton';
import { Role, Status } from '../backend';

// Helper function to format role names
function formatRole(role: Role): string {
  const roleMap: Record<Role, string> = {
    [Role.superadmin]: 'Superadmin',
    [Role.admin]: 'Admin',
    [Role.finance]: 'Finance',
    [Role.concierge]: 'Concierge',
    [Role.strategicPartner]: 'Strategic Partner',
    [Role.asistenmu]: 'Asistenmu',
    [Role.client]: 'Client',
    [Role.partner]: 'Partner',
  };
  return roleMap[role] || role;
}

// Helper function to format timestamp
function formatDate(timestamp: bigint): string {
  const date = new Date(Number(timestamp) / 1000000); // Convert nanoseconds to milliseconds
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function UserInfoPage() {
  const { identity } = useInternetIdentity();
  const { data: user, isLoading, isFetched } = useCurrentUser();

  const isAuthenticated = !!identity;

  // Show loading state
  if (!isAuthenticated || isLoading || !isFetched) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading user information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">User Information</span>
          </div>
          <LoginButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {user ? (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <UserIcon className="h-6 w-6 text-primary" />
                  User Profile
                </CardTitle>
                <CardDescription>Your account information and status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg font-semibold text-foreground">{user.name}</p>
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Role
                  </label>
                  <div>
                    <Badge variant="outline" className="text-base px-3 py-1">
                      {formatRole(user.role)}
                    </Badge>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="flex items-center gap-2">
                    {user.status === Status.active ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">Active</Badge>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        <Badge variant="outline" className="border-amber-600 text-amber-600">
                          Pending
                        </Badge>
                      </>
                    )}
                  </div>
                </div>

                {/* Created At */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Account Created
                  </label>
                  <p className="text-foreground">{formatDate(user.createdAt)}</p>
                </div>

                {/* Principal ID */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Principal ID</label>
                  <p className="text-xs font-mono text-muted-foreground break-all bg-muted/50 p-3 rounded-md">
                    {user.principalId.toString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-soft">
              <CardContent className="py-12 text-center">
                <UserIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">No User Data Found</h2>
                <p className="text-muted-foreground">
                  You don't have a user profile yet. Please complete the registration process.
                </p>
              </CardContent>
            </Card>
          )}
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
