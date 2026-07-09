import { NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/client';
import { isAdminUser } from '@/lib/billing';

const count = async (table: string, build?: (q: any) => any): Promise<number> => {
  let q = supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
  if (build) q = build(q);
  const { count: c } = await q;
  return c || 0;
};

// Số liệu tổng quan toàn hệ thống cho admin.
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !isAdminUser(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [
      totalUsers,
      teachers,
      students,
      admins,
      examSets,
      exams,
      submissions,
      classrooms,
      pendingOrders,
    ] = await Promise.all([
      count('users'),
      count('users', (q) => q.eq('role', 'teacher')),
      count('users', (q) => q.eq('role', 'student')),
      count('users', (q) => q.eq('role', 'admin')),
      count('exam_sets'),
      count('exams'),
      count('submissions'),
      count('classrooms'),
      count('payment_orders', (q) => q.in('status', ['pending', 'awaiting'])),
    ]);

    // Gói trả phí còn hiệu lực.
    const { data: subs } = await supabaseAdmin
      .from('subscriptions')
      .select('plan, status, expires_at')
      .neq('plan', 'free');
    const now = Date.now();
    const activeSubs = (subs || []).filter(
      (s: any) =>
        s.status !== 'expired' &&
        (s.expires_at == null || new Date(s.expires_at).getTime() > now)
    ).length;

    // Doanh thu = tổng các đơn đã thanh toán.
    const { data: paid } = await supabaseAdmin
      .from('payment_orders')
      .select('amount')
      .eq('status', 'paid');
    const revenue = (paid || []).reduce((s: number, o: any) => s + (o.amount || 0), 0);
    const paidCount = (paid || []).length;

    return NextResponse.json({
      users: { total: totalUsers, teachers, students, admins },
      content: { examSets, exams, submissions, classrooms },
      billing: { activeSubs, pendingOrders, revenue, paidCount },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
