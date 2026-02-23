import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useCurrentUser, useGetAllUsers } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, LogOut, RefreshCw, Users, Briefcase, Building2, UserCheck, Search } from 'lucide-react';
import { Role, Status, User } from '../backend';
import { useState, useMemo } from 'react';
import { useActor } from '../hooks/useActor';
import { useQuery } from '@tanstack/react-query';
import UserManagementTable from './UserManagementTable';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

// Helper functions to check Motoko variant types
function isStatusPending(status: Status): boolean {
  return (status as any).pending !== undefined;
}

function isStatusActive(status: Status): boolean {
  return (status as any).active !== undefined;
}

function isRoleSuperadmin(role: Role): boolean {
  return (role as any).superadmin !== undefined;
}

function isRoleAdmin(role: Role): boolean {
  return (role as any).admin !== undefined;
}

function isRoleFinance(role: Role): boolean {
  return (role as any).finance !== undefined;
}

function isRoleConcierge(role: Role): boolean {
  return (role as any).concierge !== undefined;
}

function isRoleAsistenmu(role: Role): boolean {
  return (role as any).asistenmu !== undefined;
}

function isRolePartner(role: Role): boolean {
  return (role as any).partner !== undefined;
}

function isRoleStrategicPartner(role: Role): boolean {
  return (role as any).strategicPartner !== undefined;
}

function isRoleClient(role: Role): boolean {
  return (role as any).client !== undefined;
}

