import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useCurrentUser, useGetClientTasks, useCreateTask, useApproveEstimasiClient } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, LogOut, Plus, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ClientDashboard() {
  const { clear, identity } = useInternetIdentity();
  const { data: currentUser, isLoading } = useCurrentUser();
  const { data: tasks = [], isLoading: tasksLoading } = useGetClientTasks(identity?.getPrincipal() || null);
  const queryClient = useQueryClient();
  const createTaskMutation = useCreateTask();
  const approveEstimasiMutation = useApproveEstimasiClient();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    layananId: '',
    judul: '',
    detailPermintaan: '',
  });

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    window.location.href = '/';
  };

  const handleCreateTask = async () => {
    if (!identity || !currentUser) return;

    if (!newTask.layananId || !newTask.judul || !newTask.detailPermintaan) {
      toast.error('Semua field harus diisi');
      return;
    }

    try {
      const result = await createTaskMutation.mutateAsync({
        clientId: identity.getPrincipal(),
        layananId: newTask.layananId,
        judul: newTask.judul,
        detailPermintaan: newTask.detailPermintaan,
      });

      if (result.__kind__ === 'ok') {
        toast.success('Task berhasil dibuat!');
        setIsCreateDialogOpen(false);
        setNewTask({ layananId: '', judul: '', detailPermintaan: '' });
      } else {
        toast.error(result.err);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal membuat task');
    }
  };

  const handleApproveEstimasi = async (taskId: string) => {
    try {
      const result = await approveEstimasiMutation.mutateAsync({ taskId });

      if (result.__kind__ === 'ok') {
        toast.success('Estimasi berhasil disetujui!');
      } else {
        toast.error(result.err);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyetujui estimasi');
    }
  };

  const getStatusBadge = (status: string) => {
    // Status is already a string from TaskClientView (masked by backend)
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('requested')) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Clock className="w-3 h-3 mr-1" />Requested</Badge>;
    } else if (statusLower.includes('awaiting') || statusLower.includes('menunggu')) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><AlertCircle className="w-3 h-3 mr-1" />Menunggu Persetujuan</Badge>;
    } else if (statusLower.includes('didelegasikan')) {
      // Masked status: "Sedang Didelegasikan" (hides PendingPartner & RejectedByPartner)
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200"><Clock className="w-3 h-3 mr-1" />Sedang Didelegasikan</Badge>;
    } else if (statusLower.includes('dikerjakan') || statusLower.includes('progress')) {
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Sedang Dikerjakan</Badge>;
    } else if (statusLower.includes('quality') || statusLower.includes('qa')) {
      return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200"><FileText className="w-3 h-3 mr-1" />Quality Assurance</Badge>;
    } else if (statusLower.includes('review')) {
      return <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200"><FileText className="w-3 h-3 mr-1" />Client Review</Badge>;
    } else if (statusLower.includes('revision')) {
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200"><AlertCircle className="w-3 h-3 mr-1" />Revision</Badge>;
    } else if (statusLower.includes('completed') || statusLower.includes('selesai')) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
    }
    
    return <Badge variant="outline">{status}</Badge>;
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
    .slice(0, 2) || 'CL';

  // Count active tasks (Sedang Dikerjakan)
  const activeTasks = tasks.filter(t => t.status.toLowerCase().includes('dikerjakan') || t.status.toLowerCase().includes('progress')).length;

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
                <p className="text-xs text-muted-foreground">Client</p>
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
              <h1 className="text-3xl font-bold text-[#0F172A]">Client Dashboard</h1>
              <p className="text-[#475569] mt-2">Selamat datang, {currentUser?.name}</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Task Baru
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Buat Task Baru</DialogTitle>
                  <DialogDescription>
                    Isi detail task yang ingin Anda buat. Pastikan layanan memiliki saldo minimal 2 jam (1 Unit).
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="layananId">ID Layanan</Label>
                    <Input
                      id="layananId"
                      placeholder="Contoh: LAY-001"
                      value={newTask.layananId}
                      onChange={(e) => setNewTask({ ...newTask, layananId: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="judul">Judul Task</Label>
                    <Input
                      id="judul"
                      placeholder="Masukkan judul task"
                      value={newTask.judul}
                      onChange={(e) => setNewTask({ ...newTask, judul: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="detailPermintaan">Detail Permintaan</Label>
                    <Textarea
                      id="detailPermintaan"
                      placeholder="Jelaskan detail task yang Anda butuhkan"
                      rows={4}
                      value={newTask.detailPermintaan}
                      onChange={(e) => setNewTask({ ...newTask, detailPermintaan: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleCreateTask} disabled={createTaskMutation.isPending}>
                    {createTaskMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Buat Task
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profil Client</CardTitle>
                <CardDescription>Informasi akun Anda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">ID Client</p>
                  <p className="font-medium">{currentUser?.idUser}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nama</p>
                  <p className="font-medium">{currentUser?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Perusahaan/Bisnis</p>
                  <p className="font-medium">{currentUser?.companyBisnis || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{currentUser?.status}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Tasks</CardTitle>
                <CardDescription>Jumlah task yang Anda miliki</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-24">
                  <p className="text-4xl font-bold text-primary">{tasks.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tasks Aktif</CardTitle>
                <CardDescription>Task yang sedang berjalan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-24">
                  <p className="text-4xl font-bold text-emerald-600">
                    {activeTasks}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tasks List */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Task</CardTitle>
              <CardDescription>Semua task yang Anda buat</CardDescription>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Belum ada task. Buat task pertama Anda!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div key={task.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg">{task.judul}</h3>
                          <p className="text-sm text-muted-foreground">ID: {task.id}</p>
                        </div>
                        {getStatusBadge(task.status)}
                      </div>
                      <p className="text-sm text-[#475569]">{task.detailPermintaan}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Layanan ID:</span>{' '}
                          <span className="font-medium">{task.layananId}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Estimasi:</span>{' '}
                          <span className="font-medium">{task.estimasiJam.toString()} jam</span>
                        </div>
                      </div>
                      {task.status.toLowerCase().includes('menunggu') && (
                        <div className="pt-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveEstimasi(task.id)}
                            disabled={approveEstimasiMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            {approveEstimasiMutation.isPending && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                            <CheckCircle className="w-3 h-3 mr-2" />
                            Setujui Estimasi
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-4 sm:px-6 lg:px-8 border-t border-gray-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Asistenku. Built with ❤️ using{' '}
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
