import { describe, expect, it, vi } from 'vitest';
import { createProfileService } from '@/shared/services/supabase/profile.service';
import type { SupabaseClient } from '@/shared/services/supabase/clients';

function createQueryMock() {
  const single = vi.fn();
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq, single });
  return { select, eq, single };
}

describe('profileService', () => {
  it('getProfile sélectionne le profil par id', async () => {
    const query = createQueryMock();
    query.single.mockResolvedValue({ data: { id: '1' }, error: null });

    const client = {
      from: vi.fn().mockReturnValue(query),
    } as unknown as SupabaseClient;

    const service = createProfileService(client);
    const result = await service.getProfile('1');

    expect(client.from).toHaveBeenCalledWith('user_profiles');
    expect(query.select).toHaveBeenCalledWith('*');
    expect(query.eq).toHaveBeenCalledWith('id', '1');
    expect(query.single).toHaveBeenCalled();
    expect(result?.data?.id).toBe('1');
    expect(result?.error).toBeNull();
  });

  it('createProfile insère le profil puis retourne le résultat', async () => {
    const insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: '1' }, error: null }) }) });

    const client = {
      from: vi.fn().mockReturnValue({ insert }),
    } as unknown as SupabaseClient;

    const service = createProfileService(client);
    const payload = { id: '1', full_name: 'Test' } as any;
    const result = await service.createProfile(payload);

    expect(client.from).toHaveBeenCalledWith('user_profiles');
    expect(insert).toHaveBeenCalledWith(payload);
    expect(result?.data?.id).toBe('1');
  });

  it('updateProfile applique les modifications sur la ligne ciblée', async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: '1', full_name: 'Updated' }, error: null });
    const eq = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) });
    const update = vi.fn().mockReturnValue({ eq });

    const client = {
      from: vi.fn().mockReturnValue({ update }),
    } as unknown as SupabaseClient;

    const service = createProfileService(client);
    const updates = { full_name: 'Updated' } as any;
    const result = await service.updateProfile('1', updates);

    expect(client.from).toHaveBeenCalledWith('user_profiles');
    expect(update).toHaveBeenCalledWith(updates);
    expect(eq).toHaveBeenCalledWith('id', '1');
    expect(single).toHaveBeenCalled();
    expect(result?.data?.full_name).toBe('Updated');
  });
});
