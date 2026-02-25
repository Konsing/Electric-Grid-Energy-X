import jwt from 'jsonwebtoken';

const JWT_SECRET = 'test-secret-key-at-least-32-characters-long!!';

/**
 * Generate a test JWT token for a given user.
 * Uses the same format as the LocalJwtAuthProvider.
 */
export function getTokenForUser(user: {
  firebaseUid: string;
  email: string;
  role: string;
}): string {
  return jwt.sign(
    {
      sub: user.firebaseUid,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '1h' },
  );
}

/**
 * Convenience: get a token for a seeded test user by role.
 */
export function getTokenForRole(role: 'ADMIN' | 'TECHNICIAN' | 'CUSTOMER'): string {
  const users = {
    ADMIN: { firebaseUid: 'mock-uid-admin', email: 'admin@egx.dev', role: 'ADMIN' },
    TECHNICIAN: { firebaseUid: 'mock-uid-tech', email: 'tech@egx.dev', role: 'TECHNICIAN' },
    CUSTOMER: { firebaseUid: 'mock-uid-customer', email: 'customer@egx.dev', role: 'CUSTOMER' },
  };
  return getTokenForUser(users[role]);
}

/**
 * Get a token for the second customer (cross-account tests).
 */
export function getCustomer2Token(): string {
  return getTokenForUser({
    firebaseUid: 'mock-uid-customer2',
    email: 'customer2@egx.dev',
    role: 'CUSTOMER',
  });
}
