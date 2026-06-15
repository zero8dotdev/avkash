export type Role = 'OWNER' | 'MANAGER' | 'USER' | 'ADMIN' | 'ANON';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DELETED';
export type Visibility = 'ORG' | 'TEAM' | 'SELF';

const RANK: Record<Role, number> = {
  ANON: 0,
  USER: 1,
  MANAGER: 2,
  ADMIN: 3,
  OWNER: 4,
};

export const hasRank = (role: Role, min: Role): boolean => RANK[role] >= RANK[min];
