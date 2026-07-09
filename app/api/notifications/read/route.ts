import { NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/client';

// Đánh dấu tất cả thông báo là đã đọc.
export async function POST() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', session.user.id)
      .eq('is_read', false);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
