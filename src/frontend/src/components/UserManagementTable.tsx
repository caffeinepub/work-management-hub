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
import { Badge } from '@/components/ui/badge';

interface UserManagementTableProps {
  users: User[];
}

// Helper function to transform requestedRole from lowercase to Title Case
function transformRoleLabel(role: string | undefined | null): string {
  if (!role) return 'Unknown';
  
  const roleMap: Record<string, string> = {
    'client': 'Client',
    'asistenmu': 'Asistenmu',
    'admin': 'Admin',
    'superadmin': 'Superadmin',
    'finance': 'Finance',
    'concierge': 'Concierge',
    'strategicpartner': 'Strategic Partner',
    'partner': 'Partner',
  };
  
  return roleMap[role.toLowerCase()] || role.charAt(0).toUpperCase() + role.slice(1);
}

// Helper function to get status badge
function getStatusBadge(status: Status) {
  switch (status) {
    case Status.active:
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
    case Status.pending:
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
    case Status.rejected:
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
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
      
      // Call approveUser with principalId
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

  return (
    <>
      <div className="rounded-md border border-[#E5D5C0] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#FDFCFB] hover:bg-[#FDFCFB]">
              <TableHead className="text-[#0F172A] font-semibold">Nama</TableHead>
              <TableHead className="text-[#0F172A] font-semibold">Bisnis</TableHead>
              <TableHead className="text-[#0F172A] font-semibold">Kota</TableHead>
              <TableHead className="text-[#0F172A] font-semibold">WhatsApp</TableHead>
              <TableHead className="text-[#0F172A] font-semibold">Role Diajukan</TableHead>
              <TableHead className="text-[#0F172A] font-semibold">Principal ID</TableHead>
              <TableHead className="text-[#0F172A] font-semibold">Status</TableHead>
              <TableHead className="text-[#0F172A] font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const approveKey = `approve-${user.principalId.toString()}`;
              const rejectKey = `reject-${user.principalId.toString()}`;
              const isApproving = loadingActions[approveKey];
              const isRejecting = loadingActions[rejectKey];
              
              return (
                <TableRow key={user.principalId.toString()} className="hover:bg-[#FDFCFB]/50">
                  <TableCell className="font-medium text-[#0F172A]">
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-xs text-[#475569]">{user.idUser}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#475569]">
                    {user.companyBisnis || '-'}
                  </TableCell>
                  <TableCell className="text-[#475569]">
                    {user.kotaDomisili || '-'}
                  </TableCell>
                  <TableCell className="text-[#475569]">
                    {user.phoneNumber ? (
                      <a 
                        href={`https://wa.me/${user.phoneNumber.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 hover:underline"
                      >
                        {user.phoneNumber}
                      </a>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E5D5C0] text-[#0F172A]">
                      {transformRoleLabel(user.requestedRole)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-xs text-[#475569] bg-[#F8F9FA] px-2 py-1 rounded max-w-[120px] truncate">
                        {user.principalId.toString()}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(user.principalId.toString())}
                      >
                        <Copy className="h-3 w-3 text-[#475569]" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(user.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.status === Status.active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingUser(user)}
                          className="text-[#0F172A] border-[#E5D5C0] hover:bg-[#FDFCFB]"
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
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            {isApproving ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Approving...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(user)}
                            disabled={isApproving || isRejecting}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            {isRejecting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Rejecting...
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-1" />
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
