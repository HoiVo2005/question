import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/client';
import { activateSubscription, isAdminUser } from '@/lib/billing';
import { createNotification } from '@/lib/notify-server';
import {
  PLANS,
  PLAN_LABELS,
  planDurationDays,
  type BillingCycle,
  type PlanId,
} from '@/lib/plans';

// Danh sách gói đang hoạt động (cho admin theo dõi / gia hạn).
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !isAdminUser(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: subs } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id, plan, cycle, status, expires_at, updated_at')
      .neq('plan', 'free')
      .order('updated_at', { ascending: false })
      .limit(200);

    const list = subs || [];
    const userIds = [...new Set(list.map((s: any) => s.user_id))];
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
      subscriptions: list.map((s: any) => ({
        ...s,
        user: usersById[s.user_id] || { name: '', email: '' },
      })),
    });
  } catch (error) {
    console.error('Admin list subscriptions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Admin cấp / gia hạn gói thủ công theo email (dùng cho gói MAX – Liên hệ).
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !isAdminUser(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, plan, cycle, days } = (await request.json()) as {
      email: string;
      plan: Exclude<PlanId, 'free'>;
      cycle: BillingCycle;
      days?: number;
    };

    if (!email || !PLANS[plan]) {
      return NextResponse.json({ error: 'Thiếu email hoặc gói không hợp lệ' }, { status: 400 });
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, role, email')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng với email này' }, { status: 404 });
    }
    if (user.role !== 'teacher') {
      return NextResponse.json({ error: 'Chỉ cấp gói cho tài khoản giáo viên' }, { status: 400 });
    }

    const billingCycle: BillingCycle = cycle === 'yearly' ? 'yearly' : 'monthly';
    const duration =
      typeof days === 'number' && days > 0 ? Math.floor(days) : planDurationDays(billingCycle);

    const sub = await activateSubscription(user.id, plan, billingCycle, duration);

    await createNotification(user.id, {
      title: `Bạn đã được cấp gói ${PLAN_LABELS[plan]}`,
      body: `Gói ${PLAN_LABELS[plan]} có hiệu lực đến ${new Date(
        sub.expiresAt as string
      ).toLocaleDateString('vi-VN')}.`,
      type: 'success',
      link: '/teacher/dashboard',
    });

    return NextResponse.json({ success: true, subscription: sub });
  } catch (error) {
    console.error('Admin grant subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
