import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useCurrentUser } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, LogOut, ChevronDown, ChevronUp, RefreshCw, Users, Briefcase, Building2 } from 'lucide-react';
import { Role, Status, User } from '../backend';
import { useState } from 'react';
import { useActor } from '../hooks/useActor';
import { useQuery } from '@tanstack/react-query';
import UserManagementTable from './UserManagementTable';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

export default function UserManagementPage() {
  const { clear } = useInternetIdentity();
  const { data: currentUser, isLoading } = useCurrentUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { actor, isFetching: actorFetching } = useActor();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    internal: true,
    asistenmu: false,
    clientPartner: false,
  });

  // Fetch all users with proper error handling
  const { 
    data: allUsers = [], 
    isLoading: usersLoading, 
    isFetching: usersFetching, 
    refetch,
    error: usersError 
  } = useQuery<User[]>({
    queryKey: ['allUsers'],
    queryFn: async () => {
      try {
        if (!actor) throw new Error('Actor not available');
        const approvals = await actor.listApprovals();
        const userPromises = approvals.map(approval => actor.getUserProfile(approval.principal));
        const users = await Promise.all(userPromises);
        return users.filter((u): u is User => u !== null);
      } catch (error: any) {
        console.error('Error fetching users:', error);
        toast.error(`Failed to fetch users: ${error.message || 'Unknown error'}`);
        throw error;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: 2,
    retryDelay: 1000,
  });

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    window.location.href = '/';
  };

  const handleRefresh = async (section: string) => {
    try {
      await refetch();
      toast.success('Data refreshed successfully');
    } catch (error: any) {
      toast.error(`Failed to refresh: ${error.message || 'Unknown error'}`);
    }
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (isLoading || usersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error state if data fetch failed
  if (usersError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Error Loading Data</h2>
          <p className="text-muted-foreground mb-4">Failed to load user data. Please try again.</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Authorization check
  if (!currentUser || (currentUser.role !== Role.superadmin && currentUser.role !== Role.admin)) {
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

  // Filter users by role groups
  const internalUsers = allUsers.filter(u => 
    [Role.admin, Role.superadmin, Role.finance, Role.concierge].includes(u.role)
  );

  const asistenmuUsers = allUsers.filter(u => u.role === Role.asistenmu);

  const clientPartnerUsers = allUsers.filter(u => 
    [Role.client, Role.partner, Role.strategicPartner].includes(u.role)
  );

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
                  {currentUser.role === Role.superadmin ? 'Superadmin' : 'Admin'}
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
          <div>
            <h1 className="text-3xl font-bold text-[#0F172A]">Kelola Pengguna</h1>
            <p className="text-[#475569] mt-2">Manajemen user berdasarkan role dan status</p>
          </div>

          {/* Tim Internal Section */}
          <TooltipProvider>
            <Collapsible
              open={openSections.internal}
              onOpenChange={() => toggleSection('internal')}
              className="bg-white rounded-lg shadow-gold border border-border transition-all duration-300"
            >
              <CollapsibleTrigger className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-xl font-semibold text-foreground">🟢 Tim Internal</h2>
                    <p className="text-sm text-muted-foreground">Admin, Superadmin, Finance, Concierge</p>
                  </div>
                  <span className="ml-4 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    {internalUsers.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRefresh('internal');
                        }}
                        className="text-[#E5D5C0] hover:text-[#D4AF37] hover:scale-110 transition-all"
                      >
                        <RefreshCw className={`h-5 w-5 ${usersFetching ? 'animate-spin' : ''}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh daftar Tim Internal</TooltipContent>
                  </Tooltip>
                  {openSections.internal ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-6 pb-6">
                <UserManagementTable users={internalUsers} />
              </CollapsibleContent>
            </Collapsible>

            {/* Tim Asistenmu Section */}
            <Collapsible
              open={openSections.asistenmu}
              onOpenChange={() => toggleSection('asistenmu')}
              className="bg-white rounded-lg shadow-gold border border-border transition-all duration-300"
            >
              <CollapsibleTrigger className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-xl font-semibold text-foreground">🔵 Tim Asistenku</h2>
                    <p className="text-sm text-muted-foreground">Asistenmu / Account Manager</p>
                  </div>
                  <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {asistenmuUsers.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRefresh('asistenmu');
                        }}
                        className="text-[#E5D5C0] hover:text-[#D4AF37] hover:scale-110 transition-all"
                      >
                        <RefreshCw className={`h-5 w-5 ${usersFetching ? 'animate-spin' : ''}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh daftar Tim Asistenku</TooltipContent>
                  </Tooltip>
                  {openSections.asistenmu ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-6 pb-6">
                <UserManagementTable users={asistenmuUsers} />
              </CollapsibleContent>
            </Collapsible>

            {/* Client & Partner Section */}
            <Collapsible
              open={openSections.clientPartner}
              onOpenChange={() => toggleSection('clientPartner')}
              className="bg-white rounded-lg shadow-gold border border-border transition-all duration-300"
            >
              <CollapsibleTrigger className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-xl font-semibold text-foreground">🟠 Daftar Client & Partner</h2>
                    <p className="text-sm text-muted-foreground">Client, Partner, Strategic Partner</p>
                  </div>
                  <span className="ml-4 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                    {clientPartnerUsers.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRefresh('clientPartner');
                        }}
                        className="text-[#E5D5C0] hover:text-[#D4AF37] hover:scale-110 transition-all"
                      >
                        <RefreshCw className={`h-5 w-5 ${usersFetching ? 'animate-spin' : ''}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh daftar Client & Partner</TooltipContent>
                  </Tooltip>
                  {openSections.clientPartner ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-6 pb-6">
                <UserManagementTable users={clientPartnerUsers} />
              </CollapsibleContent>
            </Collapsible>
          </TooltipProvider>
        </div>
      </main>
    </div>
  );
}
