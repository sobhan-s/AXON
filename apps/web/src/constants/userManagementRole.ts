export const ROLES = [
  { id: 2, name: 'MANAGER' },
  { id: 3, name: 'LEAD' },
  { id: 4, name: 'REVIEWER' },
  { id: 5, name: 'MEMBER' },
];

export const ROLE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  ADMIN: 'default',
  MANAGER: 'secondary',
  LEAD: 'outline',
  REVIEWER: 'outline',
  MEMBER: 'outline',
};