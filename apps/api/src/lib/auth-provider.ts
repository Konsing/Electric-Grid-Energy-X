import jwt from 'jsonwebtoken';
import { config } from './config';

export interface AuthTokenPayload {
  firebaseUid: string;
  email: string;
}

export interface AuthProvider {
  verifyToken(token: string): Promise<AuthTokenPayload>;
}

/**
 * Local JWT auth provider for development and testing.
 * Signs and verifies tokens using JWT_SECRET — no Firebase needed.
 */
class LocalJwtAuthProvider implements AuthProvider {
  async verifyToken(token: string): Promise<AuthTokenPayload> {
    const payload = jwt.verify(token, config.JWT_SECRET) as jwt.JwtPayload;
    return {
      firebaseUid: payload.sub as string,
      email: payload.email as string,
    };
  }
}

/**
 * Firebase auth provider for production.
 * Placeholder — would use firebase-admin SDK to verify ID tokens.
 */
class FirebaseAuthProvider implements AuthProvider {
  async verifyToken(token: string): Promise<AuthTokenPayload> {
    // In production, this would use:
    // const decoded = await admin.auth().verifyIdToken(token);
    // return { firebaseUid: decoded.uid, email: decoded.email! };
    throw new Error(
      'Firebase auth not configured. Set MOCK_AUTH=true for development.',
    );
  }
}

export function createAuthProvider(): AuthProvider {
  if (config.MOCK_AUTH) {
    return new LocalJwtAuthProvider();
  }
  return new FirebaseAuthProvider();
}

export const authProvider = createAuthProvider();

/**
 * Sign a local JWT token (used by dev-login and register in mock mode).
 */
export function signToken(payload: {
  sub: string;
  email: string;
  role: string;
}): string {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '1h' });
}
