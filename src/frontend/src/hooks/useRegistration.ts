import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';

interface ClientRegistrationData {
  name: string;
  company: string;
  phoneNumber: string;
  email: string;
}

interface PartnerRegistrationData {
  name: string;
  kota: string;
}

interface InternalRegistrationData {
  name: string;
  inputRole: string;
}

export function useClientRegistration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ClientRegistrationData) => {
      if (!actor) throw new Error('Actor not available');
      await actor.selfRegisterClient(data.name, data.company, data.phoneNumber, data.email);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['isApproved'] });
    },
  });
}

export function usePartnerRegistration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PartnerRegistrationData) => {
      if (!actor) throw new Error('Actor not available');
      await actor.selfRegisterPartner(data.name, data.kota);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['isApproved'] });
    },
  });
}

export function useInternalRegistration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InternalRegistrationData) => {
      if (!actor) throw new Error('Actor not available');
      await actor.selfRegisterInternal(data.name, data.inputRole);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['isApproved'] });
    },
  });
}
