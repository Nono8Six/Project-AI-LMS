import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { OpenAPIGenerator } from '@orpc/openapi';
import { oc } from '@orpc/contract';
import { appRouter } from '@/orpc/server/router';
import { API_CONSTANTS } from '@/shared/constants/api';

async function main() {
  const generator = new OpenAPIGenerator({
    // For Zod, the generator supports auto-detection via @orpc/zod peer
    // If needed explicitly, we could import ZodToJsonSchemaConverter from '@orpc/zod/zod4'
  });

  const spec = await generator.generate(
    oc
      .tag('system', 'auth')
      .prefix(API_CONSTANTS.prefix)
      .router(appRouter),
    {
      info: {
        title: 'LMS-IA API',
        version: process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0',
      },
      servers: [
        {
          url: (() => {
            const base = process.env.NEXT_PUBLIC_APP_URL;
            return base ? new URL(API_CONSTANTS.prefix, base).toString() : API_CONSTANTS.prefix;
          })(),
        },
      ],
    },
  );

  const outPath = join(process.cwd(), 'docs', 'api', 'v1', 'openapi.json');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(spec, null, 2), 'utf8');
  console.warn(`OpenAPI spec written to ${outPath}`);
}

// Run only when executed directly (not when bundled by Next)
if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
