import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/client';
import { activateSubscription, isAdminUser } from '@/lib/billing';
import { createNotification } from '@/lib/notify-server';
import {
  PLANS,
  planDurationDays,
  formatVnd,
  type BillingCycle,
  type PlanId,
} from '@/lib/plans';

// Admin xác nhận đã nhận tiền -> kích hoạt/gia hạn gói cho giáo viên.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !isAdminUser(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { orderId } = await params;
    const { data: order } = await supabaseAdmin
      .from('payment_orders')
      .select('id, user_id, plan, cycle, amount, status')
      .eq('id', orderId)
      .maybeSingle();

    if (!order) {
      return NextResponse.json({ error: 'Không tìm thấy đơn' }, { status: 404 });
    }
    if (order.status === 'paid') {
      return NextResponse.json({ success: true, alreadyPaid: true });
    }

    const plan = order.plan as Exclude<PlanId, 'free'>;
    const cycle = (order.cycle as BillingCycle) || 'monthly';
    const sub = await activateSubscription(
      order.user_id,
      plan,
      cycle,
      planDurationDays(cycle)
    );

    const nowIso = new Date().toISOString();
    await supabaseAdmin
      .from('payment_orders')
      .update({
        status: 'paid',
        paid_at: nowIso,
        confirmed_by: session.user.id,
        updated_at: nowIso,
      })
      .eq('id', orderId);

    await createNotification(order.user_id, {
      title: `Kích hoạt gói ${PLANS[plan].name} thành công`,
      body: `Đơn ${formatVnd(order.amount)} đã được xác nhận. Gói có hiệu lực đến ${new Date(
        sub.expiresAt as string
      ).toLocaleDateString('vi-VN')}.`,
      type: 'success',
      link: '/teacher/dashboard',
    });

    return NextResponse.json({ success: true, subscription: sub });
  } catch (error) {
    console.error('Confirm payment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
