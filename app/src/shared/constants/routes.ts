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

// Debug routes (admin tooling)
export const DEBUG_DASHBOARD_PATH = "/debug/dashboard" as const;
export const DEBUG_MIDDLEWARE_PATH = "/debug/middleware" as const;
export const DEBUG_ENDPOINTS_PATH = "/debug/endpoints" as const;
export const DEBUG_CONFIG_PATH = "/debug/config" as const;
export const DEBUG_MONITORING_PATH = "/debug/monitoring" as const;
