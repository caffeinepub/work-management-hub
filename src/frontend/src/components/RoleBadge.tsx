import { Badge } from '@/components/ui/badge';
import { Role } from '../backend';

interface RoleBadgeProps {
  role: Role;
}

export default function RoleBadge({ role }: RoleBadgeProps) {
  const getRoleConfig = (role: Role) => {
    switch (role) {
      case Role.superadmin:
        return {
          label: 'Superadmin',
          className: 'bg-slate-900 text-white border-slate-900',
        };
      case Role.admin:
        return {
          label: 'Admin',
          className: 'bg-slate-700 text-white border-slate-700',
        };
      case Role.finance:
        return {
          label: 'Finance',
          className: 'bg-slate-600 text-white border-slate-600',
        };
      case Role.concierge:
        return {
          label: 'Concierge',
          className: 'bg-slate-500 text-white border-slate-500',
        };
      case Role.asistenmu:
        return {
          label: 'Asistenmu',
          className: 'bg-blue-600 text-white border-blue-600',
        };
      case Role.client:
        return {
          label: 'Client',
          className: 'bg-accent/20 text-accent-foreground border-accent',
        };
      case Role.partner:
        return {
          label: 'Partner',
          className: 'bg-accent/30 text-accent-foreground border-accent',
        };
      case Role.strategicPartner:
        return {
          label: 'Strategic Partner',
          className: 'bg-accent/40 text-accent-foreground border-accent',
        };
      default:
        return {
          label: 'Unknown',
          className: 'bg-gray-100 text-gray-800 border-gray-300',
        };
    }
  };

  const config = getRoleConfig(role);

  return (
    <Badge variant="outline" className={`${config.className} font-medium`}>
      {config.label}
    </Badge>
  );
}
