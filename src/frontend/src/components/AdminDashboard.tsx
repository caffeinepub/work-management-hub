import { useState } from 'react';
import { useListApprovals } from '../hooks/useApprovalManagement';
import { usePendingRequests } from '../hooks/useQueries';
import { useApproveUser, useRejectUser } from '../hooks/useApprovalManagement';
import { ApprovalStatus, Status } from '../backend';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, CheckCircle2, XCircle, Clock, Loader2, Shield, Users } from 'lucide-react';
import LoginButton from './LoginButton';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { data: approvals, isLoading: approvalsLoading } = useListApprovals();
  const { data: pendingRegistrations, isLoading: pendingLoading } = usePendingRequests();
  const approveUser = useApproveUser();
  const rejectUser = useRejectUser();
  const [processingUser, setProcessingUser] = useState<string | null>(null);

  const handleApprove = async (principalId: string, userName: string) => {
    setProcessingUser(principalId);
    try {
      await approveUser.mutateAsync(principalId);
      toast.success(`${userName} has been approved`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve user');
    } finally {
      setProcessingUser(null);
    }
  };

  const handleReject = async (principalId: string, userName: string) => {
    setProcessingUser(principalId);
    try {
      await rejectUser.mutateAsync(principalId);
      toast.success(`${userName} has been rejected`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject user');
    } finally {
      setProcessingUser(null);
    }
  };

  const pendingApprovals = approvals?.filter((a) => a.status === ApprovalStatus.pending) || [];
  const approvedUsers = approvals?.filter((a) => a.status === ApprovalStatus.approved) || [];
  const rejectedUsers = approvals?.filter((a) => a.status === ApprovalStatus.rejected) || [];

  // Count pending registrations from the new User-based system
  const pendingRegistrationsCount = pendingRegistrations?.length || 0;

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
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="gap-2">
              <Shield className="h-3 w-3" />
              Admin
            </Badge>
            <LoginButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage user registrations and approvals</p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardDescription>Pending Registrations</CardDescription>
                <CardTitle className="text-3xl text-accent">{pendingRegistrationsCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardDescription>Approved Users</CardDescription>
                <CardTitle className="text-3xl text-primary">{approvedUsers.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardDescription>Rejected</CardDescription>
                <CardTitle className="text-3xl text-destructive">{rejectedUsers.length}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Pending Registration Requests */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                Pending Registration Requests
              </CardTitle>
              <CardDescription>Review and approve or reject new user registration requests</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !pendingRegistrations || pendingRegistrations.length === 0 ? (
                <Alert>
                  <AlertDescription>No pending registration requests at this time.</AlertDescription>
                </Alert>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Requested Role</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRegistrations.map((user) => {
                        const principalStr = user.principalId.toString();
                        const isProcessing = processingUser === principalStr;
                        const createdDate = new Date(Number(user.createdAt) / 1000000);
                        
                        return (
                          <TableRow key={principalStr}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{user.role}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {createdDate.toLocaleDateString()} {createdDate.toLocaleTimeString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="gap-1">
                                <Clock className="h-3 w-3" />
                                {user.status === Status.pending ? 'Pending' : 'Active'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(principalStr, user.name)}
                                  disabled={isProcessing}
                                  className="gap-1"
                                >
                                  {isProcessing ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-3 w-3" />
                                  )}
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReject(principalStr, user.name)}
                                  disabled={isProcessing}
                                  className="gap-1"
                                >
                                  {isProcessing ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <XCircle className="h-3 w-3" />
                                  )}
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legacy Pending Approvals (from old approval system) */}
          {pendingApprovals.length > 0 && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-accent" />
                  Legacy Pending Approvals
                </CardTitle>
                <CardDescription>Legacy approval requests from the old system</CardDescription>
              </CardHeader>
              <CardContent>
                {approvalsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Principal ID</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingApprovals.map((approval) => {
                          const principalStr = approval.principal.toString();
                          return (
                            <TableRow key={principalStr}>
                              <TableCell className="font-mono text-xs">{principalStr}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="gap-1">
                                  <Clock className="h-3 w-3" />
                                  Pending
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* All Users */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Complete list of all user registrations and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {approvalsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !approvals || approvals.length === 0 ? (
                <Alert>
                  <AlertDescription>No users registered yet.</AlertDescription>
                </Alert>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Principal ID</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvals.map((approval) => (
                        <TableRow key={approval.principal.toString()}>
                          <TableCell className="font-mono text-xs">{approval.principal.toString()}</TableCell>
                          <TableCell>
                            {approval.status === ApprovalStatus.approved && (
                              <Badge className="gap-1 bg-primary">
                                <CheckCircle2 className="h-3 w-3" />
                                Approved
                              </Badge>
                            )}
                            {approval.status === ApprovalStatus.pending && (
                              <Badge variant="outline" className="gap-1">
                                <Clock className="h-3 w-3" />
                                Pending
                              </Badge>
                            )}
                            {approval.status === ApprovalStatus.rejected && (
                              <Badge variant="destructive" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                Rejected
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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
