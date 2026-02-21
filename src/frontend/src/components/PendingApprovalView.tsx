import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Clock } from 'lucide-react';
import LoginButton from './LoginButton';
import { useGetCallerUserProfile } from '../hooks/useQueries';

export default function PendingApprovalView() {
  const { data: userProfile } = useGetCallerUserProfile();

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

      {/* Pending Status */}
      <main className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-soft animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
              <Clock className="h-8 w-8 text-accent" />
            </div>
            <CardTitle className="text-2xl">Registration Pending</CardTitle>
            <CardDescription>
              Your registration is currently under review by our administrators.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Registration Details:</p>
                  <div className="text-sm space-y-1">
                    <p>Name: {userProfile?.name}</p>
                    <p>Requested Role: {userProfile?.requestedRole}</p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground text-center">
              You will be able to access the platform once your registration has been approved.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
