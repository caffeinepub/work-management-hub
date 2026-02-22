import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useCurrentUser } from '../hooks/useQueries';
import { useNavigate } from '@tanstack/react-router';
import { usePartnerRegistration } from '../hooks/useRegistration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, Users } from 'lucide-react';
import { Role, Status } from '../backend';

export default function PartnerPortalPage() {
  const { identity, login, loginStatus } = useInternetIdentity();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [kota, setKota] = useState('');
  const { mutate: register, isPending, isSuccess, error } = usePartnerRegistration();

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
    if (name.trim() && kota.trim()) {
      register({ name: name.trim(), kota: kota.trim() });
    }
  };

  // If authenticated and user is a partner with active status, redirect to dashboard
  if (isAuthenticated && currentUser && currentUser.role === Role.partner && currentUser.status === Status.active) {
    navigate({ to: '/partner' });
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
              <Users className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#0F172A]">Partner Portal</h1>
            <p className="text-lg text-[#475569]">
              Bergabunglah dengan tim Asistenku sebagai Partner
            </p>
          </div>

          {/* Login Section */}
          {!isAuthenticated && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Login dengan Internet Identity</CardTitle>
                <CardDescription>
                  Silakan login terlebih dahulu untuk mengakses Partner Portal
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

          {/* After Login - Show Dashboard Access or Registration */}
          {isAuthenticated && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Card - Dashboard Access */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Akses Dashboard Partner</CardTitle>
                  <CardDescription>
                    {currentUser && currentUser.role === Role.partner
                      ? currentUser.status === Status.pending
                        ? 'Akun Anda sedang menunggu persetujuan'
                        : 'Masuk ke dashboard Partner Anda'
                      : 'Anda belum terdaftar sebagai Partner'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : currentUser && currentUser.role === Role.partner ? (
                    currentUser.status === Status.pending ? (
                      <Alert>
                        <AlertDescription>
                          Registrasi Anda sedang ditinjau oleh admin. Silakan tunggu persetujuan.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Button onClick={() => navigate({ to: '/partner' })} className="w-full">
                        Masuk ke Dashboard
                      </Button>
                    )
                  ) : (
                    <Alert>
                      <AlertDescription>
                        Silakan daftar sebagai Partner menggunakan form di sebelah kanan.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Right Card - Registration Form */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Registrasi Partner</CardTitle>
                  <CardDescription>
                    Daftar sebagai Partner Asistenku
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
                          Registrasi Anda telah dikirim. Silakan tunggu persetujuan dari admin.
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : currentUser && currentUser.role === Role.partner ? (
                    <Alert>
                      <AlertDescription>
                        Anda sudah terdaftar sebagai Partner.
                      </AlertDescription>
                    </Alert>
                  ) : currentUser ? (
                    <Alert>
                      <AlertDescription>
                        Anda sudah terdaftar dengan role lain. Tidak dapat mendaftar sebagai Partner.
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
                        <Label htmlFor="kota">Kota Domisili</Label>
                        <Input
                          id="kota"
                          type="text"
                          placeholder="Masukkan kota domisili"
                          value={kota}
                          onChange={(e) => setKota(e.target.value)}
                          required
                          disabled={isPending}
                        />
                      </div>

                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error.message}</AlertDescription>
                        </Alert>
                      )}

                      <Button type="submit" className="w-full" disabled={isPending || !name.trim() || !kota.trim()}>
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
