import Badge from './Badge';
import { useColors } from '@/lib/theme/colors';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const colors = useColors();

  const map: Record<string, [string, string]> = {
    confirmed: [colors.green, 'Confirmed'],
    pending: [colors.yellow, 'Pending'],
    completed: [colors.ink, 'Completed'],
    cancelled: [colors.red, 'Cancelled'],
    no_show: [colors.red, 'No-Show'],
    active: [colors.green, 'Active'],
    paused: [colors.orange, 'Paused'],
    scheduled: [colors.blue, 'Scheduled'],
    charged: [colors.green, 'Paid'],
    failed_payment: [colors.red, 'Failed'],
    pending_client_approval: [colors.yellow, 'Awaiting'],
    pending_barber_approval: [colors.yellow, 'Pending'],
  };

  const [accent, label] = map[status] ?? [colors.quaternary, status];

  return <Badge bg={accent + '18'} color={accent} label={label} />;
}
