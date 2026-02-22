import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { UserProfile, UserRole, User, TaskClientView, CreateTaskResult, InputEstimasiAMResult, ApproveEstimasiClientResult, AssignPartnerResult, ResponPartnerResult, UpdateTaskStatusResult, CompleteTaskResult, TaskStatus, LayananClientView, Layanan } from '../backend';
import { Principal } from '@icp-sdk/core/principal';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ['currentUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useIsCallerApproved() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isApproved'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.isCallerApproved();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useCurrentUser() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<User | null>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCurrentUser();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

// New hook to get current user for ClientDashboard
export function useGetCurrentUser() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<User | null>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCurrentUser();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function usePendingRequests() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<User[]>({
    queryKey: ['pendingRequests'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPendingRequests();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useApproveUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principalId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveUser(principalId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}

export function useRejectUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principalId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.rejectUser(principalId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}

export function useUpdateProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, phoneNumber, email }: { name: string; phoneNumber: string; email: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateProfile(name, phoneNumber, email);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useGetMyLayananAktif(clientId: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<LayananClientView[]>({
    queryKey: ['myLayananAktif', clientId?.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getMyLayananAktif();
    },
    enabled: !!actor && !actorFetching && !!clientId,
  });
}

export function useGetClientMainService() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Layanan | null>({
    queryKey: ['clientMainService'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getClientMainService();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useCreateTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, layananId, judul, detailPermintaan }: { clientId: Principal; layananId: string; judul: string; detailPermintaan: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTask(clientId, layananId, judul, detailPermintaan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientTasks'] });
      queryClient.invalidateQueries({ queryKey: ['myLayananAktif'] });
      queryClient.invalidateQueries({ queryKey: ['clientMainService'] });
    },
  });
}

export function useGetClientTasks(clientId: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<TaskClientView[]>({
    queryKey: ['clientTasks', clientId?.toString()],
    queryFn: async () => {
      if (!actor || !clientId) throw new Error('Actor or clientId not available');
      return actor.getClientTasks(clientId);
    },
    enabled: !!actor && !actorFetching && !!clientId,
  });
}

export function useApproveEstimasiClient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId }: { taskId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveEstimasiClient(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientTasks'] });
      queryClient.invalidateQueries({ queryKey: ['myLayananAktif'] });
      queryClient.invalidateQueries({ queryKey: ['clientMainService'] });
    },
  });
}

export function useInputEstimasiAM() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, estimasiJam }: { taskId: string; estimasiJam: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.inputEstimasiAM(taskId, estimasiJam);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientTasks'] });
    },
  });
}

export function useAssignPartner() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, partnerId, scopeKerja, deadline, linkDriveInternal, jamEfektif, levelPartner }: { taskId: string; partnerId: Principal; scopeKerja: string; deadline: bigint; linkDriveInternal: string; jamEfektif: bigint; levelPartner: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignPartner(taskId, partnerId, scopeKerja, deadline, linkDriveInternal, jamEfektif, levelPartner);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientTasks'] });
    },
  });
}

export function useResponPartner() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, acceptance }: { taskId: string; acceptance: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.responPartner(taskId, acceptance);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientTasks'] });
    },
  });
}

export function useUpdateTaskStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: TaskStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTaskStatus(taskId, newStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientTasks'] });
    },
  });
}

export function useCompleteTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId }: { taskId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.completeTask(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientTasks'] });
    },
  });
}

export function useRequestWithdraw() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ partnerId, amount }: { partnerId: Principal; amount: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.requestWithdraw(partnerId, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawRequests'] });
    },
  });
}

export function useApproveWithdraw() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, financeId }: { requestId: string; financeId: Principal }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveWithdraw(requestId, financeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawRequests'] });
    },
  });
}

export function useRejectWithdraw() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, financeId }: { requestId: string; financeId: Principal }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.rejectWithdraw(requestId, financeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawRequests'] });
    },
  });
}

// Hook to get all users (for dropdowns and user management)
export function useGetAllUsers() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<User[]>({
    queryKey: ['allUsers'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const approvals = await actor.listApprovals();
      const userPromises = approvals.map(approval => actor.getUserProfile(approval.principal));
      const users = await Promise.all(userPromises);
      return users.filter((u): u is User => u !== null);
    },
    enabled: !!actor && !actorFetching,
    retry: 2,
  });
}
