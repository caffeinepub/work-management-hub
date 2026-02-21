import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';

export function useHasSuperadmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['hasSuperadmin'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        // Try to get pending requests - if this succeeds, a superadmin exists
        await actor.getPendingRequests();
        return true;
      } catch (error: any) {
        // If error contains "Superadmin already exists" or we can't access admin functions,
        // check if it's because no superadmin exists yet
        if (error.message && error.message.includes('Unauthorized')) {
          // No superadmin exists yet (no one has admin access)
          return false;
        }
        // Superadmin exists but we're not authorized
        return true;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useClaimSuperadmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      await actor.claimSuperadmin();
    },
    onSuccess: () => {
      // Invalidate all user-related queries to refresh state
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserRole'] });
      queryClient.invalidateQueries({ queryKey: ['hasSuperadmin'] });
      queryClient.invalidateQueries({ queryKey: ['isApproved'] });
    },
  });
}
