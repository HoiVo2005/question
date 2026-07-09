import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/client';
import { isAdminUser } from '@/lib/billing';
import { createNotification } from '@/lib/notify-server';

// Thu hồi gói của 1 giáo viên (đưa về Free).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !isAdminUser(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await params;
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('user_id', userId);
    if (error) {
      return NextResponse.json({ error: 'Không thu hồi được gói' }, { status: 500 });
    }

    await createNotification(userId, {
      title: 'Gói đã bị thu hồi',
      body: 'Quản trị viên đã đưa tài khoản của bạn về gói Miễn phí.',
      type: 'account',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Revoke subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
