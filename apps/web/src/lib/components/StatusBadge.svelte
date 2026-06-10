<script lang="ts">
  // StatusBadge — renders PENDING/APPROVED/REJECTED/CANCELLED with the mock's
  // green/amber/red palette. Matches .badge classes from avkash-demo.html.
  interface Props {
    status: string;
    size?: 'sm' | 'md';
  }

  let { status, size = 'md' }: Props = $props();

  type ColorKey = 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'muted';

  const colorMap: Record<string, ColorKey> = {
    APPROVED: 'green',
    PENDING: 'amber',
    REJECTED: 'red',
    CANCELLED: 'muted',
    DELETED: 'red',
    ACTIVE: 'green',
    INACTIVE: 'muted',
  };

  const labelMap: Record<string, string> = {
    APPROVED: 'Approved',
    PENDING: 'Pending',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
    DELETED: 'Deleted',
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
  };

  let color = $derived(colorMap[status] ?? 'muted');
  let label = $derived(labelMap[status] ?? status);
</script>

<span class="badge {color}" class:sm={size === 'sm'}>{label}</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
  }
  .badge.sm {
    font-size: 10px;
    padding: 1px 6px;
  }
  .green  { background: rgba(63,185,80,0.15);  color: var(--green); }
  .amber  { background: rgba(210,153,34,0.15); color: var(--amber); }
  .red    { background: rgba(248,81,73,0.15);  color: var(--red); }
  .blue   { background: rgba(88,166,255,0.15); color: var(--blue); }
  .purple { background: rgba(188,140,255,0.15);color: var(--purple); }
  .muted  { background: rgba(139,148,158,0.15);color: var(--muted); }
</style>
