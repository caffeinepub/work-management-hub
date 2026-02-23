import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { User, Status } from '../backend';
import { Copy, CheckCircle, XCircle, Edit, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useActor } from '../hooks/useActor';
import { useQueryClient } from '@tanstack/react-query';
import RoleBadge from './RoleBadge';
import EditRoleModal from './EditRoleModal';

interface UserManagementTableProps {
  users: User[];
}

export default function UserManagementTable({ users }: UserManagementTableProps) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Principal ID copied to clipboard!');
  };

  const handleApprove = async (user: User) => {
    const key = `approve-${user.principalId.toString()}`;
    setLoadingActions(prev => ({ ...prev, [key]: true }));
    try {
      if (!actor) throw new Error('Actor not available');
      
      await actor.approveUser(user.principalId);
      
      toast.success(`${user.name} has been approved!`);
      
      // Invalidate all three query keys to refresh UI
      await queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      await queryClient.invalidateQueries({ queryKey: ['approvals'] });
      await queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
    } catch (error: any) {
      toast.error(`Failed to approve: ${error.message}`);
    } finally {
      setLoadingActions(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleReject = async (user: User) => {
    const key = `reject-${user.principalId.toString()}`;
    setLoadingActions(prev => ({ ...prev, [key]: true }));
    try {
      if (!actor) throw new Error('Actor not available');
      
      await actor.rejectUser(user.principalId);
      
      toast.success(`${user.name} has been rejected.`);
      
      // Invalidate all three query keys to refresh UI
      await queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      await queryClient.invalidateQueries({ queryKey: ['approvals'] });
      await queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
    } catch (error: any) {
      toast.error(`Failed to reject: ${error.message}`);
    } finally {
      setLoadingActions(prev => ({ ...prev, [key]: false }));
    }
  };

  const getStatusBadge = (status: Status) => {
    switch (status) {
      case Status.active:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active
          </span>
        );
      case Status.pending:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case Status.rejected:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No users in this category
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Nama Lengkap / Perusahaan</TableHead>
              <TableHead className="font-semibold">Principal ID</TableHead>
              <TableHead className="font-semibold">Email / WhatsApp</TableHead>
              <TableHead className="font-semibold">Role</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const approveKey = `approve-${user.principalId.toString()}`;
              const rejectKey = `reject-${user.principalId.toString()}`;
              const isApproving = loadingActions[approveKey];
              const isRejecting = loadingActions[rejectKey];

              return (
                <TableRow key={user.principalId.toString()}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                      {user.companyBisnis && (
                        <p className="text-sm text-muted-foreground">{user.companyBisnis}</p>
                      )}
                      {user.kotaDomisili && (
                        <p className="text-sm text-muted-foreground">📍 {user.kotaDomisili}</p>
                      )}
                      {user.idUser && (
                        <p className="text-xs text-muted-foreground font-mono">ID: {user.idUser}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded max-w-[200px] truncate block">
                        {user.principalId.toString()}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(user.principalId.toString())}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {user.email && (
                        <a
                          href={`mailto:${user.email}`}
                          className="text-sm text-blue-600 hover:underline block"
                        >
                          📧 {user.email}
                        </a>
                      )}
                      {user.phoneNumber && (
                        <a
                          href={`https://wa.me/${user.phoneNumber.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-green-600 hover:underline block"
                        >
                          📱 {user.phoneNumber}
                        </a>
                      )}
                      {!user.email && !user.phoneNumber && (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} />
                    {user.requestedRole && user.status === Status.pending && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested: {user.requestedRole}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.status === Status.active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingUser(user)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit Role
                        </Button>
                      )}
                      {user.status === Status.pending && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(user)}
                            disabled={isApproving || isRejecting}
                            className="text-green-600 hover:text-green-700"
                          >
                            {isApproving ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            )}
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(user)}
                            disabled={isApproving || isRejecting}
                            className="text-red-600 hover:text-red-700"
                          >
                            {isRejecting ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-1" />
                            )}
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {editingUser && (
        <EditRoleModal
          user={editingUser}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </>
  );
}
