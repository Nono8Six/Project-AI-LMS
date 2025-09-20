export const ROOT_PATH = "/" as const;
export const ADMIN_PREFIX = "/admin" as const;

export const MEMBER_ROUTES = [
  "/dashboard",
  "/learn",
  "/profile",
] as const;

export const AUTH_LOGIN_PATH = "/login" as const;
export const AUTH_SIGNUP_PATH = "/signup" as const;
export const UNAUTHORIZED_PATH = "/unauthorized" as const;

export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith(ADMIN_PREFIX);
}

export function isMemberRoute(pathname: string): boolean {
  return MEMBER_ROUTES.some((route) => pathname.startsWith(route));
}
