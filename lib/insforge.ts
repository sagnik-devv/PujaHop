import { createClient } from '@insforge/sdk';

const baseUrl =
  process.env.NEXT_PUBLIC_INSFORGE_URL || 'https://j4g5vd5y.ap-southeast.insforge.app';
const anonKey =
  process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY ||
  'anon_3809e5f1f00212bc80009626d40bf7155c19ee38a3299dcd68180410e3404f78';

export const insforge = createClient({
  baseUrl,
  anonKey,
});
