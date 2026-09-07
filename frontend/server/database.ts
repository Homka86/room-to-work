import { env } from 'cloudflare:workers';

// All application queries use the primary for immediately consistent reads.
export function database(): D1Database {
  const binding = (env as unknown as { DB?: D1Database }).DB;
  if (!binding) throw new Error('Database binding DB is not configured');
  return binding;
}
