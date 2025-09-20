import { describe, expect, it } from 'vitest';
import { SessionService } from '@/shared/services/session.service';

// Token simulant la structure des access tokens Supabase avec caracteres Base64URL (`-`, `_`).
const SUPABASE_SAMPLE_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiI1Yjc5N2RhYi0wZWY5LTQ3ZTEtOGRiNC02YjUyZDFiN2YxMWIiLCJpYXQiOjE3MTY5OTQ5OTEsImV4cCI6MTcxNjk5ODU5MSwibm9uY2UiOiI_ICIsImhpbnQiOiI-ICJ9.' +
  'ImR1bW15LXNpZ25hdHVyZSI';

describe('SessionService', () => {
  it('genere un sessionId valide pour resolveUser avec un token Supabase Base64URL', () => {
    const sessionId = SessionService.getSessionIdFromToken(SUPABASE_SAMPLE_TOKEN);
    expect(sessionId).toBe('5b797dab-0ef9-47e1-8db4-6b52d1b7f11b_1716994991');
  });
});
