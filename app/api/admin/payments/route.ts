import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/client';
import { isAdminUser } from '@/lib/billing';

// Danh sách đơn thanh toán cho admin đối soát (mặc định: chờ xử lý).
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !isAdminUser(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const status = request.nextUrl.searchParams.get('status'); // pending|awaiting|paid|all
    let query = supabaseAdmin
      .from('payment_orders')
      .select('id, user_id, plan, cycle, amount, transfer_code, status, created_at, paid_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!status || status === 'open') {
      query = query.in('status', ['pending', 'awaiting']);
    } else if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: orders } = await query;
    const list = orders || [];

    // Gắn thông tin người mua.
    const userIds = [...new Set(list.map((o: any) => o.user_id))];
    let usersById: Record<string, { name: string; email: string }> = {};
    if (userIds.length) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, name, email')
        .in('id', userIds);
      usersById = Object.fromEntries(
        (users || []).map((u: any) => [u.id, { name: u.name || '', email: u.email }])
      );
    }

    return NextResponse.json({
      orders: list.map((o: any) => ({
        ...o,
        user: usersById[o.user_id] || { name: '', email: '' },
      })),
    });
  } catch (error) {
    console.error('Admin list payments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
