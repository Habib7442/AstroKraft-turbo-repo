import { jwtVerify, createRemoteJWKSet } from "npm:jose@5";

// This project's admin app is built with two different Clerk publishable
// keys depending on which EAS environment produced the build:
//   - "development" EAS env -> pk_test_... (Clerk's Development instance)
//   - "preview"/"production" EAS envs -> pk_live_... (Clerk's Production
//     instance, custom domain clerk.astrokraft.online)
// Each Clerk instance has its own signing keys, so a token from one is
// simply invalid against the other's JWKS. Every edge function here must
// therefore be able to verify a token from EITHER instance — a single
// CLERK_JWKS_URL secret can only ever point at one of them, which is
// exactly what caused "Invalid or expired token" for a production build
// while a CLERK_JWKS_URL still set to the dev instance worked fine for
// local/dev-client testing.
//
// JWKS endpoints are public by design (that's the point of a public key
// set) — hardcoding both is not a secret leak, and removes the fragility
// of relying on one manually-maintained env var covering both instances.
const CLERK_DEV_JWKS_URL = "https://prepared-macaque-3351.clerk.accounts.dev/.well-known/jwks.json";
const CLERK_PROD_JWKS_URL = "https://clerk.astrokraft.online/.well-known/jwks.json";

const prodJwks = createRemoteJWKSet(new URL(CLERK_PROD_JWKS_URL));
const devJwks = createRemoteJWKSet(new URL(CLERK_DEV_JWKS_URL));

export interface ClerkVerifyResult {
  role?: string;
}

// Tries the Production instance first (the common case for real admin
// usage), falling back to Development only if that fails — so a genuinely
// invalid/expired token still fails fast with one clear error instead of
// two merged ones.
export async function verifyClerkToken(token: string): Promise<ClerkVerifyResult> {
  try {
    const { payload } = await jwtVerify(token, prodJwks);
    return { role: (payload.metadata as { role?: string } | undefined)?.role };
  } catch {
    const { payload } = await jwtVerify(token, devJwks);
    return { role: (payload.metadata as { role?: string } | undefined)?.role };
  }
}
