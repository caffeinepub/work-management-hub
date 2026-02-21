import { useIsCallerApproved } from '../hooks/useQueries';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

export default function ApprovalStatusBanner() {
  const { data: isApproved, isLoading } = useIsCallerApproved();

  if (isLoading) {
    return null;
  }

  if (isApproved) {
    return (
      <div className="border-b border-border/40 bg-primary/5">
        <div className="container mx-auto px-4 py-3">
          <Alert className="border-primary/20 bg-transparent">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm text-foreground">
              Your account is approved and active.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border/40 bg-accent/5">
      <div className="container mx-auto px-4 py-3">
        <Alert className="border-accent/20 bg-transparent">
          <Clock className="h-4 w-4 text-accent" />
          <AlertDescription className="text-sm text-foreground">
            Your registration is pending approval. You will have full access once approved by an administrator.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
