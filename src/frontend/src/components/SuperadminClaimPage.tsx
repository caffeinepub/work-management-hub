import { useState } from 'react';
import { useClaimSuperadmin } from '../hooks/useSuperadminClaim';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Crown, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import LoginButton from './LoginButton';

interface SuperadminClaimPageProps {
  onClaimSuccess: () => void;
}

export default function SuperadminClaimPage({ onClaimSuccess }: SuperadminClaimPageProps) {
  const { mutate: claimSuperadmin, isPending, isSuccess, error } = useClaimSuperadmin();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleClaim = () => {
    claimSuperadmin(undefined, {
      onSuccess: () => {
        setShowSuccess(true);
        // Redirect after a short delay to show success message
        setTimeout(() => {
          onClaimSuccess();
        }, 2000);
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm">
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="w-full max-w-lg shadow-soft animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center">
              <Crown className="h-10 w-10 text-accent" />
            </div>
            <CardTitle className="text-3xl">Claim Superadmin Access</CardTitle>
            <CardDescription className="text-base mt-2">
              You are the first user to access this system. Claim superadmin privileges to manage the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {showSuccess || isSuccess ? (
              <Alert className="border-primary bg-primary/5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <AlertDescription className="text-primary">
                  Superadmin access claimed successfully! Redirecting to dashboard...
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <p>As the superadmin, you will have full control over:</p>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li>Approving or rejecting user registration requests</li>
                    <li>Managing user roles and permissions</li>
                    <li>Accessing all administrative features</li>
                  </ul>
                  <p className="font-medium text-foreground pt-2">
                    This action can only be performed once. The first authenticated user becomes the superadmin.
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {error.message || 'Failed to claim superadmin access. Please try again.'}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleClaim}
                  disabled={isPending}
                  className="w-full"
                  size="lg"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Claiming Access...
                    </>
                  ) : (
                    <>
                      <Crown className="mr-2 h-5 w-5" />
                      Claim Superadmin Access
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-24 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Work Management Hub. Built with ❤️ using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                window.location.hostname
              )}`}
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
