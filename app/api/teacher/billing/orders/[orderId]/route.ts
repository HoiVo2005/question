import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/client';
import {
  buildVietQrUrl,
  paymentAccountInfo,
} from '@/lib/billing';
import { PLANS, type PlanId } from '@/lib/plans';

// Trạng thái 1 đơn (để trang checkout poll cho tới khi admin xác nhận).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { orderId } = await params;
    const { data } = await supabaseAdmin
      .from('payment_orders')
      .select('id, user_id, plan, cycle, amount, transfer_code, status, created_at, paid_at')
      .eq('id', orderId)
      .maybeSingle();

    if (!data || data.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Không tìm thấy đơn' }, { status: 404 });
    }

    const account = paymentAccountInfo();
    return NextResponse.json({
      order: {
        id: data.id,
        plan: data.plan,
        planName: PLANS[data.plan as Exclude<PlanId, 'free'>]?.name ?? data.plan,
        cycle: data.cycle,
        amount: data.amount,
        transferCode: data.transfer_code,
        status: data.status,
        createdAt: data.created_at,
        paidAt: data.paid_at,
      },
      qrUrl: account.configured
        ? buildVietQrUrl(data.amount, data.transfer_code)
        : null,
      account,
    });
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Người dùng bấm "Tôi đã chuyển khoản" -> chuyển đơn sang 'awaiting' chờ admin.
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { orderId } = await params;
    const { data } = await supabaseAdmin
      .from('payment_orders')
      .select('id, user_id, status')
      .eq('id', orderId)
      .maybeSingle();

    if (!data || data.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Không tìm thấy đơn' }, { status: 404 });
    }
    if (data.status === 'paid') {
      return NextResponse.json({ success: true, status: 'paid' });
    }

    await supabaseAdmin
      .from('payment_orders')
      .update({ status: 'awaiting', updated_at: new Date().toISOString() })
      .eq('id', orderId);

    return NextResponse.json({ success: true, status: 'awaiting' });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
