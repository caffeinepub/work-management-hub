import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { User, Role } from '../backend';
import { useState } from 'react';
import { useActor } from '../hooks/useActor';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EditRoleModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditRoleModal({ user, isOpen, onClose }: EditRoleModalProps) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<Role>(user.role);
  const [isSaving, setIsSaving] = useState(false);

  const roleOptions = [
    { value: Role.client, label: 'Client' },
    { value: Role.partner, label: 'Partner' },
    { value: Role.strategicPartner, label: 'Strategic Partner' },
    { value: Role.asistenmu, label: 'Asistenmu' },
    { value: Role.finance, label: 'Finance' },
    { value: Role.concierge, label: 'Concierge' },
    { value: Role.admin, label: 'Admin' },
    { value: Role.superadmin, label: 'Superadmin' },
  ];

  const handleSave = async () => {
    if (selectedRole === user.role) {
      toast.info('No changes made to role.');
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      if (!actor) throw new Error('Actor not available');
      await actor.updateUserRole(user.principalId, selectedRole);
      toast.success(`Role updated successfully for ${user.name}!`);
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      onClose();
    } catch (error: any) {
      toast.error(`Failed to update role: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User Role</DialogTitle>
          <DialogDescription>
            Update the role for {user.name}. Changes will take effect immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="role">Select New Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as Role)}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Current role: <span className="font-medium">{roleOptions.find(r => r.value === user.role)?.label}</span></p>
            <p className="mt-1">Principal ID: <code className="text-xs bg-muted px-1 py-0.5 rounded">{user.principalId.toString().slice(0, 20)}...</code></p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
