import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { UserProfile, UserRole, User, TaskClientView, CreateTaskResult, InputEstimasiAMResult, ApproveEstimasiClientResult, AssignPartnerResult, ResponPartnerResult, UpdateTaskStatusResult, CompleteTaskResult, TaskStatus } from '../backend';
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

// Task Management Queries

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

export function useCreateTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<CreateTaskResult, Error, { clientId: Principal; layananId: string; judul: string; detailPermintaan: string }>({
    mutationFn: async ({ clientId, layananId, judul, detailPermintaan }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTask(clientId, layananId, judul, detailPermintaan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientTasks'] });
    },
  });
}

export function useInputEstimasiAM() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<InputEstimasiAMResult, Error, { taskId: string; estimasiJam: bigint }>({
    mutationFn: async ({ taskId, estimasiJam }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.inputEstimasiAM(taskId, estimasiJam);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientTasks'] });
    },
  });
}

export function useApproveEstimasiClient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<ApproveEstimasiClientResult, Error, { taskId: string }>({
    mutationFn: async ({ taskId }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveEstimasiClient(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientTasks'] });
    },
  });
}

export function useAssignPartner() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<AssignPartnerResult, Error, { taskId: string; partnerId: Principal; scopeKerja: string; deadline: bigint; linkDriveInternal: string; jamEfektif: bigint; levelPartner: string }>({
    mutationFn: async ({ taskId, partnerId, scopeKerja, deadline, linkDriveInternal, jamEfektif, levelPartner }) => {
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

  return useMutation<ResponPartnerResult, Error, { taskId: string; acceptance: boolean }>({
    mutationFn: async ({ taskId, acceptance }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.responPartner(taskId, acceptance);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientTasks'] });
    },
  });
}

// Part 3: New hooks for task status updates and completion

export function useUpdateTaskStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<UpdateTaskStatusResult, Error, { taskId: string; newStatus: TaskStatus }>({
    mutationFn: async ({ taskId, newStatus }) => {
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

  return useMutation<CompleteTaskResult, Error, { taskId: string }>({
    mutationFn: async ({ taskId }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.completeTask(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientTasks'] });
    },
  });
}
