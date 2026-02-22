import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useCurrentUser } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, LogOut, CheckCircle, XCircle, Plus, Users } from 'lucide-react';
import { Role, User } from '../backend';
import { useState, useEffect } from 'react';
import ActivateServiceModal from './ActivateServiceModal';

export default function InternalDashboard() {
  const { clear } = useInternetIdentity();
  const { data: currentUser, isLoading } = useCurrentUser();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPendingUsers = async () => {
    if (!actor) return;
    setIsLoadingPending(true);
    try {
      const users = await actor.getPendingRequests();
      setPendingUsers(users);
    } catch (error) {
      console.error('Gagal mengambil data pending:', error);
    } finally {
      setIsLoadingPending(false);
    }
  };

  useEffect(() => {
    if (currentUser && (currentUser.role === Role.superadmin || currentUser.role === Role.admin)) {
      fetchPendingUsers();
    }
  }, [currentUser, actor]);

  const handleApprove = async (principalId: any) => {
    try {
      if (!actor) return;
      await actor.approveUser(principalId);
      fetchPendingUsers();
    } catch (error) {
      console.error('Gagal approve:', error);
    }
  };

  const handleReject = async (principalId: any) => {
    try {
      if (!actor) return;
      if (window.confirm('Yakin ingin menolak dan menghapus user ini?')) {
        await actor.rejectUser(principalId);
        fetchPendingUsers();
      }
    } catch (error) {
      console.error('Gagal reject:', error);
    }
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = currentUser?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'IN';

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case Role.superadmin:
        return 'Superadmin';
      case Role.admin:
        return 'Admin';
      case Role.finance:
        return 'Finance';
      case Role.concierge:
        return 'Concierge';
      case Role.asistenmu:
        return 'Asistenmu';
      case Role.strategicPartner:
        return 'Strategic Partner';
      case Role.client:
        return 'Client';
      case Role.partner:
        return 'Partner';
      default:
        return 'Internal';
    }
  };

  // Check if user is Finance or Superadmin or Admin
  const canActivateService = currentUser?.role === Role.finance || currentUser?.role === Role.superadmin || currentUser?.role === Role.admin;
  const canManageUsers = currentUser?.role === Role.superadmin || currentUser?.role === Role.admin;

  return (
    <div className="min-h-screen bg-[#FAFBFD]">
      {/* Header */}
      <header className="w-full py-4 px-4 sm:px-6 lg:px-8 border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <img src="/assets/asistenku-icon.png" alt="Asistenku" className="h-10 w-auto" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-12 w-12 rounded-full p-0">
                <Avatar className="h-12 w-12 border-4 border-yellow-500">
                  <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-2">
                <p className="text-sm font-medium">{currentUser?.name}</p>
                <p className="text-xs text-muted-foreground">{getRoleLabel(currentUser?.role || Role.admin)}</p>
              </div>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div>
            <h1 className="text-3xl font-bold text-[#0F172A]">Internal Dashboard</h1>
            <p className="text-[#475569] mt-2">Selamat datang, {currentUser?.name}</p>
          </div>

          {/* Profile Card */}
          <Card className="shadow-gold">
            <CardHeader>
              <CardTitle>Profil Anda</CardTitle>
              <CardDescription>Informasi akun internal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Nama:</span>
                  <span className="text-sm font-medium">{currentUser?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Role:</span>
                  <span className="text-sm font-medium">{getRoleLabel(currentUser?.role || Role.admin)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className="text-sm font-medium text-green-600">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Panel - Only for Superadmin and Admin */}
          {canManageUsers && (
            <Card className="shadow-gold">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Admin Panel</CardTitle>
                    <CardDescription>Kelola registrasi dan user</CardDescription>
                  </div>
                  <Button
                    onClick={() => navigate({ to: '/user-management' })}
                    variant="outline"
                    className="gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Kelola Pengguna
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Pending Registrations</h3>
                    {isLoadingPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>

                  {pendingUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Tidak ada registrasi pending</p>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingUsers.map((user) => (
                            <TableRow key={user.principalId.toString()}>
                              <TableCell className="font-medium">{user.name}</TableCell>
                              <TableCell>{getRoleLabel(user.role)}</TableCell>
                              <TableCell>{new Date(Number(user.createdAt) / 1000000).toLocaleDateString()}</TableCell>
                              <TableCell className="text-right space-x-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleApprove(user.principalId)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleReject(user.principalId)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Finance Panel - Only for Finance, Superadmin, and Admin */}
          {canActivateService && (
            <Card className="shadow-gold">
              <CardHeader>
                <CardTitle>Finance Panel</CardTitle>
                <CardDescription>Aktivasi layanan baru untuk client</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Aktivasi Layanan Baru
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Activate Service Modal */}
      <ActivateServiceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
