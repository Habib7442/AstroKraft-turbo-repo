export type UserRole = "customer" | "admin";

export interface AuthSession {
  userId: string;
  role: UserRole;
  email?: string;
}

export function isAdmin(session: AuthSession | null): boolean {
  return session?.role === "admin";
}

/**
 * Reads the `role` custom claim off a Clerk session token. Requires the Clerk
 * Dashboard session token to be customized to expose `metadata: "{{user.public_metadata}}"`.
 */
export function getRoleFromSessionClaims(sessionClaims: unknown): UserRole | undefined {
  const metadata = (sessionClaims as { metadata?: { role?: UserRole } } | null | undefined)?.metadata;
  return metadata?.role;
}