export default function UserManagementPage() {
  const { clear } = useInternetIdentity();
  const { data: currentUser, isLoading } = useCurrentUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { actor, isFetching: actorFetching } = useActor();

  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all users using the new getAllUsers() backend function
  const { 
    data: allUsersData = [], 
    isLoading: usersLoading, 
    isFetching: usersFetching, 
    refetch: refetchAll,
    error: usersError 
  } = useGetAllUsers();

  // Fetch pending users for fallback
  const { 
    data: pendingUsersData = [], 
    isLoading: pendingLoading, 
    isFetching: pendingFetching, 
    refetch: refetchPending,
    error: pendingError 
  } = useQuery<User[]>({
    queryKey: ['pendingRequests'],
    queryFn: async () => {
      try {
        if (!actor) throw new Error('Actor not available');
        return actor.getPendingRequests();
      } catch (error: any) {
        console.error('Error fetching pending users:', error);
        toast.error(`Failed to fetch pending users: ${error.message || 'Unknown error'}`);
        throw error;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: 2,
    retryDelay: 1000,
  });

  // Use allUsersData as the primary source
  const combinedUsers = useMemo(() => {
    return allUsersData;
  }, [allUsersData]);

  // Filter users by search query (case-insensitive, search by name or ID)
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return combinedUsers;
    
    const query = searchQuery.toLowerCase();
    return combinedUsers.filter(user => 
      user.name.toLowerCase().includes(query) || 
      user.idUser.toLowerCase().includes(query)
    );
  }, [combinedUsers, searchQuery]);

  // Filter users into 4 categories using helper functions for Motoko variants
  const pendingUsers = useMemo(() => 
    filteredUsers.filter(u => isStatusPending(u.status)),
    [filteredUsers]
  );

  const internalActiveUsers = useMemo(() => 
    filteredUsers.filter(u => 
      isStatusActive(u.status) && 
      (isRoleSuperadmin(u.role) || isRoleAdmin(u.role) || isRoleFinance(u.role) || isRoleConcierge(u.role) || isRoleAsistenmu(u.role))
    ),
    [filteredUsers]
  );

  const partnerActiveUsers = useMemo(() => 
    filteredUsers.filter(u => 
      isStatusActive(u.status) && 
      (isRolePartner(u.role) || isRoleStrategicPartner(u.role))
    ),
    [filteredUsers]
  );

  const clientActiveUsers = useMemo(() => 
    filteredUsers.filter(u => 
      isStatusActive(u.status) && 
      isRoleClient(u.role)
    ),
    [filteredUsers]
  );

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    window.location.href = '/';
  };

  const handleRefresh = async () => {
    try {
      await Promise.all([refetchPending(), refetchAll()]);
      toast.success('Data refreshed successfully');
    } catch (error: any) {
      toast.error(`Failed to refresh: ${error.message || 'Unknown error'}`);
    }
  };

  if (isLoading || usersLoading || pendingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error state if data fetch failed
  if (usersError || pendingError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Error Loading Data</h2>
          <p className="text-muted-foreground mb-4">Failed to load user data. Please try again.</p>
          <Button onClick={handleRefresh}>Retry</Button>
        </div>
      </div>
    );
  }

  // Authorization check - Allow both Superadmin and Admin
  if (!currentUser || !(isRoleSuperadmin(currentUser.role) || isRoleAdmin(currentUser.role))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">Only Superadmin and Admin can access this page.</p>
          <Button onClick={() => navigate({ to: '/' })}>Go Back</Button>
        </div>
      </div>
    );
  }

  const initials = currentUser?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AD';

  return (
    <div className="min-h-screen bg-[#FAFBFD]">
      {/* Header */}
      <header className="w-full py-4 px-4 sm:px-6 lg:px-8 border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/assets/asistenku-icon.png" alt="Asistenku" className="h-10 w-auto" />
            <Button variant="ghost" onClick={() => navigate({ to: '/internal-dashboard' })}>
              ← Back to Dashboard
            </Button>
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
                <p className="text-xs text-muted-foreground">
                  {isRoleSuperadmin(currentUser.role) ? 'Superadmin' : 'Admin'}
                </p>
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
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#0F172A]">Kelola Pengguna</h1>
              <p className="text-[#475569] mt-2">Manajemen user berdasarkan role dan status</p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                    className="text-[#E5D5C0] hover:text-[#D4AF37] hover:scale-110 transition-all"
                  >
                    <RefreshCw className={`h-5 w-5 ${(usersFetching || pendingFetching) ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh semua data</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari berdasarkan Nama atau ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full max-w-md"
            />
          </div>

          {/* 4 Category Cards */}
          <div className="grid grid-cols-1 gap-6">
            {/* Card 1: User Pending */}
            <Card className="shadow-gold border border-border">
              <CardHeader className="bg-yellow-50 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-foreground">
                        🟡 User Pending
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Menunggu persetujuan (semua role)</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                    {pendingUsers.length}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {pendingUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Tidak ada user pending</p>
                ) : (
                  <UserManagementTable users={pendingUsers} />
                )}
              </CardContent>
            </Card>

            {/* Card 2: Tim Internal Aktif */}
            <Card className="shadow-gold border border-border">
              <CardHeader className="bg-green-50 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-foreground">
                        🟢 Tim Internal Aktif
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Superadmin, Admin, Finance, Concierge, Asistenmu</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    {internalActiveUsers.length}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {internalActiveUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Tidak ada tim internal aktif</p>
                ) : (
                  <UserManagementTable users={internalActiveUsers} />
                )}
              </CardContent>
            </Card>

            {/* Card 3: Partner Aktif */}
            <Card className="shadow-gold border border-border">
              <CardHeader className="bg-blue-50 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-foreground">
                        🔵 Partner Aktif
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Partner, Strategic Partner</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {partnerActiveUsers.length}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {partnerActiveUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Tidak ada partner aktif</p>
                ) : (
                  <UserManagementTable users={partnerActiveUsers} />
                )}
              </CardContent>
            </Card>

            {/* Card 4: Client Aktif */}
            <Card className="shadow-gold border border-border">
              <CardHeader className="bg-orange-50 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-foreground">
                        🟠 Client Aktif
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Client</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                    {clientActiveUsers.length}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {clientActiveUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Tidak ada client aktif</p>
                ) : (
                  <UserManagementTable users={clientActiveUsers} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
