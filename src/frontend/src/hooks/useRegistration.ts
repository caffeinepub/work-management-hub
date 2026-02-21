import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';

interface RegistrationData {
  name: string;
  requestedRole: string;
}

export function useRegistration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RegistrationData) => {
      if (!actor) throw new Error('Actor not available');

      const name = data.name.trim();
      const role = data.requestedRole.toLowerCase();

      // Map frontend role to backend registration function
      if (role === 'client') {
        await actor.selfRegisterClient(name);
      } else if (role === 'partner') {
        await actor.selfRegisterPartner(name);
      } else {
        // Internal roles: admin, finance, concierge, asistenmu, strategicPartner
        let backendRole = '';
        
        switch (role) {
          case 'admin':
            backendRole = 'admin';
            break;
          case 'finance':
            backendRole = 'finance';
            break;
          case 'concierge':
            backendRole = 'concierge';
            break;
          case 'asistenmu':
            backendRole = 'asistenmu';
            break;
          case 'strategic partner':
            backendRole = 'strategicPartner';
            break;
          default:
            throw new Error(`Invalid role: ${data.requestedRole}`);
        }
        
        await actor.selfRegisterInternal(name, backendRole);
      }
    },
    onSuccess: () => {
      // Invalidate all user-related queries
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['isApproved'] });
    },
  });
}
