/**
 * Single source of truth pour la logique de dérivation du prefix API orpc
 * Utilisé par next.config.ts et shared/constants/api.ts
 */

export type ApiPrefix = `/${string}`;

export function deriveApiPrefix(): ApiPrefix {
  const explicit = process.env.ORPC_PREFIX?.trim();
  if (explicit) {
    const prefix = explicit.startsWith("/") ? explicit : `/${explicit}`;
    return prefix as ApiPrefix;
  }

  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (base) {
    try {
      const u = new URL(base);
      // ensure we append "/rpc" to the API base path
      const path = u.pathname.endsWith("/") ? u.pathname.slice(0, -1) : u.pathname;
      return `${path}/rpc` as ApiPrefix;
    } catch {
      // if invalid URL, fall back safely
    }
  }
  return "/api/rpc";
}