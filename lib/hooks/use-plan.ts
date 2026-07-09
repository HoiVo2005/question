'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from '@/lib/auth-client';
import type { BillingCycle, PlanId } from '@/lib/plans';

// Đọc gói hiện tại của người dùng từ server (/api/subscription).
// Trạng thái gói được lưu trong Supabase và đã xét hết hạn ở phía server.

interface PlanState {
  plan: PlanId;
  cycle: BillingCycle;
  expiresAt: string | null;
  status: 'active' | 'expired';
  isAdmin: boolean;
}

const DEFAULT: PlanState = {
  plan: 'free',
  cycle: 'monthly',
  expiresAt: null,
  status: 'active',
  isAdmin: false,
};

export function usePlan() {
  const { data: session, isPending } = useSession();
  const [state, setState] = useState<PlanState>(DEFAULT);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/subscription');
      if (res.ok) {
        const data = await res.json();
        setState({
          plan: data.plan ?? 'free',
          cycle: data.cycle ?? 'monthly',
          expiresAt: data.expiresAt ?? null,
          status: data.status ?? 'active',
          isAdmin: Boolean(data.isAdmin),
        });
      }
    } catch {
      // giữ trạng thái mặc định khi lỗi mạng
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      setState(DEFAULT);
      setLoaded(true);
      return;
    }
    refresh();
  }, [session, isPending, refresh]);

  return { ...state, loaded, refresh };
}
