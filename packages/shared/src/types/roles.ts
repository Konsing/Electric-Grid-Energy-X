export const Role = {
  ADMIN: 'ADMIN',
  TECHNICIAN: 'TECHNICIAN',
  CUSTOMER: 'CUSTOMER',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN: 3,
  TECHNICIAN: 2,
  CUSTOMER: 1,
};
