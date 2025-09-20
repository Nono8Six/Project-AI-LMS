import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { permissionCache, PermissionService, PERMISSIONS } from "../app/src/shared/services/permission.service";

describe("PermissionService", () => {
  beforeEach(() => {
    PermissionService.clearCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const user = { id: "user-1", email: "user@example.com" };
  const profile = {
    id: "user-1",
    full_name: "User",
    email: "user@example.com",
    role: "member",
    status: "active",
    onboarding_completed: true,
    onboarding_completed_at: null,
    referral_code: null,
    referrer_id: null,
    consents: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it("cache les permissions puis expire après TTL", async () => {
    const context = { action: PERMISSIONS.PROFILE_VIEW } as const;

    const first = await PermissionService.hasPermission(user, profile, context);
    expect(first).toBe(true);

    const getSpy = vi.spyOn(permissionCache, "get");
    await PermissionService.hasPermission(user, profile, context);
    expect(getSpy).toHaveBeenCalled();

    vi.advanceTimersByTime(5 * 60 * 1000 + 1);

    const secondSpy = vi.spyOn(permissionCache, "get");
    await PermissionService.hasPermission(user, profile, context);
    expect(secondSpy).toHaveReturnedWith(null);
  });

  it("clearCache invalide toutes les entrées", async () => {
    const context = { action: PERMISSIONS.PROFILE_VIEW } as const;

    await PermissionService.hasPermission(user, profile, context);

    PermissionService.clearCache();

    const spy = vi.spyOn(permissionCache, "get");
    await PermissionService.hasPermission(user, profile, context);
    expect(spy).toHaveReturnedWith(null);
  });
});
