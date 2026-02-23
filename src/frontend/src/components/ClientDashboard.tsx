import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useCurrentUser, useGetClientTasks, useCreateTask, useApproveEstimasiClient, useGetMyLayananAktif, useGetCallerUserProfile, useUpdateProfile, useGetClientMainService } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, CheckCircle, Clock, AlertCircle, FileText, User, MessageSquare } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';
import { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'sonner';

export default function ClientDashboard() {
  const { clear, identity } = useInternetIdentity();
  const { data: currentUser, isLoading: currentUserLoading } = useCurrentUser();
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const { data: tasks = [], isLoading: tasksLoading } = useGetClientTasks(identity?.getPrincipal());
  const { data: myLayananAktif = [], isLoading: layananLoading } = useGetMyLayananAktif();
  const { data: mainService, isLoading: mainServiceLoading } = useGetClientMainService();
  const queryClient = useQueryClient();
  const createTaskMutation = useCreateTask();
  const approveEstimasiMutation = useApproveEstimasiClient();
  const updateProfileMutation = useUpdateProfile();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [newTask, setNewTask] = useState({
    layananId: '',
    judul: '',
    detailPermintaan: '',
  });

  const [editProfileForm, setEditProfileForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
  });

  // Populate edit form when profile loads
  useEffect(() => {
    if (userProfile) {
      setEditProfileForm({
        name: userProfile.name || '',
        email: userProfile.email || '',
        phoneNumber: userProfile.phoneNumber || '',
      });
    }
  }, [userProfile]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

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
      const result = await approveEstimasiMutation.mutateAsync(taskId);

      if (result.__kind__ === 'ok') {
        toast.success('Estimasi berhasil disetujui!');
      } else {
        toast.error(result.err);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyetujui estimasi');
    }
  };

  const handleUpdateProfile = async () => {
    if (!editProfileForm.name || !editProfileForm.phoneNumber || !editProfileForm.email) {
      toast.error('Semua field harus diisi');
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        name: editProfileForm.name,
        phoneNumber: editProfileForm.phoneNumber,
        email: editProfileForm.email,
      });

      toast.success('Profil berhasil diperbarui!');
      setIsEditProfileOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui profil');
    }
  };

  // Calculate task metrics from tasks array
  const taskMetrics = useMemo(() => {
    const clientReview = tasks.filter(t => t.status === 'Client Review').length;
    const sedangDikerjakan = tasks.filter(t => 
      t.status === 'Sedang Dikerjakan' || 
      t.status === 'Sedang Didelegasikan' || 
      t.status === 'Quality Assurance' ||
      t.status === 'Revision'
    ).length;
    const completed = tasks.filter(t => t.status === 'Completed').length;

    return { clientReview, sedangDikerjakan, completed };
  }, [tasks]);

  if (currentUserLoading || profileLoading || tasksLoading || layananLoading || mainServiceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFBFD]">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  const userName = currentUser?.name || 'Client';
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-[#FAFBFD]">
      {/* Header */}
      <header className="w-full py-4 px-4 sm:px-6 lg:px-8 border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <img src="/assets/asistenku-horizontal.png" alt="Asistenku" className="h-10 w-auto" />
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="relative h-12 w-12 rounded-full p-0 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2"
            >
              <Avatar className="h-12 w-12 border-4 border-yellow-500">
                <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>

            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-[#0F172A]">{userName}</p>
                    <p className="text-xs text-[#475569] truncate">{currentUser?.email || 'No email'}</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsEditProfileOpen(true);
                      setIsProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[#0F172A] hover:bg-[#FDFCFB] flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Greeting */}
          <div>
            <h1 className="text-3xl font-bold text-[#0F172A]">Halo, {userName}! 👋</h1>
            <p className="text-[#475569] mt-2">Selamat datang kembali di dashboard Anda</p>
          </div>

          {/* Task Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-gold border border-[#E5D5C0]">
              <CardHeader className="pb-3">
                <CardDescription className="text-[#475569]">Client Review</CardDescription>
                <CardTitle className="text-4xl font-bold text-[#D4AF37]">{taskMetrics.clientReview}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#475569]">Task menunggu review Anda</p>
              </CardContent>
            </Card>

            <Card className="shadow-gold border border-[#E5D5C0]">
              <CardHeader className="pb-3">
                <CardDescription className="text-[#475569]">Sedang Dikerjakan</CardDescription>
                <CardTitle className="text-4xl font-bold text-[#0F172A]">{taskMetrics.sedangDikerjakan}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#475569]">Task dalam proses</p>
              </CardContent>
            </Card>

            <Card className="shadow-gold border border-[#E5D5C0]">
              <CardHeader className="pb-3">
                <CardDescription className="text-[#475569]">Completed</CardDescription>
                <CardTitle className="text-4xl font-bold text-green-600">{taskMetrics.completed}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#475569]">Task selesai</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Service Card */}
          {mainService && (
            <Card className="shadow-gold border-2 border-[#D4AF37] bg-gradient-to-br from-white to-[#FDFCFB]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl text-[#0F172A]">{mainService.nama}</CardTitle>
                    <CardDescription className="text-[#475569] mt-1">{mainService.scopeKerja}</CardDescription>
                  </div>
                  <Badge className="bg-[#D4AF37] text-white hover:bg-[#C4A037] px-4 py-2 text-sm">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-[#475569]">Saldo Jam</p>
                    <p className="text-2xl font-bold text-[#0F172A]">{Number(mainService.saldoJamEfektif)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#475569]">On Hold</p>
                    <p className="text-2xl font-bold text-[#0F172A]">{Number(mainService.jamOnHold)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#475569]">Harga</p>
                    <p className="text-2xl font-bold text-[#0F172A]">Rp {Number(mainService.harga).toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#475569]">Deadline</p>
                    <p className="text-lg font-semibold text-[#0F172A]">
                      {new Date(Number(mainService.deadline) / 1000000).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#D4AF37] hover:bg-[#C4A037] text-white shadow-gold">
                  <Plus className="mr-2 h-5 w-5" />
                  Buat Task Baru
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-[#0F172A]">Buat Task Baru</DialogTitle>
                  <DialogDescription className="text-[#475569]">
                    Isi detail task yang ingin Anda buat
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="layanan" className="text-[#0F172A]">Pilih Layanan</Label>
                    <Select value={newTask.layananId} onValueChange={(value) => setNewTask({ ...newTask, layananId: value })}>
                      <SelectTrigger id="layanan">
                        <SelectValue placeholder="Pilih layanan" />
                      </SelectTrigger>
                      <SelectContent>
                        {myLayananAktif.map((layanan) => (
                          <SelectItem key={layanan.id} value={layanan.id}>
                            {layanan.nama} (Saldo: {Number(layanan.saldo)} jam)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="judul" className="text-[#0F172A]">Judul Task</Label>
                    <Input
                      id="judul"
                      value={newTask.judul}
                      onChange={(e) => setNewTask({ ...newTask, judul: e.target.value })}
                      placeholder="Masukkan judul task"
                      className="border-[#E5D5C0]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="detail" className="text-[#0F172A]">Detail Permintaan</Label>
                    <Textarea
                      id="detail"
                      value={newTask.detailPermintaan}
                      onChange={(e) => setNewTask({ ...newTask, detailPermintaan: e.target.value })}
                      placeholder="Jelaskan detail task Anda"
                      rows={4}
                      className="border-[#E5D5C0]"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateTask}
                    disabled={createTaskMutation.isPending}
                    className="bg-[#D4AF37] hover:bg-[#C4A037] text-white"
                  >
                    {createTaskMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Membuat...
                      </>
                    ) : (
                      'Buat Task'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              className="border-[#E5D5C0] text-[#0F172A] hover:bg-[#FDFCFB]"
              onClick={() => window.open('https://wa.me/6281234567890', '_blank')}
            >
              <SiWhatsapp className="mr-2 h-5 w-5 text-green-600" />
              Hubungi Asistenmu
            </Button>
          </div>

          {/* Task List */}
          <Card className="shadow-gold border border-[#E5D5C0]">
            <CardHeader>
              <CardTitle className="text-[#0F172A]">Daftar Task</CardTitle>
              <CardDescription className="text-[#475569]">Semua task Anda</CardDescription>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-[#E5D5C0]" />
                  <p className="mt-4 text-[#475569]">Belum ada task. Buat task pertama Anda!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <Card key={task.id} className="border border-[#E5D5C0]">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg text-[#0F172A]">{task.judul}</CardTitle>
                            <CardDescription className="text-[#475569] mt-1">{task.detailPermintaan}</CardDescription>
                          </div>
                          <Badge
                            className={
                              task.status === 'Completed'
                                ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                : task.status === 'Client Review'
                                ? 'bg-[#D4AF37] text-white hover:bg-[#C4A037]'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                            }
                          >
                            {task.status === 'Completed' && <CheckCircle className="mr-1 h-3 w-3" />}
                            {task.status === 'Client Review' && <AlertCircle className="mr-1 h-3 w-3" />}
                            {task.status !== 'Completed' && task.status !== 'Client Review' && <Clock className="mr-1 h-3 w-3" />}
                            {task.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-[#475569]">
                            <span className="font-medium">Estimasi:</span> {Number(task.estimasiJam)} jam
                          </div>
                          {task.status === 'Awaiting Client Approval' && (
                            <Button
                              size="sm"
                              onClick={() => handleApproveEstimasi(task.id)}
                              disabled={approveEstimasiMutation.isPending}
                              className="bg-[#D4AF37] hover:bg-[#C4A037] text-white"
                            >
                              {approveEstimasiMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Menyetujui...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Setujui Estimasi
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-[#0F172A]">Edit Profile</DialogTitle>
            <DialogDescription className="text-[#475569]">
              Perbarui informasi profil Anda
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-[#0F172A]">Nama</Label>
              <Input
                id="edit-name"
                value={editProfileForm.name}
                onChange={(e) => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                placeholder="Nama lengkap"
                className="border-[#E5D5C0]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone" className="text-[#0F172A]">Nomor WhatsApp</Label>
              <Input
                id="edit-phone"
                value={editProfileForm.phoneNumber}
                onChange={(e) => setEditProfileForm({ ...editProfileForm, phoneNumber: e.target.value })}
                placeholder="08123456789"
                className="border-[#E5D5C0]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email" className="text-[#0F172A]">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editProfileForm.email}
                onChange={(e) => setEditProfileForm({ ...editProfileForm, email: e.target.value })}
                placeholder="email@example.com"
                className="border-[#E5D5C0]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleUpdateProfile}
              disabled={updateProfileMutation.isPending}
              className="bg-[#D4AF37] hover:bg-[#C4A037] text-white"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-24 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-[#475569]">
          <p>
            © {new Date().getFullYear()} Asistenku. Built with ❤️ using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                window.location.hostname
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#D4AF37] hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
