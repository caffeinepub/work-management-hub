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
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

export default function ClientDashboard() {
  const { clear, identity } = useInternetIdentity();
  const { data: currentUser, isLoading } = useCurrentUser();
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const { data: tasks = [], isLoading: tasksLoading } = useGetClientTasks(identity?.getPrincipal() || null);
  const { data: myLayananAktif = [], isLoading: layananLoading } = useGetMyLayananAktif(identity?.getPrincipal() || null);
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

  const handleUpdateProfile = async () => {
    if (!editProfileForm.name || !editProfileForm.email || !editProfileForm.phoneNumber) {
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

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('requested')) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Clock className="w-3 h-3 mr-1" />Requested</Badge>;
    } else if (statusLower.includes('awaiting') || statusLower.includes('menunggu')) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><AlertCircle className="w-3 h-3 mr-1" />Menunggu Persetujuan</Badge>;
    } else if (statusLower.includes('didelegasikan')) {
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

  // Calculate task metrics
  const taskMetrics = {
    awaitingReview: tasks.filter(t => 
      t.status.toLowerCase().includes('awaiting') || 
      t.status.toLowerCase().includes('review') ||
      t.status.toLowerCase().includes('menunggu')
    ).length,
    inProgress: tasks.filter(t => 
      t.status.toLowerCase().includes('dikerjakan') || 
      t.status.toLowerCase().includes('progress') ||
      t.status.toLowerCase().includes('quality') ||
      t.status.toLowerCase().includes('qa')
    ).length,
    revision: tasks.filter(t => 
      t.status.toLowerCase().includes('revision')
    ).length,
    completed: tasks.filter(t => 
      t.status.toLowerCase().includes('completed') || 
      t.status.toLowerCase().includes('selesai')
    ).length,
  };

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1A2E35]" />
      </div>
    );
  }

  const initials = userProfile?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'CL';

  const userName = userProfile?.name || currentUser?.name || 'User';

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Header */}
      <header className="w-full py-4 px-4 sm:px-6 lg:px-8 border-b border-[#E5D5C0] bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <img src="/assets/asistenku-icon.png" alt="Asistenku" className="h-10 w-auto" />
          </div>
          <div className="relative" ref={dropdownRef}>
            <DropdownMenu open={isProfileDropdownOpen} onOpenChange={setIsProfileDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-12 w-12 rounded-full p-0">
                  <Avatar className="h-12 w-12 border-2 border-[#D4AF37]">
                    <AvatarFallback className="bg-gradient-to-br from-[#D4AF37] to-[#C5A028] text-white font-bold tracking-wide">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border-[#E5D5C0]">
                <DropdownMenuLabel className="text-[#2D2D2D]">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium tracking-wide">{userName}</p>
                    <p className="text-xs text-[#8B8B8B] font-normal">Client</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#E5D5C0]" />
                <DropdownMenuItem 
                  onClick={() => {
                    setIsEditProfileOpen(true);
                    setIsProfileDropdownOpen(false);
                  }}
                  className="text-[#2D2D2D] cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  Edit Profil
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-[#D4AF37] cursor-pointer font-medium"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Greeting Section */}
          <div>
            <h1 className="text-3xl font-bold tracking-wide text-[#1A2E35]">
              Ruang Kerja Kamu, selamat datang {userName}!
            </h1>
          </div>

          {/* Main Service Card */}
          {mainServiceLoading ? (
            <Card className="bg-white border-[0.5px] border-[#E5D5C0] shadow-[0_4px_20px_-5px_rgba(212,175,55,0.15)]">
              <CardContent className="p-6">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#1A2E35]" />
                </div>
              </CardContent>
            </Card>
          ) : mainService ? (
            <Card className="bg-white border-[0.5px] border-[#E5D5C0] shadow-[0_4px_20px_-5px_rgba(212,175,55,0.15)]">
              <CardHeader>
                <CardTitle className="text-xl font-bold tracking-wide text-[#1A2E35]">Layanan Aktif</CardTitle>
                <CardDescription className="text-[#2D2D2D]">Informasi layanan yang sedang berjalan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-[#8B8B8B] mb-1 tracking-wide">Tipe Layanan</p>
                    <p className="text-lg font-semibold text-[#1A2E35]">{mainService.nama}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#8B8B8B] mb-1 tracking-wide">Sisa Unit Layanan</p>
                    <p className="text-lg font-semibold text-[#1A2E35]">{Number(mainService.saldoJamEfektif / BigInt(2))} Unit</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#8B8B8B] mb-1 tracking-wide">Unit On-Hold</p>
                    <p className="text-lg font-semibold text-[#1A2E35]">{Number(mainService.jamOnHold / BigInt(2))} Unit</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#8B8B8B] mb-1 tracking-wide">Sharing Layanan</p>
                    <p className="text-lg font-semibold text-[#1A2E35]">
                      {myLayananAktif.length > 1 ? 'Aktif' : 'Tidak'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white border-[0.5px] border-[#E5D5C0] shadow-[0_4px_20px_-5px_rgba(212,175,55,0.15)]">
              <CardContent className="p-6">
                <p className="text-center text-[#8B8B8B]">Belum ada layanan aktif</p>
              </CardContent>
            </Card>
          )}

          {/* Task Status Cards (4 Metrics) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border-[0.5px] border-yellow-200 shadow-[0_4px_20px_-5px_rgba(212,175,55,0.15)]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#8B8B8B] mb-1 tracking-wide">Task Meminta Review Kamu</p>
                    <p className="text-3xl font-bold text-yellow-700">{taskMetrics.awaitingReview}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-yellow-50 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-yellow-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-[0.5px] border-blue-200 shadow-[0_4px_20px_-5px_rgba(212,175,55,0.15)]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#8B8B8B] mb-1 tracking-wide">Task Sedang Dikerjakan Tim Asistenku</p>
                    <p className="text-3xl font-bold text-blue-700">{taskMetrics.inProgress}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-blue-700 animate-spin" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-[0.5px] border-orange-200 shadow-[0_4px_20px_-5px_rgba(212,175,55,0.15)]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#8B8B8B] mb-1 tracking-wide">Task yang Sedang Direvisi</p>
                    <p className="text-3xl font-bold text-orange-700">{taskMetrics.revision}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-orange-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-[0.5px] border-green-200 shadow-[0_4px_20px_-5px_rgba(212,175,55,0.15)]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#8B8B8B] mb-1 tracking-wide">Task Selesai</p>
                    <p className="text-3xl font-bold text-green-700">{taskMetrics.completed}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action & Support Section */}
          <div className="flex flex-wrap gap-4">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#1A2E35] hover:bg-[#2A3E45] text-white px-6 py-3 text-lg tracking-wide">
                  <Plus className="w-5 h-5 mr-2" />
                  Buat Task Baru
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px] bg-white border-[#E5D5C0]">
                <DialogHeader>
                  <DialogTitle className="text-[#1A2E35] tracking-wide">Buat Task Baru</DialogTitle>
                  <DialogDescription className="text-[#2D2D2D]">
                    Pilih layanan aktif Anda dan masukkan detail task yang ingin dibuat.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="layananId" className="text-[#2D2D2D] tracking-wide">Pilih Layanan</Label>
                    {layananLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-[#1A2E35]" />
                      </div>
                    ) : myLayananAktif.length === 0 ? (
                      <div className="text-sm text-[#2D2D2D] bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        Tidak ada layanan aktif dengan saldo mencukupi (minimal 1 unit / 2 jam).
                      </div>
                    ) : (
                      <Select
                        value={newTask.layananId}
                        onValueChange={(value) => setNewTask({ ...newTask, layananId: value })}
                      >
                        <SelectTrigger className="border-[#E5D5C0]">
                          <SelectValue placeholder="Pilih layanan aktif" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#E5D5C0]">
                          {myLayananAktif.map((layanan) => (
                            <SelectItem key={layanan.id} value={layanan.id}>
                              <div className="flex flex-col">
                                <span className="font-medium text-[#1A2E35]">{layanan.nama}</span>
                                <span className="text-xs text-[#8B8B8B]">
                                  {layanan.id} • {Number(layanan.unitAktif)} unit tersedia • {layanan.namaAsistenmu}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="judul" className="text-[#2D2D2D] tracking-wide">Judul Task</Label>
                    <Input
                      id="judul"
                      placeholder="Masukkan judul task"
                      value={newTask.judul}
                      onChange={(e) => setNewTask({ ...newTask, judul: e.target.value })}
                      className="border-[#E5D5C0]"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="detailPermintaan" className="text-[#2D2D2D] tracking-wide">Detail Permintaan</Label>
                    <Textarea
                      id="detailPermintaan"
                      placeholder="Jelaskan detail task yang Anda butuhkan"
                      rows={4}
                      value={newTask.detailPermintaan}
                      onChange={(e) => setNewTask({ ...newTask, detailPermintaan: e.target.value })}
                      className="border-[#E5D5C0]"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    onClick={handleCreateTask}
                    disabled={createTaskMutation.isPending || !newTask.layananId}
                    className="bg-[#1A2E35] hover:bg-[#2A3E45]"
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
              className="border-[#E5D5C0] text-[#1A2E35] hover:bg-[#FDFCFB] px-6 py-3 text-lg tracking-wide"
              onClick={() => toast.info('Fitur Tiket Segera Hadir')}
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Tiket Concierge
            </Button>

            <Button
              asChild
              className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 text-lg tracking-wide"
            >
              <a href="https://wa.me/628817743613" target="_blank" rel="noopener noreferrer">
                <SiWhatsapp className="w-5 h-5 mr-2" />
                Hubungi WhatsApp Resmi
              </a>
            </Button>
          </div>

          {/* Task List */}
          <Card className="bg-white border-[0.5px] border-[#E5D5C0] shadow-[0_4px_20px_-5px_rgba(212,175,55,0.15)]">
            <CardHeader>
              <CardTitle className="text-xl font-bold tracking-wide text-[#1A2E35]">Daftar Task</CardTitle>
              <CardDescription className="text-[#2D2D2D]">Kelola dan pantau semua task Anda</CardDescription>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[#1A2E35]" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8 text-[#8B8B8B]">
                  Belum ada task. Klik "Buat Task Baru" untuk memulai.
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="border border-[#E5D5C0] rounded-lg p-4 hover:bg-[#FDFCFB] transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg text-[#1A2E35] tracking-wide">{task.judul}</h3>
                            {getStatusBadge(task.status)}
                          </div>
                          <p className="text-sm text-[#2D2D2D] mb-2">
                            {task.detailPermintaan}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-[#8B8B8B]">
                            <span>ID: {task.id}</span>
                            <span>Layanan: {task.layananId}</span>
                            {task.estimasiJam > 0 && (
                              <span>Estimasi: {Number(task.estimasiJam)} jam</span>
                            )}
                          </div>
                        </div>
                        {task.status === 'Awaiting Client Approval' && (
                          <Button
                            size="sm"
                            onClick={() => handleApproveEstimasi(task.id)}
                            disabled={approveEstimasiMutation.isPending}
                            className="ml-4 bg-[#1A2E35] hover:bg-[#2A3E45]"
                          >
                            {approveEstimasiMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                Memproses...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-3 w-3" />
                                Setujui Estimasi
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 mt-12 border-t border-[#E5D5C0] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Asistenku &copy; 2026 PT. Asistenku Digital Indonesia
          </p>
        </div>
      </footer>

      {/* Edit Profile Modal */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white border-[#E5D5C0]">
          <DialogHeader>
            <DialogTitle className="text-[#1A2E35] tracking-wide">Edit Profil</DialogTitle>
            <DialogDescription className="text-[#2D2D2D]">
              Perbarui informasi profil Anda di sini.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name" className="text-[#2D2D2D] tracking-wide">Nama</Label>
              <Input
                id="edit-name"
                value={editProfileForm.name}
                onChange={(e) => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                className="border-[#E5D5C0]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email" className="text-[#2D2D2D] tracking-wide">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editProfileForm.email}
                onChange={(e) => setEditProfileForm({ ...editProfileForm, email: e.target.value })}
                className="border-[#E5D5C0]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone" className="text-[#2D2D2D] tracking-wide">Nomor Telepon</Label>
              <Input
                id="edit-phone"
                value={editProfileForm.phoneNumber}
                onChange={(e) => setEditProfileForm({ ...editProfileForm, phoneNumber: e.target.value })}
                className="border-[#E5D5C0]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditProfileOpen(false)}
              className="border-[#E5D5C0]"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleUpdateProfile}
              disabled={updateProfileMutation.isPending}
              className="bg-[#1A2E35] hover:bg-[#2A3E45]"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
