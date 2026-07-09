'use client';

import { useMemo } from 'react';
import { useSession } from '@/lib/auth-client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  /** Alias of `name` — several pages read `user.fullName`. */
  fullName: string;
  role: 'student' | 'teacher';
  image?: string | null;
}

/**
 * Thin wrapper over better-auth's `useSession` that shapes the session user
 * into the `{ user, loading }` form the pages expect.
 */
export function useAuth(): { user: AuthUser | null; loading: boolean } {
  const { data, isPending } = useSession();

  const sessionUser = data?.user as
    | (Record<string, unknown> & {
        id: string;
        email: string;
        name: string;
        image?: string | null;
        role?: string;
      })
    | undefined;

  // Memo hoá theo các trường nguyên thuỷ để object `user` GIỮ NGUYÊN tham chiếu
  // giữa các lần render — tránh useEffect([user]) chạy lặp vô hạn.
  const id = sessionUser?.id;
  const email = sessionUser?.email;
  const name = sessionUser?.name;
  const role = sessionUser?.role;
  const image = sessionUser?.image ?? null;

  const user = useMemo<AuthUser | null>(() => {
    if (!id) return null;
    return {
      id,
      email: email as string,
      name: name as string,
      fullName: name as string,
      role: (role as 'student' | 'teacher') ?? 'student',
      image: (image as string | null) ?? null,
    };
  }, [id, email, name, role, image]);

  return { user, loading: isPending };
}
