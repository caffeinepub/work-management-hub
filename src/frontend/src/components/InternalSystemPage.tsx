import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useCurrentUser } from '../hooks/useQueries';
import { useNavigate } from '@tanstack/react-router';
import { useInternalRegistration } from '../hooks/useRegistration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, Shield } from 'lucide-react';
import { Role, Status } from '../backend';

const INTERNAL_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'finance', label: 'Finance' },
  { value: 'concierge', label: 'Concierge' },
  { value: 'asistenmu', label: 'Asistenmu' },
  { value: 'strategicPartner', label: 'Strategic Partner' },
];

export default function InternalSystemPage() {
  const { identity, login, loginStatus } = useInternetIdentity();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const { mutate: register, isPending, isSuccess, error } = useInternalRegistration();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && selectedRole) {
      register({ name: name.trim(), inputRole: selectedRole });
    }
  };

  // Check if user is internal role
  const isInternalRole = (role: Role) => {
    return [
      Role.superadmin,
      Role.admin,
      Role.finance,
      Role.concierge,
      Role.asistenmu,
      Role.strategicPartner,
    ].includes(role);
  };

  // If authenticated and user is internal with active status, redirect to dashboard
  if (isAuthenticated && currentUser && isInternalRole(currentUser.role) && currentUser.status === Status.active) {
    navigate({ to: '/internal-dashboard' });
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FAFBFD]">
      {/* Header */}
      <header className="w-full py-4 px-4 sm:px-6 lg:px-8 border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center">
            <img src="/assets/asistenku-icon.png" alt="Asistenku" className="h-10 w-auto" />
          </a>
          <a href="/" className="text-sm text-[#475569] hover:text-[#0F172A] transition-colors">
            Kembali ke Beranda
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black/5">
              <Shield className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#0F172A]">Internal System</h1>
            <p className="text-lg text-[#475569]">
              Portal untuk tim internal Asistenku
            </p>
          </div>

          {/* Login Section */}
          {!isAuthenticated && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Login dengan Internet Identity</CardTitle>
                <CardDescription>
                  Silakan login terlebih dahulu untuk mengakses Internal System
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleLogin} disabled={isLoggingIn} className="w-full">
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* After Login - Show Dashboard Access and Registration */}
          {isAuthenticated && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Card - Dashboard Access */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Login Internal</CardTitle>
                  <CardDescription>
                    {currentUser && isInternalRole(currentUser.role)
                      ? currentUser.status === Status.pending
                        ? 'Akun Anda sedang menunggu persetujuan'
                        : 'Masuk ke dashboard internal'
                      : 'Anda belum terdaftar sebagai staff internal'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : currentUser && isInternalRole(currentUser.role) ? (
                    currentUser.status === Status.pending ? (
                      <Alert>
                        <AlertDescription>
                          Registrasi Anda sedang ditinjau oleh admin. Silakan tunggu persetujuan.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Button onClick={() => navigate({ to: '/internal-dashboard' })} className="w-full">
                        Masuk ke Dashboard
                      </Button>
                    )
                  ) : (
                    <Alert>
                      <AlertDescription>
                        Silakan daftar sebagai staff internal menggunakan form di sebelah kanan.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Right Card - Registration Form */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Registrasi Internal</CardTitle>
                  <CardDescription>
                    Daftar sebagai staff internal Asistenku
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isSuccess ? (
                    <div className="space-y-4">
                      <div className="flex flex-col items-center gap-4 py-4">
                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                        <p className="text-center font-medium">Registrasi Berhasil!</p>
                      </div>
                      <Alert>
                        <AlertDescription>
                          Registrasi Anda telah dikirim. Status otomatis pending dan menunggu persetujuan admin.
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : currentUser && isInternalRole(currentUser.role) ? (
                    <Alert>
                      <AlertDescription>
                        Anda sudah terdaftar sebagai staff internal.
                      </AlertDescription>
                    </Alert>
                  ) : currentUser ? (
                    <Alert>
                      <AlertDescription>
                        Anda sudah terdaftar dengan role lain. Tidak dapat mendaftar sebagai staff internal.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nama Lengkap</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Masukkan nama lengkap"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          disabled={isPending}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role">Role Internal</Label>
                        <Select value={selectedRole} onValueChange={setSelectedRole} disabled={isPending}>
                          <SelectTrigger id="role">
                            <SelectValue placeholder="Pilih role internal" />
                          </SelectTrigger>
                          <SelectContent>
                            {INTERNAL_ROLES.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error.message}</AlertDescription>
                        </Alert>
                      )}

                      <Button type="submit" className="w-full" disabled={isPending || !name.trim() || !selectedRole}>
                        {isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Mendaftar...
                          </>
                        ) : (
                          'Daftar Sekarang'
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
