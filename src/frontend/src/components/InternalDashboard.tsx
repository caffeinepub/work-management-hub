import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useCurrentUser } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, LogOut, CheckCircle, XCircle, Plus } from 'lucide-react';
import { Role, User } from '../backend';
import { useState, useEffect } from 'react';
import ActivateServiceModal from './ActivateServiceModal';

export default function InternalDashboard() {
  const { clear } = useInternetIdentity();
  const { data: currentUser, isLoading } = useCurrentUser();
  const { actor } = useActor();
  const queryClient = useQueryClient();

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

  // Check if user is Finance or Superadmin
  const canActivateService = currentUser?.role === Role.finance || currentUser?.role === Role.superadmin;

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
                <p className="text-xs text-muted-foreground">{currentUser && getRoleLabel(currentUser.role)}</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#0F172A]">Internal Dashboard</h1>
              <p className="text-[#475569] mt-2">Selamat datang, {currentUser?.name}</p>
            </div>
            {canActivateService && (
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Aktivasi Layanan Baru
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profil Internal</CardTitle>
                <CardDescription>Informasi akun Anda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">ID User</p>
                  <p className="font-medium">{currentUser?.idUser}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nama</p>
                  <p className="font-medium">{currentUser?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium">{currentUser && getRoleLabel(currentUser.role)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{currentUser?.status}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tugas Hari Ini</CardTitle>
                <CardDescription>Tugas yang perlu diselesaikan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-24">
                  <p className="text-muted-foreground">Belum ada tugas</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifikasi</CardTitle>
                <CardDescription>Pemberitahuan terbaru</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-24">
                  <p className="text-muted-foreground">Tidak ada notifikasi</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin-specific features */}
          {(currentUser?.role === Role.superadmin || currentUser?.role === Role.admin) && (
            <Card>
              <CardHeader>
                <CardTitle>Admin Panel</CardTitle>
                <CardDescription>Kelola pengguna dan sistem</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPending ? (
                  <div className="flex items-center justify-center h-24">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : pendingUsers.length === 0 ? (
                  <div className="flex items-center justify-center h-24">
                    <p className="text-muted-foreground">Tidak ada permintaan pendaftaran baru</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingUsers.map((user) => (
                          <TableRow key={user.principalId.toString()}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{getRoleLabel(user.role)}</TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApprove(user.principalId)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(user.principalId)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Activate Service Modal */}
      <ActivateServiceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
