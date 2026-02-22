import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { UserProfile, UserRole, User, TaskClientView, CreateTaskResult, InputEstimasiAMResult, ApproveEstimasiClientResult, AssignPartnerResult, ResponPartnerResult, UpdateTaskStatusResult, CompleteTaskResult, TaskStatus, LayananClientView } from '../backend';
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
    },
  });
}

export function useGetClientTasks(clientId: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<TaskClientView[]>({
    queryKey: ['clientTasks', clientId?.toString()],
    queryFn: async () => {
      if (!actor || !clientId) return [];
      return actor.getClientTasks(clientId);
    },
    enabled: !!actor && !actorFetching && !!clientId,
  });
}

export function useCreateTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientId,
      layananId,
      judul,
      detailPermintaan,
    }: {
      clientId: Principal;
      layananId: string;
      judul: string;
      detailPermintaan: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTask(clientId, layananId, judul, detailPermintaan);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientTasks', variables.clientId.toString()] });
    },
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
      queryClient.invalidateQueries({ queryKey: ['partnerWallet'] });
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
      queryClient.invalidateQueries({ queryKey: ['partnerWallet'] });
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
      queryClient.invalidateQueries({ queryKey: ['partnerWallet'] });
    },
  });
}

export function useGetMyLayananAktif(clientId: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<LayananClientView[]>({
    queryKey: ['myLayananAktif', clientId?.toString()],
    queryFn: async () => {
      if (!actor || !clientId) return [];
      return actor.getMyLayananAktif(clientId);
    },
    enabled: !!actor && !actorFetching && !!clientId,
  });
}
