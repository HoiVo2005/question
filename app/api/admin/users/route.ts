import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/client';
import { isAdminUser } from '@/lib/billing';

// Danh sách người dùng (tìm kiếm theo tên/email, lọc theo role).
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !isAdminUser(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sp = request.nextUrl.searchParams;
    const search = sp.get('search')?.trim();
    const role = sp.get('role'); // teacher|student|admin|all

    let query = supabaseAdmin
      .from('users')
      .select('id, name, full_name, email, role, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (role && role !== 'all') query = query.eq('role', role);
    if (search) query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) {
      console.error('List users error:', error);
      return NextResponse.json({ error: 'Không tải được danh sách' }, { status: 500 });
    }

    // Gắn gói hiện tại cho từng người dùng.
    const ids = (data || []).map((u: any) => u.id);
    let subByUser: Record<string, { plan: string; expires_at: string | null }> = {};
    if (ids.length) {
      const { data: subs } = await supabaseAdmin
        .from('subscriptions')
        .select('user_id, plan, expires_at, status')
        .in('user_id', ids)
        .neq('plan', 'free');
      const now = Date.now();
      subByUser = Object.fromEntries(
        (subs || [])
          .filter(
            (s: any) =>
              s.status !== 'expired' &&
              (s.expires_at == null || new Date(s.expires_at).getTime() > now)
          )
          .map((s: any) => [s.user_id, { plan: s.plan, expires_at: s.expires_at }])
      );
    }

    return NextResponse.json({
      users: (data || []).map((u: any) => ({
        ...u,
        subscription: subByUser[u.id] || null,
      })),
    });
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
