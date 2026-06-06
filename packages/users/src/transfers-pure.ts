// Pure helpers for transfer resolution (Plan 34). No DB imports.

export type ActiveTransfer = {
  toLocationId: string;
  toDepartmentId?: string | null;
  type: string;
  startDate: string;
  endDate: string | null;
};

function filterActive(transfers: ActiveTransfer[], date: string): ActiveTransfer[] {
  return transfers.filter((t) => t.startDate <= date && (t.endDate == null || t.endDate >= date));
}

// Effective home location on `date`. Prefers TEMPORARY over PERMANENT (last wins within type).
export function effectiveLocation(
  transfers: ActiveTransfer[],
  homeLocationId: string,
  date: string
): string {
  const active = filterActive(transfers, date);
  if (active.length === 0) return homeLocationId;
  const temp = active.filter((t) => t.type === 'TEMPORARY');
  const chosen = temp.length > 0 ? temp[temp.length - 1] : active[active.length - 1];
  return chosen.toLocationId;
}

// Effective department on `date`. Falls back to homeDepartmentId when transfer has no dept override.
export function effectiveDepartment(
  transfers: ActiveTransfer[],
  homeDepartmentId: string | null,
  date: string
): string | null {
  const active = filterActive(transfers, date);
  if (active.length === 0) return homeDepartmentId;
  const temp = active.filter((t) => t.type === 'TEMPORARY');
  const chosen = temp.length > 0 ? temp[temp.length - 1] : active[active.length - 1];
  return chosen.toDepartmentId ?? homeDepartmentId;
}
