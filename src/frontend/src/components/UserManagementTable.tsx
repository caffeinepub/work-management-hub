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
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
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
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
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
              <TableHead className="font-semibold">Email & WhatsApp</TableHead>
              <TableHead className="font-semibold">Role</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="text-right font-semibold">Action</TableHead>
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
                  <TableCell className="font-medium">
                    <div>
                      <div>{user.name}</div>
                      {user.companyBisnis && (
                        <div className="text-xs text-muted-foreground">{user.companyBisnis}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
                        {user.principalId.toString().slice(0, 20)}...
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(user.principalId.toString())}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {user.email && (
                        <div className="text-sm">
                          <a href={`mailto:${user.email}`} className="text-blue-600 hover:underline">
                            {user.email}
                          </a>
                        </div>
                      )}
                      {user.phoneNumber && (
                        <div className="text-sm">
                          <a
                            href={`https://wa.me/${user.phoneNumber.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:underline"
                          >
                            {user.phoneNumber}
                          </a>
                        </div>
                      )}
                      {!user.email && !user.phoneNumber && (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingUser(user)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Edit Role
                      </Button>
                      {user.status === Status.pending && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApprove(user)}
                            disabled={isApproving || isRejecting}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {isApproving ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleReject(user)}
                            disabled={isApproving || isRejecting}
                          >
                            {isRejecting ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Reject
                              </>
                            )}
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
