import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import type { auth } from '@/auth.config';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  plugins: [inferAdditionalFields<typeof auth>()],
});

export const { signUp, signIn, signOut, useSession } = authClient;
