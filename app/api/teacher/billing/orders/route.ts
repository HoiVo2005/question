import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/client';
import {
  buildVietQrUrl,
  generateTransferCode,
  paymentAccountInfo,
} from '@/lib/billing';
import {
  PLANS,
  vndPrice,
  type BillingCycle,
  type PlanId,
} from '@/lib/plans';

const PAID_PLANS: PlanId[] = ['plus', 'pro', 'max'];

// Tạo đơn thanh toán mới (sinh nội dung CK + QR VietQR).
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((session.user as any).role !== 'teacher') {
      return NextResponse.json({ error: 'Chỉ giáo viên mới mua gói' }, { status: 403 });
    }

    const { plan, cycle } = (await request.json()) as {
      plan: PlanId;
      cycle: BillingCycle;
    };
    if (!PAID_PLANS.includes(plan) || plan === 'max') {
      // MAX là gói liên hệ, không tự tạo đơn.
      return NextResponse.json({ error: 'Gói không hợp lệ' }, { status: 400 });
    }
    const billingCycle: BillingCycle = cycle === 'yearly' ? 'yearly' : 'monthly';
    const amount = vndPrice(plan as Exclude<PlanId, 'free'>, billingCycle);
    const transferCode = generateTransferCode();

    const { data, error } = await supabaseAdmin
      .from('payment_orders')
      .insert([
        {
          user_id: session.user.id,
          plan,
          cycle: billingCycle,
          amount,
          transfer_code: transferCode,
          status: 'pending',
        },
      ])
      .select('id, plan, cycle, amount, transfer_code, status, created_at')
      .single();

    if (error || !data) {
      console.error('Create order error:', error);
      return NextResponse.json({ error: 'Không tạo được đơn' }, { status: 500 });
    }

    const account = paymentAccountInfo();
    return NextResponse.json(
      {
        order: {
          id: data.id,
          plan: data.plan,
          planName: PLANS[plan as Exclude<PlanId, 'free'>].name,
          cycle: data.cycle,
          amount: data.amount,
          transferCode: data.transfer_code,
          status: data.status,
          createdAt: data.created_at,
        },
        qrUrl: account.configured
          ? buildVietQrUrl(amount, transferCode)
          : null,
        account,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Danh sách đơn của chính giáo viên.
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data } = await supabaseAdmin
      .from('payment_orders')
      .select('id, plan, cycle, amount, transfer_code, status, created_at, paid_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({ orders: data || [] });
  } catch (error) {
    console.error('List orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
